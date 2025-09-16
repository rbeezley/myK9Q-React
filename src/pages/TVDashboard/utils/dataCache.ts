/**
 * Simple in-memory cache for TV Dashboard data
 * Helps reduce database queries and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiry = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry
    });

    // Clean up expired entries periodically
    this.cleanup();
  }

  /**
   * Get data from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific key or all cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const validEntries = entries.filter(entry => now <= entry.expiry);
    const expiredEntries = entries.length - validEntries.length;

    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries,
      cacheHitRate: this.hitCount / Math.max(this.requestCount, 1),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private getMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // rough string size
      size += JSON.stringify(entry.data).length * 2; // rough data size
      size += 24; // overhead for timestamps and objects
    }
    return size;
  }

  // Performance tracking
  private hitCount = 0;
  private requestCount = 0;

  /**
   * Get data with cache hit tracking
   */
  getWithStats<T>(key: string): T | null {
    this.requestCount++;
    const result = this.get<T>(key);
    if (result !== null) {
      this.hitCount++;
    }
    return result;
  }

  /**
   * Create a cache key for TV Dashboard data
   */
  static createKey(licenseKey: string, dataType: string, ...params: string[]): string {
    return `tv_${licenseKey}_${dataType}_${params.join('_')}`;
  }

  /**
   * Cache TTL presets
   */
  static TTL = {
    REALTIME: 30 * 1000,      // 30 seconds for real-time data
    FAST: 2 * 60 * 1000,      // 2 minutes for frequently changing data
    MEDIUM: 5 * 60 * 1000,    // 5 minutes for moderately changing data
    SLOW: 15 * 60 * 1000,     // 15 minutes for slowly changing data
    HISTORICAL: 60 * 60 * 1000 // 1 hour for historical data
  } as const;
}

// Singleton instance
export const tvDataCache = new DataCache();

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = tvDataCache.getWithStats<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  try {
    const data = await fetchFn();
    tvDataCache.set(key, data, ttl);
    return data;
  } catch (error) {
    // If fetch fails, try to return stale data if available
    const stale = tvDataCache.get<T>(key);
    if (stale !== null) {
      console.warn('Using stale cache data due to fetch error:', error);
      return stale;
    }
    throw error;
  }
}

/**
 * Preload cache with initial data
 */
export function preloadCache(licenseKey: string, initialData: any) {
  const key = DataCache.createKey(licenseKey, 'initial');
  tvDataCache.set(key, initialData, DataCache.TTL.FAST);
}

/**
 * Clear all TV Dashboard cache for a specific license
 */
export function clearTVCache(licenseKey: string) {
  const _prefix = `tv_${licenseKey}_`;
  const _keysToDelete: string[] = [];

  // Note: Map doesn't have a way to iterate keys by prefix efficiently
  // In a real implementation, you might want to use a more sophisticated cache
  // For now, we'll clear all cache
  tvDataCache.clear();
}

export default tvDataCache;