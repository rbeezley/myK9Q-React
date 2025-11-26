/**
 * IndexedDB Wrapper for Persistent Caching
 *
 * Provides a simple Promise-based API for storing and retrieving data
 * in IndexedDB for offline-first functionality.
 *
 * **MIGRATED TO IDB LIBRARY** (Phase 1 Day 3-4)
 * - Replaced raw IndexedDB callbacks with idb promise-based API
 * - Maintains backward compatibility with existing API
 * - Simplified error handling and transaction management
 *
 * Features:
 * - Type-safe storage with TypeScript generics
 * - Automatic schema versioning
 * - TTL-based expiration
 * - Storage quota management
 * - Batch operations for performance
 *
 * Database Structure:
 * - cache: General purpose cache (prefetch, SWR data)
 * - mutations: Offline mutation queue (scores, check-ins)
 * - shows: Complete show data for offline operation
 * - metadata: App metadata and settings
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'myK9Q';
const DB_VERSION = 1;

// Store names
export const STORES = {
  CACHE: 'cache',
  MUTATIONS: 'mutations',
  SHOWS: 'shows',
  METADATA: 'metadata',
} as const;

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  size?: number; // Approximate size in bytes
}

export interface MutationEntry {
  id: string;
  type: 'UPDATE_STATUS' | 'SUBMIT_SCORE' | 'RESET_SCORE' | 'UPDATE_ENTRY';
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
  status: 'pending' | 'syncing' | 'failed' | 'success';
}

export interface ShowData {
  licenseKey: string;
  showInfo: any;
  trials: any[];
  classes: any[];
  entries: any[];
  results: any[];
  timestamp: number;
}

export interface Metadata {
  key: string;
  value: any;
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<IDBPDatabase> | null = null;

  /**
   * Initialize the database connection using idb library
   */
  async init(): Promise<IDBPDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, _transaction) {
// Cache store - for prefetch and SWR data
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('ttl', 'ttl', { unique: false });
}

        // Mutations store - for offline queue
        if (!db.objectStoreNames.contains(STORES.MUTATIONS)) {
          const mutationStore = db.createObjectStore(STORES.MUTATIONS, { keyPath: 'id' });
          mutationStore.createIndex('status', 'status', { unique: false });
          mutationStore.createIndex('timestamp', 'timestamp', { unique: false });
          mutationStore.createIndex('type', 'type', { unique: false });
}

        // Shows store - for complete show data
        if (!db.objectStoreNames.contains(STORES.SHOWS)) {
          const showStore = db.createObjectStore(STORES.SHOWS, { keyPath: 'licenseKey' });
          showStore.createIndex('timestamp', 'timestamp', { unique: false });
}

        // Metadata store - for app settings
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
}

},
    });

    this.db = await this.initPromise;
