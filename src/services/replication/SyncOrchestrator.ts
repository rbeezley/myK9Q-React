/**
 * SyncOrchestrator - Sync Coordination and Queue Management for Replication
 *
 * Extracted from ReplicationManager.ts (DEBT-004) to improve maintainability.
 *
 * Responsibilities:
 * - Sync coordination (syncTable, syncAll, fullSync)
 * - Sync queue management for concurrent requests
 * - Auto-sync timer management
 * - Quota monitoring and LRU eviction
 * - Sync history tracking
 */

import { SyncEngine, type SyncOptions } from './SyncEngine';
import type { ReplicatedTable } from './ReplicatedTable';
import type { SyncResult } from './types';
import { logger } from '@/utils/logger';
import { getReplicationMonitor } from './ReplicationMonitor';

/**
 * Cache statistics for quota management
 */
export interface CacheStatsResult {
  totalRows: number;
  totalSizeMB: number;
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    sizeMB: number;
    sizeBytes: number;
    dirtyCount: number;
  }>;
}

/**
 * Configuration for SyncOrchestrator
 */
export interface SyncOrchestratorConfig {
  /** License key for multi-tenant filtering */
  licenseKey: string;
  /** Auto-sync interval in milliseconds (default: 5 min) */
  autoSyncInterval?: number;
  /** Enable automatic sync on app startup */
  autoSyncOnStartup?: boolean;
  /** Enable automatic sync on network reconnect */
  autoSyncOnReconnect?: boolean;
  /** Batch size for bulk operations */
  batchSize?: number;
  /** Enable automatic quota management (default: true) */
  autoQuotaManagement?: boolean;
  /** Soft limit before eviction in MB (default: 4.5 = 90% of 5 MB target) */
  quotaSoftLimitMB?: number;
  /** Target size after eviction in MB (default: 5 MB = ~10 typical shows) */
  quotaTargetMB?: number;
  /** Force full sync interval to detect server deletions (default: 24 hours) */
  forceFullSyncInterval?: number;
}

/**
 * Callback type for getting a table by name
 */
export type GetTableCallback = <T extends { id: string }>(tableName: string) => ReplicatedTable<T> | null;

/**
 * Callback type for getting all table names
 */
export type GetTableNamesCallback = () => string[];

/**
 * Callback type for notifying cache updates
 */
export type NotifyCacheUpdateCallback = (tableName: string) => void;

/**
 * Callback type for getting cache stats (option A - avoids circular dependency)
 */
export type GetCacheStatsCallback = () => Promise<CacheStatsResult>;

/**
 * Grouped callbacks for SyncOrchestrator
 * Reduces constructor parameters by bundling related callbacks
 */
export interface SyncOrchestratorCallbacks {
  getTable: GetTableCallback;
  getTableNames: GetTableNamesCallback;
  notifyCacheUpdate: NotifyCacheUpdateCallback;
  getCacheStats: GetCacheStatsCallback;
}

/**
 * SyncOrchestrator - handles all sync coordination concerns
 */
export class SyncOrchestrator {
  private config: SyncOrchestratorConfig;
  private syncEngine: SyncEngine;
  private getTable: GetTableCallback;
  private getTableNames: GetTableNamesCallback;
  private notifyCacheUpdate: NotifyCacheUpdateCallback;
  private getCacheStats: GetCacheStatsCallback;

  /** Auto-sync timer */
  private syncTimer: NodeJS.Timeout | null = null;

  /** Sync state */
  private isSyncing: boolean = false;
  private syncHistory: SyncResult[] = [];

  /** Track last full sync per table to detect server deletions */
  private lastFullSyncTimes: Map<string, number> = new Map();
  private readonly DEFAULT_FULL_SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  /** Sync queue for manual sync requests */
  private syncQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  constructor(
    config: SyncOrchestratorConfig,
    syncEngine: SyncEngine,
    callbacks: SyncOrchestratorCallbacks
  ) {
    this.config = config;
    this.syncEngine = syncEngine;
    this.getTable = callbacks.getTable;
    this.getTableNames = callbacks.getTableNames;
    this.notifyCacheUpdate = callbacks.notifyCacheUpdate;
    this.getCacheStats = callbacks.getCacheStats;

    logger.log('✅ [SyncOrchestrator] Initialized');
  }

  // ========================================
  // SYNC STATE
  // ========================================

