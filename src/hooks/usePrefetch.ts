/**
 * Prefetch Hook for Anticipatory Data Loading with IndexedDB Persistence
 *
 * Implements aggressive prefetching to make navigation feel instant:
 * - Hover prefetch (desktop): Load data when user hovers over link
 * - Touchstart prefetch (mobile): Load data when user touches link
 * - Smart prefetch queue: Prioritize likely next actions
 * - Dual-layer cache: In-memory + IndexedDB for persistence
 * - Survives page reloads with IndexedDB
 *
 * Cache Strategy:
 * - L1: In-memory Map (< 1ms access)
 * - L2: IndexedDB (< 10ms access, persistent)
 * - L3: Network fetch (100-500ms)
 *
 * Refactored as part of DEBT-008 to reduce complexity.
 *
 * Usage:
 * ```tsx
 * const { prefetch, isPrefetching } = usePrefetch();
 *
 * <Link
 *   to="/entries/123"
 *   onMouseEnter={() => prefetch('/entries/123', fetchEntryData, { persist: true })}
 *   onTouchStart={() => prefetch('/entries/123', fetchEntryData, { persist: true })}
 * >
 *   View Entry
 * </Link>
 * ```
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { cache as idbCache } from '@/utils/indexedDB';
import {
  isCacheValid,
  createCacheEntry,
  type CachedData,
} from '@/utils/cacheHelpers';
import {
  insertWithPriority,
  updatePriorityIfHigher,
  dequeueN,
  hasKey,
  type PriorityQueueItem,
} from '@/utils/queueHelpers';
import { scheduleIdleTask } from '@/utils/idleCallbackHelpers';
import { logger } from '@/utils/logger';

// ========================================
// TYPES
// ========================================

interface PrefetchOptions {
  /** Priority of this prefetch (higher = more important) */
  priority?: number;
  /** Time-to-live in seconds (default: 60) */
  ttl?: number;
  /** Force prefetch even if already cached */
  force?: boolean;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Whether to persist to IndexedDB (default: true) */
  persist?: boolean;
}

/**
 * Extended queue item with fetcher function
 */
interface PrefetchQueueData {
  fetcher: () => Promise<any>;
}

// ========================================
// GLOBAL STATE (shared across components)
// ========================================

/** Global prefetch cache (L1 - in-memory) */
const prefetchCache = new Map<string, CachedData<any>>();

/** Global prefetch queue (for prioritization) */
const prefetchQueue: PriorityQueueItem<PrefetchQueueData>[] = [];

/** Currently active prefetches (to avoid duplicates) */
const activePrefetches = new Set<string>();

// ========================================
// HELPER FUNCTIONS (extracted for reduced complexity)
// ========================================

/**
 * Validate and return L1 (in-memory) cached data
 */