return this.db;
  }

  /**
   * Get a value from a store
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.init();
      const result = await db.get(storeName, key);

      // Check TTL expiration for cache entries
      if (result && storeName === STORES.CACHE) {
        const entry = result as CacheEntry;
        if (entry.ttl) {
          const age = Date.now() - entry.timestamp;
          if (age > entry.ttl) {
            // Expired - delete and return null
            await this.delete(storeName, key);
            return null;
          }
        }
      }

      return result || null;
    } catch (error) {
      console.error('❌ IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Set a value in a store
   */
  async set<T>(storeName: string, value: T): Promise<void> {
    try {
      const db = await this.init();

      // Add size estimate for cache entries
      if (storeName === STORES.CACHE && (value as any).data) {
        (value as any).size = this.estimateSize((value as any).data);
      }

      await db.put(storeName, value);
    } catch (error) {
      console.error('❌ IndexedDB set error:', error);
      throw error;
    }
  }

  /**
   * Delete a value from a store
   */
  async delete(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.init();
      await db.delete(storeName, key);
    } catch (error) {
      console.error('❌ IndexedDB delete error:', error);
    }
  }

  /**
   * Get all values from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.init();
      let results = await db.getAll(storeName);

      // Filter expired cache entries
      if (storeName === STORES.CACHE) {
        const now = Date.now();
        const validResults: T[] = [];

        for (const entry of results as CacheEntry[]) {
          if (entry.ttl) {
            const age = now - entry.timestamp;
            if (age > entry.ttl) {
              // Delete expired entry
              await this.delete(storeName, entry.key);
              continue;
            }
          }
          validResults.push(entry as T);
        }

        return validResults;
      }

      return results;
    } catch (error) {
      console.error('❌ IndexedDB getAll error:', error);
      return [];
    }
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.init();
      await db.clear(storeName);
} catch (error) {
      console.error('❌ IndexedDB clear error:', error);
    }
  }

  /**
   * Get all values matching an index query
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    try {
      const db = await this.init();
      const tx = db.transaction(storeName, 'readonly');
      const index = tx.store.index(indexName);
      const results = await index.getAll(value);
      await tx.done;
      return results;
    } catch (error) {
      console.error('❌ IndexedDB getByIndex error:', error);
      return [];
    }
  }

  /**
   * Batch set multiple values (more efficient)
   */
  async batchSet<T>(storeName: string, values: T[]): Promise<void> {
    try {
      const db = await this.init();
      const tx = db.transaction(storeName, 'readwrite');

      // Add size estimates for cache entries
      if (storeName === STORES.CACHE) {
        values.forEach((value: any) => {
          if (value.data) {
            value.size = this.estimateSize(value.data);
          }
        });
      }

      // Use Promise.all for parallel puts within transaction
      await Promise.all(values.map((value) => tx.store.put(value)));
      await tx.done;

} catch (error) {
      console.error('❌ IndexedDB batchSet error:', error);
      throw error;
    }
  }

  /**
   * Delete expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const entries = await this.getAll<CacheEntry>(STORES.CACHE);
      const now = Date.now();
      let deletedCount = 0;

      const db = await this.init();
      const tx = db.transaction(STORES.CACHE, 'readwrite');

      for (const entry of entries) {
        if (entry.ttl) {
          const age = now - entry.timestamp;
          if (age > entry.ttl) {
            await tx.store.delete(entry.key);
            deletedCount++;
          }
        }
      }

      await tx.done;

      if (deletedCount > 0) {}

      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to clean expired cache:', error);
      return 0;
    }
  }

  /**
   * Get estimated storage usage
   */
  async getStorageInfo(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
    cacheSize: number;
    mutationCount: number;
    showCount: number;
  }> {
    try {
      // Get storage estimate
      const estimate = await navigator.storage?.estimate();
      const usage = estimate?.usage || 0;
      const quota = estimate?.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      // Get cache size
      const cacheEntries = await this.getAll<CacheEntry>(STORES.CACHE);
      const cacheSize = cacheEntries.reduce((sum, entry) => sum + (entry.size || 0), 0);

      // Get counts
      const mutations = await this.getAll(STORES.MUTATIONS);
      const shows = await this.getAll(STORES.SHOWS);

      return {
        usage,
        quota,
        percentage,
        cacheSize,
        mutationCount: mutations.length,
        showCount: shows.length,
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return {
        usage: 0,
        quota: 0,
        percentage: 0,
        cacheSize: 0,
        mutationCount: 0,
        showCount: 0,
      };
    }
  }

  /**
   * Estimate size of data in bytes (rough approximation)
   */
  private estimateSize(data: any): number {
    try {
      const str = JSON.stringify(data);
      return new Blob([str]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
}
  }
}

// Singleton instance
export const db = new IndexedDBManager();

// Initialize on import
db.init().catch((error) => {
  console.error('❌ Failed to initialize IndexedDB:', error);
});

// Export convenience functions
export const cache = {
  get: <T>(key: string) => db.get<CacheEntry<T>>(STORES.CACHE, key),
  set: <T>(key: string, data: T, ttl?: number) =>
    db.set<CacheEntry<T>>(STORES.CACHE, {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    }),
  delete: (key: string) => db.delete(STORES.CACHE, key),
  getAll: () => db.getAll<CacheEntry>(STORES.CACHE),
  clear: () => db.clear(STORES.CACHE),
};

export const mutations = {
  get: (id: string) => db.get<MutationEntry>(STORES.MUTATIONS, id),
  set: (mutation: MutationEntry) => db.set(STORES.MUTATIONS, mutation),
  delete: (id: string) => db.delete(STORES.MUTATIONS, id),
  getAll: () => db.getAll<MutationEntry>(STORES.MUTATIONS),
  getPending: () =>
    db.getByIndex<MutationEntry>(STORES.MUTATIONS, 'status', 'pending'),
  clear: () => db.clear(STORES.MUTATIONS),
};

export const shows = {
  get: (licenseKey: string) => db.get<ShowData>(STORES.SHOWS, licenseKey),
  set: (showData: ShowData) => db.set(STORES.SHOWS, showData),
  delete: (licenseKey: string) => db.delete(STORES.SHOWS, licenseKey),
  getAll: () => db.getAll<ShowData>(STORES.SHOWS),
  clear: () => db.clear(STORES.SHOWS),
};

export const metadata = {
  get: (key: string) => db.get<Metadata>(STORES.METADATA, key),
  set: (key: string, value: any) =>
    db.set<Metadata>(STORES.METADATA, {
      key,
      value,
      timestamp: Date.now(),
    }),
  delete: (key: string) => db.delete(STORES.METADATA, key),
  getAll: () => db.getAll<Metadata>(STORES.METADATA),
  clear: () => db.clear(STORES.METADATA),
};
