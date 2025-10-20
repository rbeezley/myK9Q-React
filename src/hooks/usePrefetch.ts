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

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PrefetchQueueItem {
  key: string;
  fetcher: () => Promise<any>;
  priority: number;
  timestamp: number;
}

/**
 * Global prefetch cache (shared across all components)
 */
const prefetchCache = new Map<string, CachedData<any>>();

/**
 * Global prefetch queue (for prioritization)
 */
const prefetchQueue: PrefetchQueueItem[] = [];

/**
 * Currently active prefetches (to avoid duplicates)
 */
const activePrefetches = new Set<string>();

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
    const cached = prefetchCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const age = (now - cached.timestamp) / 1000; // seconds

    if (age > cached.ttl) {
      // Expired - remove from cache
      prefetchCache.delete(key);
      return null;
    }

    return cached.data as T;
  }, []);

  /**
   * Check if data is in cache (L1 + L2) - asynchronous
   */
  const getCachedAsync = useCallback(async <T,>(key: string): Promise<T | null> => {
    // L1: Check in-memory cache first
    const memCached = getCached<T>(key);
    if (memCached) return memCached;

    // L2: Check IndexedDB
    try {
      const idbCached = await idbCache.get<T>(key);
      if (idbCached && idbCached.data) {
        const now = Date.now();
        const age = (now - idbCached.timestamp) / 1000; // seconds

        // Check if expired (TTL is in milliseconds in IndexedDB)
        const ttlSeconds = (idbCached.ttl || 60000) / 1000;
        if (age > ttlSeconds) {
          // Expired - delete
          await idbCache.delete(key);
          return null;
        }

        // Populate L1 cache
        prefetchCache.set(key, {
          data: idbCached.data,
          timestamp: idbCached.timestamp,
          ttl: ttlSeconds,
        });

        console.log(`💾 Loaded from IndexedDB prefetch cache: ${key}`);
        return idbCached.data as T;
      }
    } catch (error) {
      console.error(`❌ Failed to load from IndexedDB: ${key}`, error);
    }

    return null;
  }, [getCached]);

  /**
   * Store data in cache (L1 + L2)
   */
  const setCached = useCallback(async <T,>(key: string, data: T, ttl: number, persist: boolean = true) => {
    const timestamp = Date.now();

    // L1: Store in memory
    prefetchCache.set(key, {
      data,
      timestamp,
      ttl,
    });

    // L2: Store in IndexedDB (async, non-blocking)
    if (persist) {
      try {
        await idbCache.set(key, data, ttl * 1000); // Convert seconds to milliseconds
      } catch (error) {
        console.error(`❌ Failed to persist prefetch to IndexedDB: ${key}`, error);
      }
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
      priority = 0,
      ttl = 60,
      force = false,
      signal,
      persist = true,
    } = options;

    // Check cache first (L1 + L2)
    if (!force) {
      const cached = await getCachedAsync<T>(key);
      if (cached) {
        console.log(`✅ Prefetch cache hit: ${key}`);
        return cached;
      }
    }

    // Don't prefetch if already in progress
    if (activePrefetches.has(key)) {
      console.log(`⏳ Prefetch already in progress: ${key}`);
      return null;
    }

    // Add to active prefetches
    activePrefetches.add(key);
    setIsPrefetching(true);

    try {
      console.log(`🚀 Prefetching: ${key} (priority: ${priority})`);

      // Create abort controller if not provided
      const controller = signal ? null : new AbortController();
      if (controller) {
        abortControllerRef.current = controller;
      }

      // Fetch data
      const data = await fetcher();

      // Check if aborted
      if (signal?.aborted || controller?.signal.aborted) {
        console.log(`❌ Prefetch aborted: ${key}`);
        return null;
      }

      // Store in cache (L1 + L2)
      await setCached(key, data, ttl, persist);
      console.log(`✅ Prefetch complete: ${key}`);

      return data;

    } catch (error) {
      console.error(`❌ Prefetch failed: ${key}`, error);
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
    if (getCached(key)) return;

    // Don't queue if already in queue
    const existing = prefetchQueue.find(item => item.key === key);
    if (existing) {
      // Update priority if higher
      if (priority > existing.priority) {
        existing.priority = priority;
      }
      return;
    }

    // Add to queue
    prefetchQueue.push({
      key,
      fetcher,
      priority,
      timestamp: Date.now(),
    });

    // Sort by priority (highest first)
    prefetchQueue.sort((a, b) => b.priority - a.priority);
  }, [getCached]);

  /**
   * Process prefetch queue (call this during idle time)
   */
  const processQueue = useCallback(async (maxItems: number = 3) => {
    const items = prefetchQueue.splice(0, maxItems);

    await Promise.all(
      items.map(item => prefetch(item.key, item.fetcher, { priority: item.priority }))
    );
  }, [prefetch]);

  /**
   * Clear cache (useful for logout/data refresh) - clears both L1 and L2
   */
  const clearCache = useCallback(async (pattern?: string | RegExp) => {
    if (!pattern) {
      // Clear all caches
      prefetchCache.clear();
      try {
        await idbCache.clear();
        console.log('🗑️ Prefetch cache cleared (L1 + L2)');
      } catch (error) {
        console.error('❌ Failed to clear IndexedDB prefetch cache', error);
      }
      return;
    }

    const regex = typeof pattern === 'string'
      ? new RegExp(pattern)
      : pattern;

    // Clear L1 (in-memory)
    for (const [key] of prefetchCache.entries()) {
      if (regex.test(key)) {
        prefetchCache.delete(key);
      }
    }

    // Clear L2 (IndexedDB) - more expensive, do async
    try {
      const allEntries = await idbCache.getAll();
      const deletePromises = allEntries
        .filter((entry) => regex.test(entry.key))
        .map((entry) => idbCache.delete(entry.key));
      await Promise.all(deletePromises);
      console.log(`🗑️ Prefetch cache pattern cleared: ${pattern}`);
    } catch (error) {
      console.error('❌ Failed to clear IndexedDB prefetch cache pattern', error);
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

  const scheduleIdleCallback = useCallback(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => callbackRef.current());
    } else {
      // Fallback for Safari
      setTimeout(() => callbackRef.current(), 1);
    }
  }, []);

  // Run during idle time
  return scheduleIdleCallback;
}
