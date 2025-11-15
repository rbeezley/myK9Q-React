/**
 * SyncEngine - Orchestrates bidirectional sync between Supabase and IndexedDB
 *
 * Responsibilities:
 * - Full sync: Initial download of all table data
 * - Incremental sync: Delta updates since last sync
 * - Mutation upload: Push offline changes to server
 * - Network monitoring: Detect online/offline state
 * - Batch operations: Efficient bulk sync
 * - Error handling: Retry logic with exponential backoff
 *
 * **Phase 2 Day 6-7** - Core sync infrastructure
 */

import { supabase } from '@/lib/supabase';
import type { ReplicatedTable } from './ReplicatedTable';
import type {
  SyncMetadata,
  PendingMutation,
  SyncResult,
  SyncProgress,
} from './types';
import { logger } from '@/utils/logger';
import { REPLICATION_STORES } from './ReplicatedTable';
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'myK9Q_Replication';
const DB_VERSION = 1;

export interface SyncOptions {
  /** Force full sync even if incremental is available */
  forceFullSync?: boolean;

  /** License key for multi-tenant filtering */
  licenseKey: string;

  /** Batch size for bulk operations */
  batchSize?: number;

  /** Progress callback for UI updates */
  onProgress?: (progress: SyncProgress) => void;
}

export interface SyncEngineConfig {
  /** How often to run incremental sync (ms) */
  syncInterval?: number;

  /** Maximum retry attempts for failed mutations */
  maxRetries?: number;

  /** Exponential backoff base (ms) */
  retryBackoffBase?: number;

  /** Enable automatic sync on network reconnect */
  autoSyncOnReconnect?: boolean;
}

export class SyncEngine {
  private db: IDBPDatabase | null = null;
  private syncInterval: number;
  private maxRetries: number;
  private retryBackoffBase: number;
  private autoSyncOnReconnect: boolean;
  private isOnline: boolean = navigator.onLine;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  // Issue #12 Fix: Debounce localStorage backup to prevent race conditions
  private backupDebounceTimer: NodeJS.Timeout | null = null;
  private isBackupInProgress: boolean = false;

