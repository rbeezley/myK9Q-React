/**
 * ReplicatedTable - Generic Base Class for Table Replication
 *
 * Provides CRUD operations with automatic caching, sync, and conflict resolution.
 * All table-specific implementations extend this class.
 *
 * Phase 1 Implementation (Days 1-5)
 * - Core CRUD operations (get, set, delete, query)
 * - IndexedDB persistence
 * - TTL/expiration logic
 * - Subscription pattern for real-time updates
 */

import { openDB, IDBPDatabase } from 'idb';
import type {
  ReplicatedRow,
  SyncMetadata,
  PendingMutation,
  SyncResult,
  ConflictStrategy,
  QueryOptions,
} from './types';
import { logger } from '@/utils/logger';
import { getTableTTL } from '@/config/featureFlags';

const DB_NAME = 'myK9Q';
const DB_VERSION = 2; // Increment from current version (1)

/**
 * New object stores for replication system
 */
export const REPLICATION_STORES = {
  REPLICATED_TABLES: 'replicated_tables',
  SYNC_METADATA: 'sync_metadata',
  PENDING_MUTATIONS: 'pending_mutations',
} as const;

/**
 * Generic replicated table base class
 *
 * @template T - Type of the table row (must have an 'id' field)
 */
export abstract class ReplicatedTable<T extends { id: string }> {
  protected db: IDBPDatabase | null = null;
  protected listeners: Set<(data: T[]) => void> = new Set();
  protected ttl: number;

  constructor(
    protected tableName: string,
    customTTL?: number
  ) {
    this.ttl = customTTL || getTableTTL(tableName as any);
  }

