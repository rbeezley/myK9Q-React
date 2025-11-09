/**
 * Stale-While-Revalidate Hook with IndexedDB Persistence
 *
 * Pattern: Show cached data immediately, refresh in background
 *
 * Benefits:
 * - Instant navigation (shows cached data < 10ms)
 * - Always fresh data (background refresh)
 * - Never shows blank screens
 * - Reduces perceived loading time to zero
 * - Survives page reloads (IndexedDB persistence)
 * - Works offline with cached data
 *
 * Cache Strategy:
 * - L1: In-memory Map (< 1ms access)
 * - L2: IndexedDB (< 10ms access, persistent)
 * - L3: Network fetch (100-500ms)
 *
 * @example
 * const { data, isStale, isRefreshing, error, refresh } = useStaleWhileRevalidate(
 *   'entries-class-123',
 *   () => getClassEntries(123, licenseKey),
 *   { ttl: 60000, persist: true } // 1 minute cache, persist to IndexedDB
 * );
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cache as idbCache } from '@/utils/indexedDB';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  error?: Error;
}

interface UseStaleWhileRevalidateOptions {
  /** Time to live in milliseconds (default: 60000 = 1 minute) */
  ttl?: number;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Whether to refetch when window regains focus (default: true) */
  refetchOnFocus?: boolean;
  /** Whether to refetch when network reconnects (default: true) */
  refetchOnReconnect?: boolean;
  /** Whether to persist to IndexedDB (default: true) */
  persist?: boolean;
}

// In-memory cache shared across all hook instances
const cache = new Map<string, CacheEntry<any>>();

