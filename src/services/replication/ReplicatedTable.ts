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

import { openDB, deleteDB, IDBPDatabase } from 'idb';
import type {
  ReplicatedRow,
  SyncMetadata,
  SyncResult,
} from './types';
import type { SyncOptions } from './SyncEngine';
import { logger } from '@/utils/logger';
import { getTableTTL } from '@/config/featureFlags';
import { logDiagnosticReport } from '@/utils/indexedDBDiagnostics';

const DB_NAME = 'myK9Q_Replication';
const DB_VERSION = 3; // Version 3: Fix upgrade deadlock with timeout + corrupted DB recovery

/**
 * Shared database instance singleton
 * CRITICAL: All ReplicatedTable instances MUST share the same DB connection
 * to avoid upgrade transaction deadlocks when 16 tables initialize simultaneously
 */
let sharedDB: IDBPDatabase | null = null;
let dbInitPromise: Promise<IDBPDatabase> | null = null;

/**
 * Table initialization queue to prevent transaction stampede
 * When dbInitPromise resolves, all 16 tables try to create transactions simultaneously.
 * This queue ensures they take turns accessing the database to prevent deadlock.
 */
let tableInitQueue: Promise<void> = Promise.resolve();
let tablesInitialized = 0;

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

  /** Day 25-26 MEDIUM Fix: Debouncing for listener notifications */
  private notifyDebounceTimer: NodeJS.Timeout | null = null;
  private readonly NOTIFY_DEBOUNCE_MS = 100; // Batch notifications within 100ms

  constructor(
    protected tableName: string,
    customTTL?: number
  ) {
    this.ttl = customTTL || getTableTTL(tableName as any);
  }

  /**
   * Initialize IndexedDB connection
   * SINGLETON PATTERN: All tables share the same DB instance to prevent upgrade deadlocks
   */
  protected async init(): Promise<IDBPDatabase> {
    console.log(`[${this.tableName}] init() called - sharedDB: ${!!sharedDB}, dbInitPromise: ${!!dbInitPromise}`);

    // Return shared instance if already initialized
    if (sharedDB) {
      console.log(`[${this.tableName}] Using existing sharedDB`);
      this.db = sharedDB;
      return sharedDB;
    }

    // If initialization is in progress, wait for it AND join the queue
    if (dbInitPromise) {
      console.log(`[${this.tableName}] Waiting for dbInitPromise to resolve...`);

      // Wait for database to open
      this.db = await dbInitPromise;
      console.log(`[${this.tableName}] dbInitPromise resolved successfully`);

      // CRITICAL FIX: Join the initialization queue to prevent transaction stampede
      // All 16 tables will wait here in sequence instead of creating transactions simultaneously
      const myTurn = tableInitQueue.then(async () => {
        tablesInitialized++;
        console.log(`[${this.tableName}] My turn in queue (${tablesInitialized}/16)`);

        // Small delay to ensure previous table's transactions complete
        await new Promise(resolve => setTimeout(resolve, 10));

        console.log(`[${this.tableName}] Queue slot complete, ready for transactions`);
      });

      // Update queue for next table
      tableInitQueue = myTurn;

      // Wait for my turn before returning
      await myTurn;

      return this.db;
    }

    // Start initialization (only one table will execute this)
    console.log(`[${this.tableName}] Starting new DB initialization...`);

    // Timeout protection: openDB can hang if database is corrupt or locked
    const DB_OPEN_TIMEOUT_MS = 30000; // 30 second timeout for opening database (increased from 10s to handle 16 concurrent tables)

    console.log(`[${this.tableName}] About to call openDB("${DB_NAME}", ${DB_VERSION})...`);
    const openDBPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, _transaction) {
        console.log(`[ReplicatedTable] 🔧 Upgrade callback triggered - oldVersion: ${oldVersion}, newVersion: ${_newVersion}`);
        console.log(`[ReplicatedTable] Upgrade transaction mode: ${_transaction.mode}`);

        // Create replicated_tables store if it doesn't exist
        if (!db.objectStoreNames.contains(REPLICATION_STORES.REPLICATED_TABLES)) {
          console.log(`[ReplicatedTable] Creating REPLICATED_TABLES store...`);

          const store = db.createObjectStore(REPLICATION_STORES.REPLICATED_TABLES, {
            keyPath: ['tableName', 'id'],
          });
          store.createIndex('tableName', 'tableName', { unique: false });
          store.createIndex('tableName_lastSyncedAt', ['tableName', 'lastSyncedAt'], { unique: false });
          store.createIndex('isDirty', 'isDirty', { unique: false });

          // Day 23-24: Performance indexes for hot query paths
          // These indexes enable O(log n) queries instead of O(n) table scans
          store.createIndex('tableName_data.class_id', ['tableName', 'data.class_id'], { unique: false });
          store.createIndex('tableName_data.trial_id', ['tableName', 'data.trial_id'], { unique: false });
          store.createIndex('tableName_data.show_id', ['tableName', 'data.show_id'], { unique: false });
          store.createIndex('tableName_data.armband_number', ['tableName', 'data.armband_number'], { unique: false });
        } else if (oldVersion < 3) {
          // Upgrade from v1/v2 to v3: Add query performance indexes if missing
          const store = _transaction.objectStore(REPLICATION_STORES.REPLICATED_TABLES);

          // Add new indexes if they don't exist
          if (!store.indexNames.contains('tableName_data.class_id')) {
            store.createIndex('tableName_data.class_id', ['tableName', 'data.class_id'], { unique: false });
          }
          if (!store.indexNames.contains('tableName_data.trial_id')) {
            store.createIndex('tableName_data.trial_id', ['tableName', 'data.trial_id'], { unique: false });
          }
          if (!store.indexNames.contains('tableName_data.show_id')) {
            store.createIndex('tableName_data.show_id', ['tableName', 'data.show_id'], { unique: false });
          }
          if (!store.indexNames.contains('tableName_data.armband_number')) {
            store.createIndex('tableName_data.armband_number', ['tableName', 'data.armband_number'], { unique: false });
          }
        }

        // Create sync_metadata store
        if (!db.objectStoreNames.contains(REPLICATION_STORES.SYNC_METADATA)) {
          console.log(`[ReplicatedTable] Creating SYNC_METADATA store...`);
          db.createObjectStore(REPLICATION_STORES.SYNC_METADATA, {
            keyPath: 'tableName',
          });
        }

        // Create pending_mutations store
        if (!db.objectStoreNames.contains(REPLICATION_STORES.PENDING_MUTATIONS)) {
          console.log(`[ReplicatedTable] Creating PENDING_MUTATIONS store...`);
          const mutationStore = db.createObjectStore(REPLICATION_STORES.PENDING_MUTATIONS, {
            keyPath: 'id',
          });
          mutationStore.createIndex('status', 'status', { unique: false });
          mutationStore.createIndex('tableName', 'tableName', { unique: false });
        }

        console.log(`[ReplicatedTable] ✅ Upgrade callback complete`);
      },
    }).then((db) => {
      console.log(`[ReplicatedTable] ✅ openDB() promise resolved!`);
      return db;
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database open timed out after ${DB_OPEN_TIMEOUT_MS}ms - database may be corrupted or locked`));
      }, DB_OPEN_TIMEOUT_MS);
    });

    // Try to open database with timeout
    try {
      // CRITICAL: Set dbInitPromise BEFORE awaiting to prevent race condition
      // All other tables will wait on this promise instead of starting their own initialization
      dbInitPromise = Promise.race([openDBPromise, timeoutPromise]);
      sharedDB = await dbInitPromise;
      this.db = sharedDB;

      console.log(`[ReplicatedTable] ✅ Shared database initialized successfully`);

      return this.db;
    } catch (error) {
      console.error(`[ReplicatedTable] ❌ Failed to open database:`, error);

      // Import the config function
      const { handleDatabaseCorruption } = await import('./replicationConfig');

      // Database is corrupt or locked - disable replication and clean up
      console.warn(`[ReplicatedTable] 🗑️ Deleting corrupted database and disabling replication...`);

      // Handle the corruption (this will disable replication temporarily)
      handleDatabaseCorruption();

      try {
        await deleteDB(DB_NAME);
        console.log(`[ReplicatedTable] Database deleted successfully`);

        // Retry opening database (fresh start)
        const retryPromise = openDB(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion, _newVersion, _transaction) {
            console.log(`[ReplicatedTable] 🔧 Retry upgrade - oldVersion: ${oldVersion}, newVersion: ${_newVersion}`);
            // Same upgrade logic as above (create all stores)
            if (!db.objectStoreNames.contains(REPLICATION_STORES.REPLICATED_TABLES)) {
              const store = db.createObjectStore(REPLICATION_STORES.REPLICATED_TABLES, {
                keyPath: ['tableName', 'id'],
              });
              store.createIndex('tableName', 'tableName', { unique: false });
              store.createIndex('tableName_lastSyncedAt', ['tableName', 'lastSyncedAt'], { unique: false });
              store.createIndex('isDirty', 'isDirty', { unique: false });
              store.createIndex('tableName_data.class_id', ['tableName', 'data.class_id'], { unique: false });
              store.createIndex('tableName_data.trial_id', ['tableName', 'data.trial_id'], { unique: false });
              store.createIndex('tableName_data.show_id', ['tableName', 'data.show_id'], { unique: false });
              store.createIndex('tableName_data.armband_number', ['tableName', 'data.armband_number'], { unique: false });
            }
            if (!db.objectStoreNames.contains(REPLICATION_STORES.SYNC_METADATA)) {
              db.createObjectStore(REPLICATION_STORES.SYNC_METADATA, { keyPath: 'tableName' });
            }
            if (!db.objectStoreNames.contains(REPLICATION_STORES.PENDING_MUTATIONS)) {
              const mutationStore = db.createObjectStore(REPLICATION_STORES.PENDING_MUTATIONS, { keyPath: 'id' });
              mutationStore.createIndex('status', 'status', { unique: false });
              mutationStore.createIndex('tableName', 'tableName', { unique: false });
            }
          },
        });

        dbInitPromise = Promise.race([retryPromise, timeoutPromise]);
        sharedDB = await dbInitPromise;
        this.db = sharedDB;

        console.log(`[ReplicatedTable] ✅ Database recreated successfully after corruption`);
        return this.db;
      } catch (retryError) {
        console.error(`[ReplicatedTable] ❌ Failed to recreate database after deletion:`, retryError);

        // Database is completely stuck - run diagnostics
        console.error(`[ReplicatedTable] 🔍 Database is locked/corrupted - running diagnostics...`);

        // Run diagnostic report in background
        setTimeout(() => {
          logDiagnosticReport().catch(err => {
            console.error('[ReplicatedTable] Diagnostic report failed:', err);
          });
        }, 0);

        // Reset promises to allow future retries
        dbInitPromise = null;
        sharedDB = null;
        tableInitQueue = Promise.resolve();
        tablesInitialized = 0;
        throw retryError;
      }
    }
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

    // Day 25-26 LOW Fix: Update access tracking for LRU+LFU eviction
    row.lastAccessedAt = Date.now();
    row.accessCount = (row.accessCount || 0) + 1;
    await db.put(REPLICATION_STORES.REPLICATED_TABLES, row);

    return row.data;
  }

  /**
   * Set (upsert) a row in local cache
   *
   * Day 25-26 MEDIUM Fix: Optimistic locking with version checking
   * @param expectedVersion - Optional version to check for optimistic locking
   * @throws Error if version mismatch (concurrent modification detected)
   */
  async set(id: string, data: T, isDirty = false, expectedVersion?: number): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

    // Read current row within transaction for atomicity
    const existingRow = await tx.store.get([this.tableName, id]) as ReplicatedRow<T> | undefined;

    // Day 25-26: Optimistic locking - verify version hasn't changed
    if (expectedVersion !== undefined && existingRow && existingRow.version !== expectedVersion) {
      await tx.done;
      throw new Error(
        `[${this.tableName}] Concurrent modification detected for row ${id}. ` +
        `Expected version ${expectedVersion}, found ${existingRow.version}. ` +
        `Please retry your operation.`
      );
    }

    const row: ReplicatedRow<T> = {
      tableName: this.tableName,
      id,
      data,
      version: existingRow ? existingRow.version + 1 : 1,
      lastSyncedAt: Date.now(),
      lastAccessedAt: Date.now(),
      // Day 25-26 LOW Fix: Preserve access count, track modification time
      accessCount: existingRow?.accessCount || 0,
      lastModifiedAt: Date.now(),
      isDirty,
      syncStatus: isDirty ? 'pending' : 'synced',
    };

    await tx.store.put(row);
    await tx.done;

    logger.log(`[${this.tableName}] Cached row: ${id} (version: ${row.version}, dirty: ${isDirty})`);

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
   * Query rows by index (OPTIMIZED - uses IndexedDB indexes for O(log n) performance)
   * Example: queryByField('class_id', '123') returns all entries with class_id = 123
   *
   * Supported fields: class_id, trial_id, show_id, armband_number
   *
   * Day 25-26 MEDIUM Fix: Added timeout and performance logging
   */
  async queryByField(fieldName: 'class_id' | 'trial_id' | 'show_id' | 'armband_number', value: any): Promise<T[]> {
    const startTime = performance.now();
    const db = await this.init();
    const indexName = `tableName_data.${fieldName}`;

    try {
      // Day 25-26 MEDIUM Fix: Query timeout (500ms)
      const QUERY_TIMEOUT_MS = 500;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout: ${fieldName}=${value} exceeded ${QUERY_TIMEOUT_MS}ms`));
        }, QUERY_TIMEOUT_MS);
      });

      // Execute query with timeout
      const queryPromise = (async () => {
        const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readonly');
        const index = tx.store.index(indexName);

        // Query using compound index [tableName, data.field]
        const rows = await index.getAll([this.tableName, value]) as ReplicatedRow<T>[];

        // Filter expired rows
        const freshRows = rows.filter((row) => !this.isExpired(row));

        return freshRows.map((row) => row.data);
      })();

      const results = await Promise.race([queryPromise, timeoutPromise]);

      // Day 25-26 MEDIUM Fix: Performance logging
      const duration = performance.now() - startTime;
      if (duration > 100) {
        logger.warn(
          `⚠️ [${this.tableName}] SLOW query detected: ${fieldName}=${value} took ${duration.toFixed(2)}ms ` +
          `(${results.length} results). Consider optimizing or reducing dataset.`
        );
      } else {
        logger.log(`[${this.tableName}] Indexed query ${fieldName}=${value}: ${results.length} rows in ${duration.toFixed(2)}ms`);
      }

      return results;
    } catch (error) {
      const duration = performance.now() - startTime;

      // Day 25-26 MEDIUM Fix: Handle timeout errors
      if (error instanceof Error && error.message.includes('Query timeout')) {
        logger.error(
          `❌ [${this.tableName}] Query TIMEOUT: ${fieldName}=${value} exceeded 500ms. ` +
          `This indicates a performance issue. Dataset may be too large or index not working properly.`
        );
        throw error;
      }

      // Fallback to table scan if index doesn't exist (backward compatibility)
      logger.warn(`[${this.tableName}] Index ${indexName} not found, falling back to table scan (took ${duration.toFixed(2)}ms)`);
      const allRows = await this.getAll();
      return allRows.filter((row) => (row as any)[fieldName] === value);
    }
  }

  /**
   * Query rows by index (DEPRECATED - use queryByField for better performance)
   * Example: queryIndex('class_id', '123') returns all entries with class_id = 123
   */
  async queryIndex(indexName: keyof T, value: any): Promise<T[]> {
    // Try optimized query first for known fields
    if (['class_id', 'trial_id', 'show_id', 'armband_number'].includes(indexName as string)) {
      return this.queryByField(indexName as any, value);
    }

    // Fall back to table scan for other fields
    const allRows = await this.getAll();
    return allRows.filter((row) => (row as any)[indexName] === value);
  }

  /**
   * Get all rows for this table
   * TIMEOUT PROTECTION: Prevents indefinite blocking when multiple tables sync simultaneously
   */
  async getAll(licenseKey?: string): Promise<T[]> {
    const GET_ALL_TIMEOUT_MS = 20000; // 20 second timeout for reading all rows (increased from 10s for large datasets)

    const getAllPromise = (async () => {
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
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`[${this.tableName}] getAll() timed out after ${GET_ALL_TIMEOUT_MS}ms - possible transaction deadlock`));
      }, GET_ALL_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([getAllPromise, timeoutPromise]);
      return result;
    } catch (error) {
      console.error(`[${this.tableName}] ❌ getAll() failed:`, error);
      // Return empty array on timeout to allow sync to continue
      return [];
    }
  }

  /**
   * Optimistic update with automatic retry on version conflicts
   * Day 25-26 MEDIUM Fix: Helper for race condition handling
   *
   * @param id - Row ID to update
   * @param updateFn - Function to apply update (receives current data, returns new data)
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @throws Error if max retries exceeded
   */
  async optimisticUpdate(
    id: string,
    updateFn: (current: T) => T | Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Read current row with version
        const db = await this.init();
        const existingRow = await db.get(REPLICATION_STORES.REPLICATED_TABLES, [this.tableName, id]) as ReplicatedRow<T> | undefined;

        if (!existingRow) {
          throw new Error(`[${this.tableName}] Row ${id} not found for optimistic update`);
        }

        const currentVersion = existingRow.version;
        const currentData = existingRow.data;

        // Apply user's update function
        const updatedData = await updateFn(currentData);

        // Attempt write with version check (will throw if version changed)
        await this.set(id, updatedData, true, currentVersion);

        logger.log(`[${this.tableName}] Optimistic update succeeded for ${id} (attempt ${attempt + 1})`);
        return updatedData;
      } catch (error) {
        const isVersionConflict = error instanceof Error && error.message.includes('Concurrent modification');

        if (isVersionConflict && attempt < maxRetries - 1) {
          logger.warn(`[${this.tableName}] Version conflict on ${id}, retrying (attempt ${attempt + 1}/${maxRetries})...`);
          // Brief delay before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt)));
          continue;
        }

        // Re-throw if not version conflict or max retries exceeded
        throw error;
      }
    }

    throw new Error(`[${this.tableName}] Optimistic update failed after ${maxRetries} attempts`);
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
   * Batch set with chunking (for large syncs > 500 rows)
   * Day 23-24: Performance optimization to prevent UI freezing on large syncs
   *
   * Processes data in chunks of 100 rows to:
   * - Reduce memory pressure
   * - Allow progress updates
   * - Prevent transaction timeouts
   */
  async batchSetChunked(items: T[], chunkSize: number = 100): Promise<void> {
    const totalRows = items.length;

    // For small datasets, use regular batchSet
    if (totalRows <= chunkSize) {
      return this.batchSet(items);
    }

    logger.log(`[${this.tableName}] Starting chunked batch set: ${totalRows} rows (chunks of ${chunkSize})`);

    let processedRows = 0;

    for (let i = 0; i < totalRows; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const db = await this.init();
      const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');

      for (const item of chunk) {
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
      processedRows += chunk.length;

      const progress = Math.round((processedRows / totalRows) * 100);
      logger.log(`[${this.tableName}] Chunk progress: ${processedRows}/${totalRows} (${progress}%)`);
    }

    logger.log(`[${this.tableName}] Chunked batch complete: ${processedRows} rows`);

    // Notify listeners once at the end
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
   *
   * Day 25-26 MEDIUM Fix: Debounced to prevent notification flood
   * Multiple rapid changes (e.g., batch updates) trigger only ONE notification
   */
  protected async notifyListeners(): Promise<void> {
    // Clear existing timer
    if (this.notifyDebounceTimer) {
      clearTimeout(this.notifyDebounceTimer);
    }

    // Schedule notification (will be called only after debounce period)
    this.notifyDebounceTimer = setTimeout(async () => {
      const data = await this.getAll();
      this.listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`[${this.tableName}] Listener error:`, error);
        }
      });

      this.notifyDebounceTimer = null;
    }, this.NOTIFY_DEBOUNCE_MS);
  }

  /**
   * Check if row is expired based on TTL
   *
   * IMPORTANT: Never expire dirty rows (rows with unsaved local changes)
   * This ensures offline scores are never lost, even if TTL expires
   *
   * Day 25-26 MEDIUM Fix: Don't expire if offline (offline mode exception)
   */
  protected isExpired(row: ReplicatedRow<T>): boolean {
    // Never expire dirty rows (have pending mutations)
    if (row.isDirty) {
      return false;
    }

    // Day 25-26: Don't expire if offline (user may need stale data)
    if (!navigator.onLine) {
      return false;
    }

    return Date.now() - row.lastSyncedAt > this.ttl;
  }

  /**
   * Refresh timestamps on all cached rows
   * Called after incremental sync with 0 changes to prevent expiration
   */
  async refreshTimestamps(): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');
    const index = tx.store.index('tableName');

    const rows = await index.getAll(this.tableName) as ReplicatedRow<T>[];
    const now = Date.now();

    for (const row of rows) {
      row.lastSyncedAt = now;
      row.lastAccessedAt = now;
      await tx.store.put(row);
    }

    await tx.done;
    logger.log(`[${this.tableName}] Refreshed timestamps for ${rows.length} cached rows`);
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
   * Estimate size of a single row in bytes
   * Day 23-24: Used for LRU eviction to prevent quota errors
   */
  private estimateRowSize(row: ReplicatedRow<T>): number {
    try {
      // JSON.stringify + Blob gives accurate byte count
      const jsonStr = JSON.stringify(row);
      return new Blob([jsonStr]).size;
    } catch (error) {
      // Fallback: rough estimate (2 bytes per char for UTF-16)
      logger.warn(`[${this.tableName}] Failed to estimate row size, using fallback:`, error);
      return JSON.stringify(row).length * 2;
    }
  }

  /**
   * Estimate total size of all rows in bytes
   * Day 23-24: Used for LRU eviction to prevent quota errors
   */
  async estimateTotalSize(): Promise<number> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readonly');
    const index = tx.store.index('tableName');

    const rows = await index.getAll(this.tableName) as ReplicatedRow<T>[];

    return rows.reduce((sum, row) => sum + this.estimateRowSize(row), 0);
  }

  /**
   * Get cache statistics for this table
   * Day 23-24: Monitoring for LRU eviction decisions
   */
  async getCacheStats(): Promise<{
    rowCount: number;
    sizeBytes: number;
    sizeMB: number;
    oldestAccess: number;
    newestAccess: number;
    dirtyCount: number;
  }> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readonly');
    const index = tx.store.index('tableName');

    const rows = await index.getAll(this.tableName) as ReplicatedRow<T>[];

    const sizeBytes = rows.reduce((sum, row) => sum + this.estimateRowSize(row), 0);
    const dirtyCount = rows.filter(row => row.isDirty).length;
    const accessTimes = rows.map(row => row.lastAccessedAt);

    return {
      rowCount: rows.length,
      sizeBytes,
      sizeMB: sizeBytes / 1024 / 1024,
      oldestAccess: accessTimes.length > 0 ? Math.min(...accessTimes) : 0,
      newestAccess: accessTimes.length > 0 ? Math.max(...accessTimes) : 0,
      dirtyCount,
    };
  }

  /**
   * Evict least recently used rows to reduce memory footprint
   * Day 23-24: Prevents IndexedDB quota errors on large datasets
   *
   * @param targetSizeBytes - Target size in bytes (evict until under this threshold)
   * @returns Number of rows evicted
   */
  async evictLRU(targetSizeBytes: number): Promise<number> {
    const db = await this.init();
    const tx = db.transaction(REPLICATION_STORES.REPLICATED_TABLES, 'readwrite');
    const index = tx.store.index('tableName');

    const rows = await index.getAll(this.tableName) as ReplicatedRow<T>[];

    // Calculate current size
    let currentSize = rows.reduce((sum, row) => sum + this.estimateRowSize(row), 0);

    // If already under target, nothing to do
    if (currentSize <= targetSizeBytes) {
      logger.log(`[${this.tableName}] Cache size ${(currentSize / 1024 / 1024).toFixed(2)} MB already under target ${(targetSizeBytes / 1024 / 1024).toFixed(2)} MB`);
      return 0;
    }

    logger.log(
      `[${this.tableName}] LRU eviction: Current ${(currentSize / 1024 / 1024).toFixed(2)} MB, Target ${(targetSizeBytes / 1024 / 1024).toFixed(2)} MB`
    );

    // Day 25-26 LOW Fix: Hybrid LFU+LRU eviction with recent edit protection
    const RECENT_EDIT_PROTECTION_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    // Filter evictable rows (exclude dirty + recently edited)
    const evictableRows = rows
      .filter(row => {
        // NEVER evict dirty rows (have pending mutations)
        if (row.isDirty) return false;

        // Protect recently edited data (last 5 minutes)
        if (row.lastModifiedAt && (now - row.lastModifiedAt) < RECENT_EDIT_PROTECTION_MS) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Hybrid LFU+LRU scoring (lower score = evict first)
        // 70% weight on frequency (LFU), 30% weight on recency (LRU)
        const accessCountA = a.accessCount || 1;
        const accessCountB = b.accessCount || 1;

        // Normalize timestamps to seconds to avoid overflow
        const recencyA = a.lastAccessedAt / 1000;
        const recencyB = b.lastAccessedAt / 1000;

        const scoreA = accessCountA * 0.7 + recencyA * 0.3;
        const scoreB = accessCountB * 0.7 + recencyB * 0.3;

        return scoreA - scoreB; // Lower score = less valuable = evict first
      });

    let evictedCount = 0;
    let i = 0;

    while (currentSize > targetSizeBytes && i < evictableRows.length) {
      const row = evictableRows[i];
      const rowSize = this.estimateRowSize(row);

      // Delete row from IndexedDB
      await tx.store.delete([row.tableName, row.id]);

      currentSize -= rowSize;
      evictedCount++;
      i++;
    }

    await tx.done;

    logger.log(
      `[${this.tableName}] LRU eviction complete: ${evictedCount} rows evicted, new size ${(currentSize / 1024 / 1024).toFixed(2)} MB`
    );

    // Notify listeners (cache changed)
    this.notifyListeners();

    return evictedCount;
  }

  /**
   * Get sync metadata for this table
   * TIMEOUT PROTECTION: Prevents indefinite blocking when multiple tables sync simultaneously
   */
  async getSyncMetadata(): Promise<SyncMetadata | null> {
    const METADATA_TIMEOUT_MS = 5000; // 5 second timeout for metadata operations

    const readPromise = (async () => {
      const db = await this.init();
      return await db.get(REPLICATION_STORES.SYNC_METADATA, this.tableName) as SyncMetadata | null;
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`[${this.tableName}] Metadata read timed out after ${METADATA_TIMEOUT_MS}ms - possible transaction deadlock`));
      }, METADATA_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([readPromise, timeoutPromise]);
      return result;
    } catch (error) {
      console.error(`[${this.tableName}] ❌ Metadata read failed:`, error);
      // Return null on timeout to allow sync to continue with default metadata
      return null;
    }
  }

  /**
   * Update sync metadata
   * TIMEOUT PROTECTION: Prevents indefinite blocking when multiple tables sync simultaneously
   */
  protected async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
    const METADATA_TIMEOUT_MS = 5000; // 5 second timeout for metadata operations

    const updatePromise = (async () => {
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
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`[${this.tableName}] Metadata update timed out after ${METADATA_TIMEOUT_MS}ms - possible transaction deadlock`));
      }, METADATA_TIMEOUT_MS);
    });

    try {
      await Promise.race([updatePromise, timeoutPromise]);
      console.log(`[${this.tableName}] ✅ Metadata updated successfully`);
    } catch (error) {
      console.error(`[${this.tableName}] ❌ Metadata update failed:`, error);
      throw error;
    }
  }

  /**
   * Abstract methods to be implemented by subclasses
   */

  /**
   * Sync with server (to be implemented in Phase 2)
   */
  abstract sync(licenseKey: string, options?: Partial<SyncOptions>): Promise<SyncResult>;

  /**
   * Resolve conflicts (to be implemented in Phase 2)
   */
  protected abstract resolveConflict(local: T, remote: T): T;
}