  /**
   * Initialize IndexedDB connection
   */
  protected async init(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create replicated_tables store if it doesn't exist
        if (!db.objectStoreNames.contains(REPLICATION_STORES.REPLICATED_TABLES)) {
          const store = db.createObjectStore(REPLICATION_STORES.REPLICATED_TABLES, {
            keyPath: ['tableName', 'id'],
          });
          store.createIndex('tableName', 'tableName', { unique: false });
          store.createIndex('tableName_lastSyncedAt', ['tableName', 'lastSyncedAt'], { unique: false });
          store.createIndex('isDirty', 'isDirty', { unique: false });
        }

        // Create sync_metadata store
        if (!db.objectStoreNames.contains(REPLICATION_STORES.SYNC_METADATA)) {
          const metaStore = db.createObjectStore(REPLICATION_STORES.SYNC_METADATA, {
            keyPath: 'tableName',
          });
        }

        // Create pending_mutations store
        if (!db.objectStoreNames.contains(REPLICATION_STORES.PENDING_MUTATIONS)) {
          const mutationStore = db.createObjectStore(REPLICATION_STORES.PENDING_MUTATIONS, {
            keyPath: 'id',
          });
          mutationStore.createIndex('status', 'status', { unique: false });
          mutationStore.createIndex('tableName', 'tableName', { unique: false });
        }
      },
    });

    return this.db;
  }

  /**
   * Get single row by ID
   * Returns cached version if fresh, otherwise fetches from server
   */
  async get(id: string): Promise<T | null> {
    const db = await this.init();
    const key = [this.tableName, id];

    const row = await db.get(REPLICATION_STORES.REPLICATED_TABLES, key) as ReplicatedRow<T> | undefined;

    if (!row) {
      logger.log(`[${this.tableName}] Cache miss for ID: ${id}`);
      return null;
    }

    // Check if expired
    if (this.isExpired(row)) {
      logger.log(`[${this.tableName}] Cache expired for ID: ${id}`);
      await db.delete(REPLICATION_STORES.REPLICATED_TABLES, key);
      return null;
    }

    // Update last accessed time (for LRU)
    row.lastAccessedAt = Date.now();
    await db.put(REPLICATION_STORES.REPLICATED_TABLES, row);

    return row.data;
  }

  /**
   * Set (upsert) a row in local cache
   */
  async set(id: string, data: T, isDirty = false): Promise<void> {
    const db = await this.init();

    const existingRow = await db.get(REPLICATION_STORES.REPLICATED_TABLES, [this.tableName, id]) as ReplicatedRow<T> | undefined;

    const row: ReplicatedRow<T> = {
      tableName: this.tableName,
      id,
      data,
      version: existingRow ? existingRow.version + 1 : 1,
      lastSyncedAt: Date.now(),
      lastAccessedAt: Date.now(),
      isDirty,
      syncStatus: isDirty ? 'pending' : 'synced',
    };

    await db.put(REPLICATION_STORES.REPLICATED_TABLES, row);
    logger.log(`[${this.tableName}] Cached row: ${id} (dirty: ${isDirty})`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Delete a row from local cache
   */
  async delete(id: string): Promise<void> {
    const db = await this.init();
    await db.delete(REPLICATION_STORES.REPLICATED_TABLES, [this.tableName, id]);
    logger.log(`[${this.tableName}] Deleted row: ${id}`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Query rows by index
   * Example: queryIndex('class_id', '123') returns all entries with class_id = 123
   */
  async queryIndex(indexName: keyof T, value: any): Promise<T[]> {
    const allRows = await this.getAll();
    return allRows.filter((row) => (row as any)[indexName] === value);
  }

  /**
   * Get all rows for this table
   */
  async getAll(licenseKey?: string): Promise<T[]> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readonly');
    const index = tx.store.index('tableName');

    const rows = await index.getAll(this.tableName) as ReplicatedRow<T>[];

    // Filter expired rows
    const freshRows = rows.filter((row) => !this.isExpired(row));

    // Filter by license_key if provided (for multi-tenant isolation)
    if (licenseKey) {
      return freshRows
        .filter((row) => (row.data as any).license_key === licenseKey)
        .map((row) => row.data);
    }

    return freshRows.map((row) => row.data);
  }

  /**
   * Batch set (for initial sync)
   */
  async batchSet(items: T[]): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

    for (const item of items) {
      const row: ReplicatedRow<T> = {
        tableName: this.tableName,
        id: item.id,
        data: item,
        version: 1,
        lastSyncedAt: Date.now(),
        lastAccessedAt: Date.now(),
        isDirty: false,
        syncStatus: 'synced',
      };

      await tx.store.put(row);
    }

    await tx.done;
    logger.log(`[${this.tableName}] Batch cached ${items.length} rows`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Batch delete
   */
  async batchDelete(ids: string[]): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

    for (const id of ids) {
      await tx.store.delete([this.tableName, id]);
    }

    await tx.done;
    logger.log(`[${this.tableName}] Batch deleted ${ids.length} rows`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Clear all cached rows for this table
   */
  async clearCache(): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');
    const index = tx.store.index('tableName');

    const keys = await index.getAllKeys(this.tableName);
    for (const key of keys) {
      await tx.store.delete(key);
    }

    await tx.done;
    logger.log(`[${this.tableName}] Cache cleared`);

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Subscribe to changes
   * Returns unsubscribe function
   */
  subscribe(callback: (data: T[]) => void): () => void {
    this.listeners.add(callback);

    // Immediately call with current data
    this.getAll().then(callback).catch(logger.error);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of data changes
   */
  protected async notifyListeners(): Promise<void> {
    const data = await this.getAll();
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`[${this.tableName}] Listener error:`, error);
      }
    });
  }

  /**
   * Check if row is expired based on TTL
   */
  protected isExpired(row: ReplicatedRow<T>): boolean {
    return Date.now() - row.lastSyncedAt > this.ttl;
  }

  /**
   * Clean expired rows (for maintenance)
   */
  async cleanExpired(): Promise<number> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');
    const index = tx.store.index('tableName');

    const rows = await index.getAll(this.tableName) as ReplicatedRow<T>[];
    let deletedCount = 0;

    for (const row of rows) {
      if (this.isExpired(row)) {
        await tx.store.delete([row.tableName, row.id]);
        deletedCount++;
      }
    }

    await tx.done;

    if (deletedCount > 0) {
      logger.log(`[${this.tableName}] Cleaned ${deletedCount} expired rows`);
    }

    return deletedCount;
  }

  /**
   * Get sync metadata for this table
   */
  async getSyncMetadata(): Promise<SyncMetadata | null> {
    const db = await this.init();
    return await db.get(REPLICATION_STORES.SYNC_METADATA, this.tableName) as SyncMetadata | null;
  }

  /**
   * Update sync metadata
   */
  protected async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
    const db = await this.init();
    const existing = await this.getSyncMetadata();

    const metadata: SyncMetadata = {
      tableName: this.tableName,
      lastFullSyncAt: existing?.lastFullSyncAt || 0,
      lastIncrementalSyncAt: existing?.lastIncrementalSyncAt || 0,
      syncStatus: 'idle',
      conflictCount: existing?.conflictCount || 0,
      pendingMutations: existing?.pendingMutations || 0,
      ...updates,
    };

    await db.put(REPLICATION_STORES.SYNC_METADATA, metadata);
  }

  /**
   * Abstract methods to be implemented by subclasses
   */

  /**
   * Sync with server (to be implemented in Phase 2)
   */
  abstract sync(licenseKey: string): Promise<SyncResult>;

  /**
   * Resolve conflicts (to be implemented in Phase 2)
   */
  protected abstract resolveConflict(local: T, remote: T): T;
}