export function useStaleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseStaleWhileRevalidateOptions = {}
) {
  const {
    ttl = 60000, // 1 minute default
    fetchOnMount = true,
    refetchOnFocus = true,
    refetchOnReconnect = true,
    persist = true, // Persist by default
  } = options;

  const [data, setData] = useState<T | null>(() => {
    // L1: Try in-memory cache first (< 1ms)
    const cached = cache.get(key);
    return cached?.data ?? null;
  });

  const [isStale, setIsStale] = useState(() => {
    const cached = cache.get(key);
    if (!cached) return true;
    return Date.now() - cached.timestamp > ttl;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(() => {
    const cached = cache.get(key);
    return cached?.error ?? null;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // L2: Load from IndexedDB on mount (if not in L1 cache)
  useEffect(() => {
    if (!persist) {
      setIsHydrated(true);
      return;
    }

    const loadFromIndexedDB = async () => {
      // Skip if already in memory cache
      if (cache.has(key)) {
        setIsHydrated(true);
        return;
      }

      try {
        const cached = await idbCache.get<T>(key);
        if (cached && cached.data) {
          console.log(`💾 Loaded from IndexedDB: ${key}`);

          // Populate in-memory cache
          cache.set(key, {
            data: cached.data,
            timestamp: cached.timestamp,
          });

          // Update state
          setData(cached.data);

          // Check if stale
          const age = Date.now() - cached.timestamp;
          setIsStale(age > ttl);
        }
      } catch (error) {
        console.error(`❌ Failed to load from IndexedDB: ${key}`, error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadFromIndexedDB();
  }, [key, persist, ttl]);

  const refresh = useCallback(async (forceRefresh = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Check cache freshness
    const cached = cache.get(key);
    const isCacheValid = cached && (Date.now() - cached.timestamp) < ttl;

    // IMPORTANT: Always fetch if forcing refresh (for local-first architecture)
    // The fetcher (getClassEntries) merges database data with localStateManager pending changes
    // Even if cache is fresh, we MUST call fetcher to get pending changes merged
    if (forceRefresh) {
      console.log(`🔄 Force refresh requested for key: ${key}, bypassing cache`);
      // Don't return early - fall through to fetch
    } else if (isCacheValid) {
      // Cache is valid and not forcing - return cached data
      setData(cached.data);
      setIsStale(false);
      setError(null);
      return cached.data;
    }

    // If we have stale data, show it immediately while refreshing
    if (cached?.data) {
      setData(cached.data);
      setIsStale(true);
    }

    setIsRefreshing(true);
    setError(null);

    try {
      console.log(`🔄 Fetching fresh data for key: ${key}${forceRefresh ? ' (forced)' : ''}`);
      const freshData = await fetcher();

      // Check if component is still mounted and request wasn't aborted
      if (!isMountedRef.current || abortControllerRef.current?.signal.aborted) {
        return;
      }

      const timestamp = Date.now();

      // Update L1 cache (in-memory)
      cache.set(key, {
        data: freshData,
        timestamp,
      });

      // Update L2 cache (IndexedDB) asynchronously
      if (persist) {
        idbCache.set(key, freshData, ttl).catch((error) => {
          console.error(`❌ Failed to persist to IndexedDB: ${key}`, error);
        });
      }

      // Update state
      setData(freshData);
      setIsStale(false);
      setError(null);

      console.log(`✅ Fresh data cached for key: ${key}`);
      return freshData;

    } catch (err) {
      if (!isMountedRef.current || abortControllerRef.current?.signal.aborted) {
        return;
      }

      const error = err as Error;
      console.error(`❌ Error fetching data for key: ${key}`, error);

      // Update cache with error
      if (cached?.data) {
        // Keep stale data on error
        cache.set(key, {
          data: cached.data,
          timestamp: cached.timestamp,
          error,
        });
      }

      setError(error);

    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [key, fetcher, ttl, persist]);

  // Fetch on mount (wait for IndexedDB hydration first)
  useEffect(() => {
    if (fetchOnMount && isHydrated) {
      refresh();
    }
  }, [fetchOnMount, isHydrated, refresh]);

  // Refetch on window focus (always refresh, not just stale data)
  // BUT only if online - offline will use cached data
  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      if (navigator.onLine) {
        console.log(`👀 Window focused, forcing refresh for: ${key}`);
        refresh(true); // Always force refresh on focus to catch changes from other pages
      } else {
        console.log(`👀 Window focused but offline, using cached data for: ${key}`);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, refetchOnFocus, refresh]);

  // Refetch on network reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return;

    const handleOnline = () => {
      console.log(`📶 Network reconnected, refreshing data for: ${key}`);
      refresh(true); // Force refresh on reconnect
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [key, refetchOnReconnect, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    /** The data (may be stale if isStale is true) */
    data,
    /** Whether the data is stale and being refreshed */
    isStale,
    /** Whether currently fetching fresh data */
    isRefreshing,
    /** Whether IndexedDB has been hydrated (initial load complete) */
    isHydrated,
    /** Error if fetch failed (stale data is still shown) */
    error,
    /** Manually trigger a refresh */
    refresh,
  };
}

/**
 * Clear cache for a specific key (both L1 and L2)
 */
export async function clearCache(key: string) {
  // Clear L1 (in-memory)
  cache.delete(key);

  // Clear L2 (IndexedDB)
  try {
    await idbCache.delete(key);
    console.log(`🗑️ Cache cleared for key: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to clear IndexedDB cache: ${key}`, error);
  }
}

/**
 * Clear all cache (both L1 and L2)
 */
export async function clearAllCache() {
  // Clear L1 (in-memory)
  cache.clear();

  // Clear L2 (IndexedDB)
  try {
    await idbCache.clear();
    console.log('🗑️ All cache cleared');
  } catch (error) {
    console.error('❌ Failed to clear IndexedDB cache', error);
  }
}

/**
 * Get cache statistics (L1 only - fast)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Get full cache statistics (including IndexedDB)
 */
export async function getFullCacheStats() {
  const memoryStats = getCacheStats();

  try {
    const idbEntries = await idbCache.getAll();
    return {
      memory: memoryStats,
      indexedDB: {
        size: idbEntries.length,
        keys: idbEntries.map((e) => e.key),
      },
      total: memoryStats.size + idbEntries.length,
    };
  } catch (error) {
    console.error('❌ Failed to get IndexedDB stats', error);
    return {
      memory: memoryStats,
      indexedDB: { size: 0, keys: [] },
      total: memoryStats.size,
    };
  }
}