  /**
   * Check if sync is currently in progress
   * Used by PrefetchManager to avoid concurrent sync+prefetch
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get sync history
   */
  getSyncHistory(limit: number = 10): SyncResult[] {
    return this.syncHistory.slice(-limit);
  }

  // ========================================
  // SYNC OPERATIONS
  // ========================================

  /**
   * Sync a single table
   *
   * Day 25-26: Periodically force full sync to detect server deletions
   */
  async syncTable(
    tableName: string,
    options?: Partial<SyncOptions>
  ): Promise<SyncResult> {
    const table = this.getTable(tableName);

    if (!table) {
      const error = `Table "${tableName}" not registered`;
      logger.error(`[SyncOrchestrator] ${error}`);

      return {
        tableName,
        success: false,
        operation: 'incremental-sync',
        rowsAffected: 0,
        duration: 0,
        error,
      };
    }

    // Check if full sync is needed to detect server deletions
    const fullSyncInterval = this.config.forceFullSyncInterval || this.DEFAULT_FULL_SYNC_INTERVAL;
    const lastFullSync = this.lastFullSyncTimes.get(tableName) || 0;
    const timeSinceFullSync = Date.now() - lastFullSync;

    const forceFullSync = options?.forceFullSync || timeSinceFullSync > fullSyncInterval;

    if (forceFullSync && !options?.forceFullSync) {
      logger.log(
        `[SyncOrchestrator] Forcing full sync for ${tableName} (last full sync: ${(timeSinceFullSync / 1000 / 60 / 60).toFixed(1)}h ago)`
      );
    }

    // Build sync options
    const syncOptions: SyncOptions = {
      licenseKey: this.config.licenseKey,
      batchSize: this.config.batchSize,
      ...options,
      forceFullSync,
    };

    // Run sync using the table's custom sync() method
    // Each table implements its own sync logic with proper joins
    const result = await table.sync(syncOptions.licenseKey, syncOptions);

    // Track full sync time
    if (forceFullSync && result.success) {
      this.lastFullSyncTimes.set(tableName, Date.now());
    }

    // Store in history
    this.syncHistory.push(result);

    // Keep only last 100 sync results
    if (this.syncHistory.length > 100) {
      this.syncHistory = this.syncHistory.slice(-100);
    }

    // Record sync result in monitor
    const monitor = getReplicationMonitor();
    monitor.recordSync(result);

    // Notify UI listeners that cache has been updated (if sync was successful)
    if (result.success) {
      this.notifyCacheUpdate(tableName);
    }

    return result;
  }

  /**
   * Sync all registered tables
   * Day 25-26 LOW Fix: Queue manual sync if auto-sync running
   */
  async syncAll(options?: Partial<SyncOptions>): Promise<SyncResult[]> {
    // If sync in progress, queue this request
    if (this.isSyncing) {
      logger.warn('[SyncOrchestrator] Sync already in progress, queuing request...');

      // Dispatch event to notify UI
      window.dispatchEvent(new CustomEvent('replication:sync-queued', {
        detail: { message: 'Sync queued - will start after current sync completes' }
      }));

      // Return a promise that resolves when the queued sync completes
      return new Promise((resolve) => {
        this.syncQueue.push(async () => {
          const results = await this._syncAllInternal(options);
          resolve(results);
        });
        this.processQueueIfNeeded();
      });
    }

    return this._syncAllInternal(options);
  }

  /**
   * Internal sync all implementation
   * Extracted for queue processing
   */
  private async _syncAllInternal(options?: Partial<SyncOptions>): Promise<SyncResult[]> {
    this.isSyncing = true;
    logger.log('[SyncOrchestrator] Starting sync for all tables...');

    const startTime = Date.now();
    const results: SyncResult[] = [];

    try {
      // Phase 1 - Upload mutations BEFORE download sync
      // This prevents race conditions where download overwrites pending uploads
      logger.log('[SyncOrchestrator] Phase 1: Uploading pending mutations...');
      const mutationResults = await this.syncEngine.uploadPendingMutations();
      logger.log('[SyncOrchestrator] Phase 1 complete:', mutationResults.length, 'mutations uploaded');
      results.push(...mutationResults);

      // Phase 2 - Download sync (mutations are now synced)
      const tableNames = this.getTableNames();
      logger.log('[SyncOrchestrator] Phase 2: Syncing', tableNames.length, 'tables...');

      for (const tableName of tableNames) {
        try {
          logger.log(`[SyncOrchestrator] Syncing table: ${tableName}`);
          const result = await this.syncTable(tableName, options);
          logger.log(`[SyncOrchestrator] Table ${tableName} sync result:`, result);
          results.push(result);
        } catch (error) {
          logger.error(
            `[SyncOrchestrator] Failed to sync table ${tableName}:`,
            error
          );

          results.push({
            tableName,
            success: false,
            operation: 'incremental-sync',
            rowsAffected: 0,
            duration: 0,
            error:
              error instanceof Error ? error.message : 'Unknown sync error',
          });
        }
      }

      const duration = Date.now() - startTime;
      const successCount = results.filter((r) => r.success).length;

      logger.log(
        `✅ [SyncOrchestrator] Sync complete: ${successCount}/${results.length} tables synced in ${duration}ms`
      );

      // Check quota and evict if needed (after sync completes)
      if (this.config.autoQuotaManagement !== false) {
        await this.checkQuotaAndEvict();
      }

      return results;
    } finally {
      this.isSyncing = false;

      // Process queued sync requests
      this.processQueueIfNeeded();
    }
  }