  constructor(config: SyncEngineConfig = {}) {
    this.syncInterval = config.syncInterval || 5 * 60 * 1000; // 5 min default
    this.maxRetries = config.maxRetries || 3;
    this.retryBackoffBase = config.retryBackoffBase || 1000; // 1 sec
    this.autoSyncOnReconnect = config.autoSyncOnReconnect ?? true;

    // Listen for network changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Initialize IndexedDB connection
   */
  private async init(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, _transaction) {
        // Create replicated_tables store
        if (!db.objectStoreNames.contains(REPLICATION_STORES.REPLICATED_TABLES)) {
          const store = db.createObjectStore(REPLICATION_STORES.REPLICATED_TABLES, {
            keyPath: ['tableName', 'id'],
          });
          store.createIndex('tableName', 'tableName', { unique: false });
          store.createIndex('tableName_lastSyncedAt', ['tableName', 'lastSyncedAt'], {
            unique: false,
          });
          store.createIndex('isDirty', 'isDirty', { unique: false });
        }

        // Create sync_metadata store
        if (!db.objectStoreNames.contains(REPLICATION_STORES.SYNC_METADATA)) {
          db.createObjectStore(REPLICATION_STORES.SYNC_METADATA, {
            keyPath: 'tableName',
          });
        }

        // Create pending_mutations store
        if (!db.objectStoreNames.contains(REPLICATION_STORES.PENDING_MUTATIONS)) {
          const mutationStore = db.createObjectStore(
            REPLICATION_STORES.PENDING_MUTATIONS,
            {
              keyPath: 'id',
            }
          );
          mutationStore.createIndex('status', 'status', { unique: false });
          mutationStore.createIndex('tableName', 'tableName', { unique: false });
        }
      },
    });
    return this.db;
  }

  /**
   * Full sync: Download all data for a table
   */
  async fullSync(
    table: ReplicatedTable<any>,
    options: SyncOptions
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const tableName = (table as any).tableName;

    try {
      logger.log(`🔄 [SyncEngine] Starting full sync for ${tableName}...`);

      // Day 25-26 MEDIUM Fix: Use streaming fetch with pagination for large datasets
      const STREAM_THRESHOLD = 1000; // Switch to streaming if >1000 rows expected
      const STREAM_PAGE_SIZE = 500;  // Fetch 500 rows per page

      // First, check row count (HEAD-only query)
      const { count: totalCount, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('license_key', options.licenseKey);

      if (countError) {
        throw new Error(`Row count query failed: ${countError.message}`);
      }

      if (!totalCount || totalCount === 0) {
        logger.log(`ℹ️ [SyncEngine] No data found for ${tableName}`);
        await this.updateSyncMetadata(tableName, {
          lastFullSyncAt: Date.now(),
          lastIncrementalSyncAt: Date.now(),
          totalRows: 0,
        });

        return {
          success: true,
          tableName,
          operation: 'full-sync',
          rowsAffected: 0,
          duration: Date.now() - startTime,
        };
      }

      let totalRowsProcessed = 0; // Track total rows for final metadata update

      // Day 25-26 MEDIUM Fix: Use streaming fetch for large datasets to prevent memory spike
      if (totalCount > STREAM_THRESHOLD) {
        logger.log(
          `📊 [SyncEngine] Large dataset detected (${totalCount} rows). Using streaming fetch with ${STREAM_PAGE_SIZE}-row pages...`
        );

        let processedRows = 0;
        let currentPage = 0;

        while (processedRows < totalCount) {
          // Fetch one page
          const { data: pageData, error: pageError } = await supabase
            .from(tableName)
            .select('*')
            .eq('license_key', options.licenseKey)
            .range(currentPage * STREAM_PAGE_SIZE, (currentPage + 1) * STREAM_PAGE_SIZE - 1)
            .order('id', { ascending: true });

          if (pageError) {
            throw new Error(`Page ${currentPage} fetch failed: ${pageError.message}`);
          }

          if (!pageData || pageData.length === 0) {
            break; // No more data
          }

          // Process page in chunks
          const batchSize = options.batchSize || 100;
          for (let i = 0; i < pageData.length; i += batchSize) {
            const batch = pageData.slice(i, i + batchSize);
            await table.batchSet(batch);
            processedRows += batch.length;

            // Report progress
            if (options.onProgress) {
              options.onProgress({
                tableName,
                operation: 'full-sync',
                processed: processedRows,
                total: totalCount,
                percentage: (processedRows / totalCount) * 100,
              });
            }
          }

          logger.log(`[SyncEngine] Streamed page ${currentPage + 1}: ${processedRows}/${totalCount} rows processed`);
          currentPage++;

          // Day 25-26 MEDIUM Fix: Memory monitoring - pause if heap size high
          if ((performance as any).memory) {
            const heapMB = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
            if (heapMB > 100) {
              logger.warn(`⚠️ [SyncEngine] High memory usage (${heapMB.toFixed(2)} MB), pausing for GC...`);
              await new Promise(resolve => setTimeout(resolve, 100)); // Allow GC
            }
          }
        }

        totalRowsProcessed = processedRows;
        logger.log(`✅ [SyncEngine] Streaming fetch complete: ${processedRows} rows synced`);
      } else {
        // Small dataset: fetch all at once (existing behavior)
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('license_key', options.licenseKey);

        if (error) {
          throw new Error(`Supabase query failed: ${error.message}`);
        }

        if (!data || data.length === 0) {
          logger.log(`ℹ️ [SyncEngine] No data found for ${tableName}`);
          await this.updateSyncMetadata(tableName, {
            lastFullSyncAt: Date.now(),
            lastIncrementalSyncAt: Date.now(),
            totalRows: 0,
          });

          return {
            success: true,
            tableName,
            operation: 'full-sync',
            rowsAffected: 0,
            duration: Date.now() - startTime,
          };
        }

        // Day 25-26 MEDIUM Fix: Pre-sync quota check
        const estimatedSizeMB = (JSON.stringify(data).length / 1024 / 1024);
        const quotaCheckResult = await this.checkQuotaBeforeSync(estimatedSizeMB);

        if (!quotaCheckResult.hasSpace) {
          logger.error(
            `❌ [SyncEngine] Insufficient quota for ${tableName} sync. ` +
            `Need ${estimatedSizeMB.toFixed(2)} MB, available ~${quotaCheckResult.availableMB.toFixed(2)} MB`
          );

          // Try to free up space
          if (quotaCheckResult.needsEviction) {
            logger.warn('[SyncEngine] Attempting proactive eviction before sync...');
            const evictedRows = await table.evictLRU(estimatedSizeMB);
            logger.log(`[SyncEngine] Evicted ${evictedRows} rows to free space`);

            // Re-check quota
            const recheckResult = await this.checkQuotaBeforeSync(estimatedSizeMB);
            if (!recheckResult.hasSpace) {
              throw new Error(
                `Insufficient storage quota. Need ${estimatedSizeMB.toFixed(2)} MB but only ${recheckResult.availableMB.toFixed(2)} MB available after eviction. ` +
                `Please free up space or reduce data scope.`
              );
            }
          }
        }

        // Batch set all rows
        // Day 23-24: Use chunked batch set for large datasets (500+ rows)
        const batchSize = options.batchSize || 100;

        if (data.length >= 500) {
          // Large dataset: use optimized chunking (single transaction per chunk)
          logger.log(`📦 [SyncEngine] Using chunked batch set for ${data.length} rows`);
          await table.batchSetChunked(data, batchSize);

          // Report final progress
          if (options.onProgress) {
            options.onProgress({
              tableName,
              operation: 'full-sync',
              processed: data.length,
              total: data.length,
              percentage: 100,
            });
          }
        } else {
          // Small dataset: use existing chunking logic with progress updates
          let processed = 0;
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            await table.batchSet(batch);

            processed += batch.length;

            // Report progress
            if (options.onProgress) {
              options.onProgress({
                tableName,
                operation: 'full-sync',
                processed,
                total: data.length,
                percentage: (processed / data.length) * 100,
              });
            }
          }
        }

        totalRowsProcessed = data.length;
      }

      // Update sync metadata
      await this.updateSyncMetadata(tableName, {
        lastFullSyncAt: Date.now(),
        lastIncrementalSyncAt: Date.now(),
        totalRows: totalRowsProcessed,
      });

      const duration = Date.now() - startTime;
      logger.log(
        `✅ [SyncEngine] Full sync complete for ${tableName}: ${totalRowsProcessed} rows in ${duration}ms`
      );

      return {
        success: true,
        tableName,
        operation: 'full-sync',
        rowsAffected: totalRowsProcessed,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      logger.error(`❌ [SyncEngine] Full sync failed for ${tableName}:`, error);

      return {
        success: false,
        tableName,
        operation: 'full-sync',
        rowsAffected: 0,
        duration,
        error: message,
      };
    }
  }

  /**
   * Incremental sync: Download only changed data since last sync
   */
  async incrementalSync(
    table: ReplicatedTable<any>,
    options: SyncOptions
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const tableName = (table as any).tableName;

    try {
      // Get last sync timestamp
      const metadata = await this.getSyncMetadata(tableName);
      const lastSync = metadata?.lastIncrementalSyncAt || 0;

      // If never synced, do full sync instead
      if (lastSync === 0 || options.forceFullSync) {
        logger.log(
          `ℹ️ [SyncEngine] No previous sync for ${tableName}, doing full sync`
        );
        return this.fullSync(table, options);
      }

      logger.log(
        `🔄 [SyncEngine] Starting incremental sync for ${tableName} (since ${new Date(lastSync).toISOString()})...`
      );

      // Day 25-26: Check row count before fetching to prevent unbounded sync
      const MAX_INCREMENTAL_ROWS = 5000;

      const { count: rowCount, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('license_key', options.licenseKey)
        .gt('updated_at', new Date(lastSync).toISOString());

      if (countError) {
        throw new Error(`Row count query failed: ${countError.message}`);
      }

      // If too many rows changed, do full sync instead (more efficient)
      if (rowCount && rowCount > MAX_INCREMENTAL_ROWS) {
        logger.warn(
          `⚠️ [SyncEngine] Too many changes since last sync (${rowCount} rows > ${MAX_INCREMENTAL_ROWS} limit). Switching to full sync...`
        );
        return this.fullSync(table, options);
      }

      // Fetch rows updated since last sync
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('license_key', options.licenseKey)
        .gt('updated_at', new Date(lastSync).toISOString())
        .order('updated_at', { ascending: true });

      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        logger.log(`ℹ️ [SyncEngine] No updates for ${tableName}`);
        await this.updateSyncMetadata(tableName, {
          lastIncrementalSyncAt: Date.now(),
        });

        return {
          success: true,
          tableName,
          operation: 'incremental-sync',
          rowsAffected: 0,
          duration: Date.now() - startTime,
        };
      }

      // Batch set changed rows (with conflict resolution)
      const batchSize = options.batchSize || 100;
      let processed = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        // Use set() instead of batchSet() to trigger conflict resolution
        for (const row of batch) {
          await table.set(row.id, row);
        }

        processed += batch.length;

        if (options.onProgress) {
          options.onProgress({
            tableName,
            operation: 'incremental-sync',
            processed,
            total: data.length,
            percentage: (processed / data.length) * 100,
          });
        }
      }

      // Update sync metadata
      await this.updateSyncMetadata(tableName, {
        lastIncrementalSyncAt: Date.now(),
        totalRows: (metadata?.totalRows || 0) + data.length,
      });

      const duration = Date.now() - startTime;
      logger.log(
        `✅ [SyncEngine] Incremental sync complete for ${tableName}: ${data.length} rows in ${duration}ms`
      );

      return {
        success: true,
        tableName,
        operation: 'incremental-sync',
        rowsAffected: data.length,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      logger.error(
        `❌ [SyncEngine] Incremental sync failed for ${tableName}:`,
        error
      );

      return {
        success: false,
        tableName,
        operation: 'incremental-sync',
        rowsAffected: 0,
        duration,
        error: message,
      };
    }
  }

  /**
   * Upload pending mutations (offline changes) to server
   *
   * Day 25-26: Added topological sorting to respect causal dependencies
   * Day 25-26 MEDIUM Fix: Check mutation queue size to prevent overflow
   */
  async uploadPendingMutations(): Promise<SyncResult[]> {
    const startTime = Date.now();

    try {
      const db = await this.init();
      const pending = await db.getAll(REPLICATION_STORES.PENDING_MUTATIONS);

      if (pending.length === 0) {
        logger.log('ℹ️ [SyncEngine] No pending mutations to upload');
        return [];
      }

      // Day 25-26: Warn if mutation queue is getting large
      const QUEUE_WARNING_THRESHOLD = 500;
      const QUEUE_MAX_SIZE = 1000;

      if (pending.length >= QUEUE_MAX_SIZE) {
        logger.error(
          `❌ [SyncEngine] Mutation queue at maximum capacity (${pending.length}/${QUEUE_MAX_SIZE}). ` +
          `Please sync immediately to prevent data loss!`
        );

        // Dispatch critical warning event
        window.dispatchEvent(new CustomEvent('replication:queue-overflow', {
          detail: { queueSize: pending.length, maxSize: QUEUE_MAX_SIZE }
        }));
      } else if (pending.length >= QUEUE_WARNING_THRESHOLD) {
        logger.warn(
          `⚠️ [SyncEngine] Mutation queue is getting large (${pending.length}/${QUEUE_MAX_SIZE}). Consider syncing soon.`
        );
      }

      logger.log(
        `🔄 [SyncEngine] Uploading ${pending.length} pending mutations...`
      );

      // Day 25-26: Sort mutations to respect dependencies
      const sortedMutations = this.topologicalSortMutations(pending as PendingMutation[]);

      if (sortedMutations.length < pending.length) {
        logger.warn(
          `⚠️ [SyncEngine] Circular dependency detected! ${pending.length - sortedMutations.length} mutations skipped`
        );
      }

      const results: SyncResult[] = [];
      const failedMutations: PendingMutation[] = [];

      for (const mutation of sortedMutations) {
        try {
          // Execute mutation on server
          await this.executeMutation(mutation);

          // Delete from pending queue
          await db.delete(REPLICATION_STORES.PENDING_MUTATIONS, mutation.id);

          // Day 25-26: Backup after each successful mutation
          await this.backupMutationsToLocalStorage();

          results.push({
            success: true,
            tableName: mutation.tableName,
            operation: mutation.operation,
            rowsAffected: 1,
            duration: 0,
          });

          logger.log(
            `✅ [SyncEngine] Mutation ${mutation.id} uploaded successfully`
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);

          // Increment retry count
          mutation.retries = (mutation.retries || 0) + 1;

          // Mark as failed if max retries exceeded
          if (mutation.retries >= this.maxRetries) {
            mutation.status = 'failed';
            mutation.error = `Max retries exceeded: ${message}`;
            failedMutations.push(mutation);

            logger.error(
              `❌ [SyncEngine] Mutation ${mutation.id} failed permanently:`,
              error
            );
          } else {
            mutation.status = 'pending';
            mutation.error = message;

            logger.error(
              `⚠️ [SyncEngine] Mutation ${mutation.id} failed (retry ${mutation.retries}/${this.maxRetries}):`,
              error
            );
          }

          // Update mutation in queue
          await db.put(REPLICATION_STORES.PENDING_MUTATIONS, mutation);

          results.push({
            success: false,
            tableName: mutation.tableName,
            operation: mutation.operation,
            rowsAffected: 0,
            duration: 0,
            error: message,
          });
        }
      }

      // Notify user if any mutations permanently failed
      if (failedMutations.length > 0) {
        this.notifyUserOfSyncFailure(failedMutations);
      }

      const duration = Date.now() - startTime;
      logger.log(
        `✅ [SyncEngine] Uploaded ${results.filter((r) => r.success).length}/${pending.length} mutations in ${duration}ms`
      );

      return results;
    } catch (error) {
      logger.error('❌ [SyncEngine] Failed to upload mutations:', error);
      return [];
    }
  }

  /**
   * Execute a single mutation on the server
   */
  private async executeMutation(mutation: PendingMutation): Promise<void> {
    const { tableName, operation, data } = mutation;

    switch (operation) {
      case 'INSERT':
      case 'UPDATE': {
        const { error } = await supabase.from(tableName).upsert(data);
        if (error) throw error;
        break;
      }

      case 'DELETE': {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', data.id);
        if (error) throw error;
        break;
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Get sync metadata for a table
   */
  private async getSyncMetadata(tableName: string): Promise<SyncMetadata | null> {
    try {
      const db = await this.init();
      const metadata = await db.get(REPLICATION_STORES.SYNC_METADATA, tableName);
      return metadata || null;
    } catch (error) {
      logger.error(`Failed to get sync metadata for ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Update sync metadata for a table
   */
  private async updateSyncMetadata(
    tableName: string,
    updates: Partial<SyncMetadata>
  ): Promise<void> {
    try {
      const db = await this.init();
      const existing = await this.getSyncMetadata(tableName);

      const metadata: SyncMetadata = {
        tableName,
        lastFullSyncAt: existing?.lastFullSyncAt || 0,
        lastIncrementalSyncAt: existing?.lastIncrementalSyncAt || 0,
        totalRows: existing?.totalRows || 0,
        ...updates,
      };

      await db.put(REPLICATION_STORES.SYNC_METADATA, metadata);
    } catch (error) {
      logger.error(`Failed to update sync metadata for ${tableName}:`, error);
    }
  }

  /**
   * Topological sort mutations to respect dependencies
   * Day 25-26: Prevent out-of-order execution
   *
   * @returns Sorted mutations (cycles are broken by skipping dependent nodes)
   */
  private topologicalSortMutations(mutations: PendingMutation[]): PendingMutation[] {
    // Build adjacency list (mutation ID -> dependents)
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const mutationMap = new Map<string, PendingMutation>();

    // Initialize
    for (const mutation of mutations) {
      mutationMap.set(mutation.id, mutation);
      graph.set(mutation.id, []);
      inDegree.set(mutation.id, 0);
    }

    // Build dependency graph
    for (const mutation of mutations) {
      if (mutation.dependsOn && mutation.dependsOn.length > 0) {
        for (const depId of mutation.dependsOn) {
          // Only add edge if dependency exists in current batch
          if (mutationMap.has(depId)) {
            graph.get(depId)!.push(mutation.id);
            inDegree.set(mutation.id, (inDegree.get(mutation.id) || 0) + 1);
          }
        }
      }
    }

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const sorted: PendingMutation[] = [];

    // Find all nodes with no dependencies
    for (const [id, degree] of inDegree) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const id = queue.shift()!;
      const mutation = mutationMap.get(id)!;
      sorted.push(mutation);

      // Reduce in-degree of dependents
      const dependents = graph.get(id) || [];
      for (const depId of dependents) {
        const newDegree = (inDegree.get(depId) || 0) - 1;
        inDegree.set(depId, newDegree);

        if (newDegree === 0) {
          queue.push(depId);
        }
      }
    }

    // Fallback: If circular dependency detected, add remaining mutations by sequence/timestamp
    if (sorted.length < mutations.length) {
      const remaining = mutations.filter(m => !sorted.includes(m));

      // Sort remaining by sequenceNumber (if exists) or timestamp
      remaining.sort((a, b) => {
        if (a.sequenceNumber !== undefined && b.sequenceNumber !== undefined) {
          return a.sequenceNumber - b.sequenceNumber;
        }
        return a.timestamp - b.timestamp;
      });

      logger.warn(
        `[SyncEngine] Circular dependency detected, adding ${remaining.length} mutations in timestamp order`
      );

      sorted.push(...remaining);
    }

    return sorted;
  }

  /**
   * Notify user of sync failures via custom event
   */
  private notifyUserOfSyncFailure(failedMutations: PendingMutation[]): void {
    const event = new CustomEvent('replication:sync-failed', {
      detail: {
        count: failedMutations.length,
        mutations: failedMutations,
        message: `${failedMutations.length} change(s) failed to sync. Please check your connection and try again.`,
      },
    });

    window.dispatchEvent(event);

    logger.error(
      `[SyncEngine] ${failedMutations.length} mutations failed permanently`,
      failedMutations
    );
  }

  /**
   * Backup pending mutations to localStorage
   * Day 25-26: Prevent data loss if IndexedDB cleared
   * Issue #12 Fix: Debounce backup writes to prevent race conditions
   */
  private async backupMutationsToLocalStorage(): Promise<void> {
    // Clear existing timer
    if (this.backupDebounceTimer) {
      clearTimeout(this.backupDebounceTimer);
    }

    // Debounce for 1 second
    return new Promise((resolve) => {
      this.backupDebounceTimer = setTimeout(async () => {
        // Issue #12 Fix: Skip if backup already in progress
        if (this.isBackupInProgress) {
          logger.log('[SyncEngine] Backup already in progress, skipping duplicate call');
          resolve();
          return;
        }

        this.isBackupInProgress = true;
        try {
          const db = await this.init();
          const pending = await db.getAll(REPLICATION_STORES.PENDING_MUTATIONS);

          if (pending.length > 0) {
            localStorage.setItem('replication_mutation_backup', JSON.stringify(pending));
            logger.log(`[SyncEngine] Backed up ${pending.length} mutations to localStorage`);
          } else {
            localStorage.removeItem('replication_mutation_backup');
          }
        } catch (error) {
          logger.warn('[SyncEngine] Failed to backup mutations to localStorage:', error);
        } finally {
          this.isBackupInProgress = false;
          resolve();
        }
      }, 1000); // 1 second debounce
    });
  }

  /**
   * Restore pending mutations from localStorage backup
   * Day 25-26: Recover from IndexedDB clear
   */
  private async restoreMutationsFromLocalStorage(): Promise<void> {
    try {
      const backup = localStorage.getItem('replication_mutation_backup');

      if (!backup) {
        return; // No backup to restore
      }

      const mutations = JSON.parse(backup) as PendingMutation[];

      if (mutations.length === 0) {
        return;
      }

      const db = await this.init();

      // Check if mutations already exist in IndexedDB
      const existing = await db.getAll(REPLICATION_STORES.PENDING_MUTATIONS);
      const existingIds = new Set(existing.map((m: PendingMutation) => m.id));

      let restoredCount = 0;

      for (const mutation of mutations) {
        // Only restore if not already in IndexedDB
        if (!existingIds.has(mutation.id)) {
          await db.put(REPLICATION_STORES.PENDING_MUTATIONS, mutation);
          restoredCount++;
        }
      }

      if (restoredCount > 0) {
        logger.log(`[SyncEngine] ✅ Restored ${restoredCount} mutations from localStorage backup`);
      }
    } catch (error) {
      logger.error('[SyncEngine] Failed to restore mutations from localStorage:', error);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = async (): Promise<void> => {
    this.isOnline = true;
    logger.log('🌐 [SyncEngine] Network online');

    // Day 25-26: Restore mutations from localStorage if needed
    await this.restoreMutationsFromLocalStorage();

    if (this.autoSyncOnReconnect && !this.isSyncing) {
      logger.log('🔄 [SyncEngine] Auto-syncing after reconnect...');
      // Note: This requires ReplicationManager to be implemented
      // For now, we just log and dispatch an event
      window.dispatchEvent(new CustomEvent('replication:network-online'));
    }
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.isOnline = false;
    logger.log('📴 [SyncEngine] Network offline');
    window.dispatchEvent(new CustomEvent('replication:network-offline'));
  };

  /**
   * Check if online
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Check quota before sync to prevent QuotaExceededError
   * Day 25-26 MEDIUM Fix: Proactive quota management
   *
   * @param estimatedSizeMB - Estimated size of data to sync
   * @returns Result indicating if space is available
   */
  private async checkQuotaBeforeSync(estimatedSizeMB: number): Promise<{
    hasSpace: boolean;
    availableMB: number;
    needsEviction: boolean;
  }> {
    try {
      // Check IndexedDB quota (if available)
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage || 0) / 1024 / 1024;
        const quotaMB = (estimate.quota || 0) / 1024 / 1024;
        const availableMB = quotaMB - usedMB;

        // Reserve 10% of quota for safety margin
        const safeAvailableMB = availableMB * 0.9;

        logger.log(
          `[SyncEngine] Quota check: ${usedMB.toFixed(2)}/${quotaMB.toFixed(2)} MB used, ` +
          `${safeAvailableMB.toFixed(2)} MB available (need ${estimatedSizeMB.toFixed(2)} MB)`
        );

        if (estimatedSizeMB > safeAvailableMB) {
          // Need eviction or will exceed quota
          return {
            hasSpace: false,
            availableMB: safeAvailableMB,
            needsEviction: true,
          };
        }

        return {
          hasSpace: true,
          availableMB: safeAvailableMB,
          needsEviction: false,
        };
      }

      // Fallback: navigator.storage not available (assume space available)
      logger.warn('[SyncEngine] Quota API not available, assuming space available');
      return {
        hasSpace: true,
        availableMB: Infinity,
        needsEviction: false,
      };
    } catch (error) {
      logger.error('[SyncEngine] Quota check failed:', error);
      // On error, assume space available (fail gracefully)
      return {
        hasSpace: true,
        availableMB: Infinity,
        needsEviction: false,
      };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    logger.log('🗑️ [SyncEngine] Destroyed');
  }
}