function getL1Cache<T>(key: string): T | null {
  const cached = prefetchCache.get(key);
  if (!cached) return null;

  if (!isCacheValid(cached)) {
    prefetchCache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Convert IDB cache entry to standard cache format and validate
 */
function validateIdbCacheEntry<T>(idbCached: { data: unknown; timestamp: number; ttl?: number }): CachedData<T> | null {
  const ttlSeconds = (idbCached.ttl || 60000) / 1000;
  const cacheEntry: CachedData<T> = {
    data: idbCached.data as T,
    timestamp: idbCached.timestamp,
    ttl: ttlSeconds,
  };

  if (!isCacheValid(cacheEntry)) {
    return null;
  }

  return cacheEntry;
}

/**
 * Try to get data from L2 (IndexedDB) cache
 */
async function getL2Cache<T>(key: string): Promise<{ data: T; cacheEntry: CachedData<T> } | null> {
  try {
    const idbCached = await idbCache.get<T>(key);
    if (!idbCached || !idbCached.data) return null;

    const cacheEntry = validateIdbCacheEntry<T>(idbCached);
    if (!cacheEntry) {
      await idbCache.delete(key);
      return null;
    }

    return { data: idbCached.data as T, cacheEntry };
  } catch (error) {
    logger.error(`Failed to load from IndexedDB: ${key}`, error);
    return null;
  }
}

/**
 * Store data in L2 (IndexedDB) cache
 */
async function setL2Cache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  try {
    await idbCache.set(key, data, ttlSeconds * 1000);
  } catch (error) {
    logger.error(`Failed to persist prefetch to IndexedDB: ${key}`, error);
  }
}

/**
 * Clear cache entries matching a pattern
 */
async function clearCachePattern(pattern: string | RegExp): Promise<void> {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  // Clear L1 (in-memory)
  for (const [key] of prefetchCache.entries()) {
    if (regex.test(key)) {
      prefetchCache.delete(key);
    }
  }

  // Clear L2 (IndexedDB)
  try {
    const allEntries = await idbCache.getAll();
    const deletePromises = allEntries
      .filter((entry) => regex.test(entry.key))
      .map((entry) => idbCache.delete(entry.key));
    await Promise.all(deletePromises);
  } catch (error) {
    logger.error('Failed to clear IndexedDB prefetch cache pattern', error);
  }
}

/**
 * Clear all cache entries
 */
async function clearAllCache(): Promise<void> {
  prefetchCache.clear();
  try {
    await idbCache.clear();
  } catch (error) {
    logger.error('Failed to clear IndexedDB prefetch cache', error);
  }
}

// ========================================
// MAIN HOOK
// ========================================

/**
 * Hook for data prefetching
 */
export function usePrefetch() {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Check if data is in cache and still valid (L1 only - synchronous)
   */
  const getCached = useCallback(<T,>(key: string): T | null => {
    return getL1Cache<T>(key);
  }, []);

  /**
   * Check if data is in cache (L1 + L2) - asynchronous
   */
  const getCachedAsync = useCallback(async <T,>(key: string): Promise<T | null> => {
    // L1: Check in-memory cache first
    const memCached = getL1Cache<T>(key);
    if (memCached) return memCached;

    // L2: Check IndexedDB
    const idbResult = await getL2Cache<T>(key);
    if (idbResult) {
      // Populate L1 cache
      prefetchCache.set(key, idbResult.cacheEntry);
      return idbResult.data;
    }

    return null;
  }, []);

  /**
   * Store data in cache (L1 + L2)
   */
  const setCached = useCallback(async <T,>(key: string, data: T, ttl: number, persist: boolean = true) => {
    // L1: Store in memory using cache helper
    const cacheEntry = createCacheEntry(data, ttl);
    prefetchCache.set(key, cacheEntry);

    // L2: Store in IndexedDB (async, non-blocking)
    if (persist) {
      await setL2Cache(key, data, ttl);
    }
  }, []);

  /**
   * Prefetch data and store in cache
   */
  const prefetch = useCallback(async <T,>(
    key: string,
    fetcher: () => Promise<T>,
    options: PrefetchOptions = {}
  ): Promise<T | null> => {
    const {
      priority: _priority = 0,
      ttl = 60,
      force = false,
      signal,
      persist = true,
    } = options;

    // Check cache first (L1 + L2)
    if (!force) {
      const cached = await getCachedAsync<T>(key);
      if (cached) return cached;
    }

    // Don't prefetch if already in progress
    if (activePrefetches.has(key)) return null;

    // Add to active prefetches
    activePrefetches.add(key);
    setIsPrefetching(true);

    try {
      // Create abort controller if not provided
      const controller = signal ? null : new AbortController();
      if (controller) {
        abortControllerRef.current = controller;
      }

      // Fetch data
      const data = await fetcher();

      // Check if aborted
      if (signal?.aborted || controller?.signal.aborted) return null;

      // Store in cache (L1 + L2)
      await setCached(key, data, ttl, persist);
      return data;

    } catch (error) {
      logger.error(`Prefetch failed: ${key}`, error);
      return null;

    } finally {
      // Remove from active prefetches
      activePrefetches.delete(key);

      // Update prefetching state
      if (activePrefetches.size === 0) {
        setIsPrefetching(false);
      }
    }
  }, [getCachedAsync, setCached]);

  /**
   * Add prefetch to queue (for batch processing)
   */
  const queuePrefetch = useCallback(<T,>(
    key: string,
    fetcher: () => Promise<T>,
    priority: number = 0
  ) => {
    // Don't queue if already cached
    if (getL1Cache(key)) return;

    // Update priority if already in queue
    if (hasKey(prefetchQueue, key)) {
      updatePriorityIfHigher(prefetchQueue, key, priority);
      return;
    }

    // Insert with priority
    insertWithPriority(prefetchQueue, {
      key,
      data: { fetcher },
      priority,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Process prefetch queue (call this during idle time)
   */
  const processQueue = useCallback(async (maxItems: number = 3) => {
    const items = dequeueN(prefetchQueue, maxItems);
    await Promise.all(
      items.map(item => prefetch(item.key, item.data.fetcher, { priority: item.priority }))
    );
  }, [prefetch]);

  /**
   * Clear cache (useful for logout/data refresh) - clears both L1 and L2
   */
  const clearCache = useCallback(async (pattern?: string | RegExp) => {
    if (pattern) {
      await clearCachePattern(pattern);
    } else {
      await clearAllCache();
    }
  }, []);

  /**
   * Cancel ongoing prefetches
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsPrefetching(false);
  }, []);

  return {
    /** Prefetch data and cache it */
    prefetch,

    /** Add prefetch to queue for later processing */
    queuePrefetch,

    /** Process queued prefetches */
    processQueue,

    /** Get cached data without prefetching (L1 only - sync) */
    getCached,

    /** Get cached data (L1 + L2 - async) */
    getCachedAsync,

    /** Clear prefetch cache */
    clearCache,

    /** Cancel ongoing prefetches */
    cancel,

    /** Whether currently prefetching */
    isPrefetching,

    /** Number of items in cache */
    cacheSize: prefetchCache.size,

    /** Number of items in queue */
    queueSize: prefetchQueue.length,
  };
}

// ========================================
// ADDITIONAL HOOKS
// ========================================

/**
 * Helper hook for link prefetching
 *
 * Usage:
 * ```tsx
 * const linkProps = useLinkPrefetch('/entries/123', fetchEntryData);
 * return <Link to="/entries/123" {...linkProps}>View Entry</Link>
 * ```
 */
export function useLinkPrefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: PrefetchOptions = {}
) {
  const { prefetch } = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    // Desktop: prefetch on hover
    prefetch(key, fetcher, options);
  }, [key, fetcher, options, prefetch]);

  const handleTouchStart = useCallback(() => {
    // Mobile: prefetch on touch
    prefetch(key, fetcher, options);
  }, [key, fetcher, options, prefetch]);

  return {
    onMouseEnter: handleMouseEnter,
    onTouchStart: handleTouchStart,
  };
}

/**
 * React Hook for requestIdleCallback (with fallback)
 */
export function useIdleCallback(callback: () => void) {
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const scheduleCallback = useCallback(() => {
    // Use idle callback helper (handles cross-browser compatibility)
    scheduleIdleTask(() => callbackRef.current());
  }, []);

  // Run during idle time
  return scheduleCallback;
}