  /**
   * Force full sync for a single table
   */
  async fullSyncTable(
    tableName: string,
    options?: Partial<SyncOptions>
  ): Promise<SyncResult> {
    const table = this.getTable(tableName);

    if (!table) {
      const error = `Table "${tableName}" not registered`;
      logger.error(`[SyncOrchestrator] ${error}`);

      return {
        tableName,
        success: false,
        operation: 'full-sync',
        rowsAffected: 0,
        duration: 0,
        error,
      };
    }

    const syncOptions: SyncOptions = {
      licenseKey: this.config.licenseKey,
      batchSize: this.config.batchSize,
      forceFullSync: true,
      ...options,
    };

    const result = await this.syncEngine.fullSync(table, syncOptions);
    this.syncHistory.push(result);

    return result;
  }

  /**
   * Force full sync for all tables
   */
  async fullSyncAll(options?: Partial<SyncOptions>): Promise<SyncResult[]> {
    logger.log('[SyncOrchestrator] Starting full sync for all tables...');

    const results: SyncResult[] = [];
    const tableNames = this.getTableNames();

    for (const tableName of tableNames) {
      try {
        const result = await this.fullSyncTable(tableName, options);
        results.push(result);
      } catch (error) {
        logger.error(
          `[SyncOrchestrator] Failed to full sync table ${tableName}:`,
          error
        );

        results.push({
          tableName,
          success: false,
          operation: 'full-sync',
          rowsAffected: 0,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown sync error',
        });
      }
    }

    return results;
  }

  /**
   * Refresh a single table (alias for fullSyncTable for pull-to-refresh UIs)
   * Forces a full sync to get the latest data from server
   */
  async refreshTable(
    tableName: string,
    options?: Partial<SyncOptions>
  ): Promise<SyncResult> {
    logger.log(`[SyncOrchestrator] Refreshing table: ${tableName}`);
    return this.fullSyncTable(tableName, options);
  }

  /**
   * Refresh all tables (alias for fullSyncAll for pull-to-refresh UIs)
   * Forces a full sync to get the latest data from server
   */
  async refreshAll(options?: Partial<SyncOptions>): Promise<SyncResult[]> {
    logger.log('[SyncOrchestrator] Refreshing all tables...');
    return this.fullSyncAll(options);
  }

  // ========================================
  // AUTO-SYNC TIMER
  // ========================================

  /**
   * Start automatic sync timer
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      logger.warn('[SyncOrchestrator] Auto-sync already running');
      return;
    }

    const interval = this.config.autoSyncInterval || 5 * 60 * 1000; // 5 min default

    this.syncTimer = setInterval(() => {
      if (!this.isSyncing) {
        this.syncAll().catch((error) => {
          logger.error('[SyncOrchestrator] Auto-sync failed:', error);
        });
      }
    }, interval);

    logger.log(
      `🔄 [SyncOrchestrator] Auto-sync started (every ${interval / 1000}s)`
    );

    // Run initial sync if enabled
    if (this.config.autoSyncOnStartup) {
      logger.log('[SyncOrchestrator] Running initial sync...');
      this.syncAll().catch((error) => {
        logger.error('[SyncOrchestrator] Initial sync failed:', error);
      });
    }
  }

  /**
   * Stop automatic sync timer
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      logger.log('⏸️ [SyncOrchestrator] Auto-sync stopped');
    }
  }

  // ========================================
  // SYNC QUEUE
  // ========================================

  /**
   * Process queued sync requests
   * Execute queued manual syncs after auto-sync completes
   */
  private async processQueueIfNeeded(): Promise<void> {
    if (this.isProcessingQueue || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.syncQueue.length > 0) {
        const syncFn = this.syncQueue.shift();
        if (syncFn) {
          logger.log(`[SyncOrchestrator] Processing queued sync (${this.syncQueue.length} remaining)...`);
          await syncFn();
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // ========================================
  // QUOTA MANAGEMENT / LRU EVICTION
  // ========================================

  /**
   * Check cache size and evict LRU rows if over soft limit
   * Automatic quota management to prevent quota errors
   */
  async checkQuotaAndEvict(): Promise<void> {
    try {
      const stats = await this.getCacheStats();
      const softLimit = this.config.quotaSoftLimitMB || 4.5; // 90% of 5 MB
      const target = this.config.quotaTargetMB || 5; // 5 MB = ~10 typical shows

      if (stats.totalSizeMB > softLimit) {
        logger.warn(
          `[SyncOrchestrator] Cache at ${stats.totalSizeMB.toFixed(2)} MB (soft limit: ${softLimit} MB), evicting to ${target} MB...`
        );
        const evicted = await this.evictLRU(target);
        logger.log(
          `[SyncOrchestrator] Quota management: evicted ${evicted} rows, cache now ~${target} MB`
        );
      }
    } catch (error) {
      logger.error('[SyncOrchestrator] Quota check failed:', error);
      // Don't throw - quota management is best-effort
    }
  }

  /**
   * Run LRU eviction on all tables to reduce memory footprint
   *
   * @param targetSizeMB - Target total cache size in MB (default: 50 MB)
   * @returns Total number of rows evicted across all tables
   */
  async evictLRU(targetSizeMB: number = 50): Promise<number> {
    const targetSizeBytes = targetSizeMB * 1024 * 1024;

    logger.log(`[SyncOrchestrator] Starting LRU eviction (target: ${targetSizeMB} MB)`);

    // Get total size across all tables
    const stats = await this.getCacheStats();
    let totalSize = stats.totalSizeMB * 1024 * 1024;

    if (totalSize <= targetSizeBytes) {
      logger.log(
        `[SyncOrchestrator] Total cache size ${stats.totalSizeMB.toFixed(2)} MB already under target`
      );
      return 0;
    }

    logger.log(
      `[SyncOrchestrator] Total cache size: ${stats.totalSizeMB.toFixed(2)} MB, evicting to ${targetSizeMB} MB`
    );

    // Sort tables by size (largest first)
    const tableSizes = stats.tableStats.sort((a, b) => b.sizeMB - a.sizeMB);

    // Calculate target size per table (proportional to current size)
    let totalEvicted = 0;

    for (const { tableName, sizeBytes } of tableSizes) {
      const table = this.getTable(tableName);
      if (!table) continue;

      const proportion = sizeBytes / totalSize;
      const tableTargetSize = Math.floor(targetSizeBytes * proportion);

      if (sizeBytes > tableTargetSize) {
        const evicted = await table.evictLRU(tableTargetSize);
        totalEvicted += evicted;
        logger.log(
          `[SyncOrchestrator] Evicted ${evicted} rows from ${tableName}`
        );
      }
    }

    logger.log(
      `[SyncOrchestrator] LRU eviction complete: ${totalEvicted} rows evicted`
    );

    return totalEvicted;
  }

  // ========================================
  // NETWORK HANDLERS
  // ========================================

  /**
   * Handle network online event
   */
  async handleNetworkOnline(): Promise<void> {
    logger.log('[SyncOrchestrator] Network online, triggering sync...');

    if (!this.isSyncing) {
      await this.syncAll().catch((error) => {
        logger.error('[SyncOrchestrator] Online sync failed:', error);
      });
    }
  }

  /**
   * Handle network offline event
   */
  handleNetworkOffline(): void {
    logger.log('[SyncOrchestrator] Network offline, sync paused');
  }

  // ========================================
  // CLEANUP
  // ========================================

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAutoSync();
    this.syncQueue = [];
    this.isSyncing = false;
    this.isProcessingQueue = false;
    this.syncHistory = [];
    this.lastFullSyncTimes.clear();

    logger.log('🗑️ [SyncOrchestrator] Destroyed');
  }
}
