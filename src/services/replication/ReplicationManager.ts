/**
 * ReplicationManager - Central orchestrator for table replication
 *
 * Responsibilities:
 * - Register and manage all replicated tables
 * - Coordinate sync operations across tables
 * - Handle sync scheduling and prioritization
 * - Provide unified API for application code
 * - Monitor sync health and performance
 *
 * **Phase 2 Day 10** - Orchestration and coordination
 */

import { SyncEngine, type SyncOptions } from './SyncEngine';
import { PrefetchManager } from './PrefetchManager';
import type { ReplicatedTable } from './ReplicatedTable';
import type { SyncResult, PerformanceReport } from './types';
import type { ReplicatedTableName } from '@/config/featureFlags';
import { logger } from '@/utils/logger';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getReplicationMonitor } from './ReplicationMonitor';

export interface ReplicationManagerConfig {
  /** Auto-sync interval in milliseconds (default: 5 min) */
  autoSyncInterval?: number;

  /** License key for multi-tenant filtering */
  licenseKey: string;

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

  /** Day 25-26: Force full sync interval to detect server deletions (default: 24 hours) */
  forceFullSyncInterval?: number;

  /** Day 25-26 MEDIUM Fix: Enable real-time subscriptions for instant cache invalidation (default: true) */
  enableRealtimeSync?: boolean;

  /** Day 25-26 MEDIUM Fix: Enable cross-tab sync via BroadcastChannel (default: true) */
  enableCrossTabSync?: boolean;
}

export class ReplicationManager {
  private tables: Map<string, ReplicatedTable<any>> = new Map();
  private syncEngine: SyncEngine;
  private prefetchManager: PrefetchManager;
  private config: ReplicationManagerConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private syncHistory: SyncResult[] = [];

  /** Day 25-26: Track last full sync per table to detect server deletions */
  private lastFullSyncTimes: Map<string, number> = new Map();
  private readonly DEFAULT_FULL_SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  /** Day 25-26 MEDIUM Fix: Real-time subscription channels */
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  /** Day 25-26 MEDIUM Fix: Cross-tab sync via BroadcastChannel */
  private broadcastChannel: BroadcastChannel | null = null;

  /** Day 25-26 LOW Fix: Sync queue for manual sync requests */
  private syncQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;

  constructor(config: ReplicationManagerConfig) {
    this.config = config;

    this.syncEngine = new SyncEngine({
      syncInterval: config.autoSyncInterval,
      autoSyncOnReconnect: config.autoSyncOnReconnect ?? true,
    });

    // Day 23-24: Initialize prefetch manager for intelligent prefetching
    this.prefetchManager = new PrefetchManager(this);

    // Listen for network events
    window.addEventListener('replication:network-online', this.handleOnline);
    window.addEventListener('replication:network-offline', this.handleOffline);

    // Day 25-26 MEDIUM Fix: Initialize cross-tab sync
    if (config.enableCrossTabSync !== false) {
      this.initCrossTabSync();
    }

    logger.log('✅ [ReplicationManager] Initialized with prefetching and real-time sync');
  }

  /**
   * Register a table for replication
   * Day 25-26 MEDIUM Fix: Also subscribe to real-time changes
   */
  registerTable<T extends { id: string }>(
    tableName: ReplicatedTableName,
    table: ReplicatedTable<T>
  ): void {
    if (this.tables.has(tableName)) {
      logger.warn(
        `[ReplicationManager] Table "${tableName}" already registered, skipping`
      );
      return;
    }

    this.tables.set(tableName, table);
    logger.log(`[ReplicationManager] Registered table: ${tableName}`);

    // Day 25-26 MEDIUM Fix: Subscribe to real-time changes if enabled
    if (this.config.enableRealtimeSync !== false) {
      this.subscribeToRealtimeChanges(tableName);
    }
  }

  /**
   * Unregister a table
   * Day 25-26 MEDIUM Fix: Also unsubscribe from real-time changes
   */
  unregisterTable(tableName: string): void {
    if (this.tables.delete(tableName)) {
      // Day 25-26 MEDIUM Fix: Unsubscribe from real-time changes
      this.unsubscribeFromRealtimeChanges(tableName);
      logger.log(`[ReplicationManager] Unregistered table: ${tableName}`);
    }
  }

  /**
   * Get a registered table
   */
  getTable<T extends { id: string }>(
    tableName: string
  ): ReplicatedTable<T> | null {
    return (this.tables.get(tableName) as ReplicatedTable<T>) || null;
  }

  /**
   * Day 25-26 LOW Fix: Check if sync is currently in progress
   * Used by PrefetchManager to avoid concurrent sync+prefetch
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get all registered table names
   */
  getRegisteredTables(): string[] {
    return Array.from(this.tables.keys());
  }

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
      logger.error(`[ReplicationManager] ${error}`);

      return {
        tableName,
        success: false,
        operation: 'incremental-sync',
        rowsAffected: 0,
        duration: 0,
        error,
      };
    }

    // Day 25-26: Check if full sync is needed to detect server deletions
    const fullSyncInterval = this.config.forceFullSyncInterval || this.DEFAULT_FULL_SYNC_INTERVAL;
    const lastFullSync = this.lastFullSyncTimes.get(tableName) || 0;
    const timeSinceFullSync = Date.now() - lastFullSync;

    const forceFullSync = options?.forceFullSync || timeSinceFullSync > fullSyncInterval;

    if (forceFullSync && !options?.forceFullSync) {
      logger.log(
        `[ReplicationManager] Forcing full sync for ${tableName} (last full sync: ${(timeSinceFullSync / 1000 / 60 / 60).toFixed(1)}h ago)`
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

    // Day 27: Record sync result in monitor
    const monitor = getReplicationMonitor();
    monitor.recordSync(result);

    return result;
  }

  /**
   * Sync all registered tables
   * Day 25-26 LOW Fix: Queue manual sync if auto-sync running
   */
  async syncAll(options?: Partial<SyncOptions>): Promise<SyncResult[]> {
    // Day 25-26 LOW Fix: If sync in progress, queue this request
    if (this.isSyncing) {
      logger.warn('[ReplicationManager] Sync already in progress, queuing request...');

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
   * Day 25-26 LOW Fix: Extracted for queue processing
   */
  private async _syncAllInternal(options?: Partial<SyncOptions>): Promise<SyncResult[]> {
    this.isSyncing = true;
    console.log('[ReplicationManager] Starting sync for all tables...');

    const startTime = Date.now();
    const results: SyncResult[] = [];

    try {
      // Day 25-26 LOW Fix: Phase 1 - Upload mutations BEFORE download sync
      // This prevents race conditions where download overwrites pending uploads
      console.log('[ReplicationManager] Phase 1: Uploading pending mutations...');
      const mutationResults = await this.syncEngine.uploadPendingMutations();
      console.log('[ReplicationManager] Phase 1 complete:', mutationResults.length, 'mutations uploaded');
      results.push(...mutationResults);

      // Day 25-26 LOW Fix: Phase 2 - Download sync (mutations are now synced)
      const tableNames = Array.from(this.tables.keys());
      console.log('[ReplicationManager] Phase 2: Syncing', tableNames.length, 'tables...');

      for (const tableName of tableNames) {
        try {
          console.log(`[ReplicationManager] Syncing table: ${tableName}`);
          const result = await this.syncTable(tableName, options);
          console.log(`[ReplicationManager] Table ${tableName} sync result:`, result);
          results.push(result);
        } catch (error) {
          console.error(
            `[ReplicationManager] Failed to sync table ${tableName}:`,
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

      console.log(
        `✅ [ReplicationManager] Sync complete: ${successCount}/${results.length} tables synced in ${duration}ms`
      );

      // Day 23-24: Check quota and evict if needed (after sync completes)
      if (this.config.autoQuotaManagement !== false) {
        await this.checkQuotaAndEvict();
      }

      return results;
    } finally {
      this.isSyncing = false;

      // Day 25-26 LOW Fix: Process queued sync requests
      this.processQueueIfNeeded();
    }
  }

  /**
   * Process queued sync requests
   * Day 25-26 LOW Fix: Execute queued manual syncs after auto-sync completes
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
          logger.log(`[ReplicationManager] Processing queued sync (${this.syncQueue.length} remaining)...`);
          await syncFn();
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Check cache size and evict LRU rows if over soft limit
   * Day 23-24: Automatic quota management to prevent quota errors
   */
  private async checkQuotaAndEvict(): Promise<void> {
    try {
      const stats = await this.getCacheStats();
      const softLimit = this.config.quotaSoftLimitMB || 4.5; // 90% of 5 MB
      const target = this.config.quotaTargetMB || 5; // 5 MB = ~10 typical shows

      if (stats.totalSizeMB > softLimit) {
        logger.warn(
          `[ReplicationManager] Cache at ${stats.totalSizeMB.toFixed(2)} MB (soft limit: ${softLimit} MB), evicting to ${target} MB...`
        );
        const evicted = await this.evictLRU(target);
        logger.log(
          `[ReplicationManager] Quota management: evicted ${evicted} rows, cache now ~${target} MB`
        );
      }
    } catch (error) {
      logger.error('[ReplicationManager] Quota check failed:', error);
      // Don't throw - quota management is best-effort
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
      logger.error(`[ReplicationManager] ${error}`);

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
    logger.log('[ReplicationManager] Starting full sync for all tables...');

    const results: SyncResult[] = [];
    const tableNames = Array.from(this.tables.keys());

    for (const tableName of tableNames) {
      try {
        const result = await this.fullSyncTable(tableName, options);
        results.push(result);
      } catch (error) {
        logger.error(
          `[ReplicationManager] Failed to full sync table ${tableName}:`,
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
    logger.log(`[ReplicationManager] Refreshing table: ${tableName}`);
    return this.fullSyncTable(tableName, options);
  }

  /**
   * Refresh all tables (alias for fullSyncAll for pull-to-refresh UIs)
   * Forces a full sync to get the latest data from server
   */
  async refreshAll(options?: Partial<SyncOptions>): Promise<SyncResult[]> {
    logger.log('[ReplicationManager] Refreshing all tables...');
    return this.fullSyncAll(options);
  }

  /**
   * Start automatic sync timer
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      logger.warn('[ReplicationManager] Auto-sync already running');
      return;
    }

    const interval = this.config.autoSyncInterval || 5 * 60 * 1000; // 5 min default

    this.syncTimer = setInterval(() => {
      if (!this.isSyncing) {
        this.syncAll().catch((error) => {
          logger.error('[ReplicationManager] Auto-sync failed:', error);
        });
      }
    }, interval);

    logger.log(
      `🔄 [ReplicationManager] Auto-sync started (every ${interval / 1000}s)`
    );

    // Run initial sync if enabled
    if (this.config.autoSyncOnStartup) {
      logger.log('[ReplicationManager] Running initial sync...');
      this.syncAll().catch((error) => {
        logger.error('[ReplicationManager] Initial sync failed:', error);
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
      logger.log('⏸️ [ReplicationManager] Auto-sync stopped');
    }
  }

  /**
   * Stop replication manager and cleanup resources
   */
  async stop(): Promise<void> {
    console.log('[ReplicationManager] Stopping replication...');

    // Stop auto sync
    this.stopAutoSync();

    // Clear sync queue
    this.syncQueue = [];

    // Mark as not syncing
    this.isSyncing = false;
    this.isProcessingQueue = false;

    // Cleanup tables (close DB connections)
    for (const [tableName, table] of this.tables) {
      try {
        // If table has a cleanup method, call it
        if (typeof (table as any).cleanup === 'function') {
          await (table as any).cleanup();
        }
      } catch (error) {
        console.warn(`[ReplicationManager] Error cleaning up table ${tableName}:`, error);
      }
    }

    // Clear tables map
    this.tables.clear();

    console.log('[ReplicationManager] Replication stopped');
  }


  /**
   * Clear all caches (e.g., when switching shows)
   * This prevents multi-tenant data leakage
   */
  async clearAllCaches(): Promise<void> {
    logger.log('[ReplicationManager] Clearing all caches...');

    const tableNames = Array.from(this.tables.keys());

    for (const tableName of tableNames) {
      const table = this.tables.get(tableName);
      if (table) {
        try {
          await table.clearCache();
          logger.log(`[ReplicationManager] Cleared cache for ${tableName}`);
        } catch (error) {
          logger.error(`[ReplicationManager] Failed to clear cache for ${tableName}:`, error);
        }
      }
    }

    logger.log('[ReplicationManager] ✅ All caches cleared');
  }

  /**
   * Check if network is online
   */
  isOnline(): boolean {
    return this.syncEngine.isNetworkOnline();
  }

  /**
   * Get sync history
   */
  getSyncHistory(limit: number = 10): SyncResult[] {
    return this.syncHistory.slice(-limit);
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(): Promise<PerformanceReport> {
    const recentSyncs = this.getSyncHistory(50);
    const successfulSyncs = recentSyncs.filter((r) => r.success);

    const avgSyncDuration =
      successfulSyncs.length > 0
        ? successfulSyncs.reduce((sum, r) => sum + r.duration, 0) /
          successfulSyncs.length
        : 0;

    const totalConflicts = successfulSyncs.reduce(
      (sum, r) => sum + (r.conflictsResolved || 0),
      0
    );

    const mutationSuccessRate =
      recentSyncs.length > 0
        ? (successfulSyncs.length / recentSyncs.length) * 100
        : 100;

    // Get storage estimate
    let storageUsedMB = '0';
    try {
      const estimate = await navigator.storage?.estimate();
      if (estimate?.usage) {
        storageUsedMB = (estimate.usage / (1024 * 1024)).toFixed(1);
      }
    } catch (error) {
      logger.error('Failed to get storage estimate:', error);
    }

    return {
      cacheHitRate: 'N/A', // Will be implemented when we add cache metrics
      avgSyncDuration: `${avgSyncDuration.toFixed(0)}ms`,
      conflictsResolved: totalConflicts,
      mutationSuccessRate: Math.round(mutationSuccessRate),
      storageUsedMB,
      tablesReplicated: this.tables.size,
    };
  }

  /**
   * Handle network online event
   */
  private handleOnline = async (): Promise<void> => {
    logger.log('[ReplicationManager] Network online, triggering sync...');

    if (!this.isSyncing) {
      await this.syncAll().catch((error) => {
        logger.error('[ReplicationManager] Online sync failed:', error);
      });
    }
  };

  /**
   * Handle network offline event
   */
  private handleOffline = (): void => {
    logger.log('[ReplicationManager] Network offline, sync paused');
  };

  /**
   * Track page navigation for intelligent prefetching
   * Day 23-24: Performance optimization
   */
  trackNavigation(pagePath: string): void {
    this.prefetchManager.trackNavigation(pagePath);
  }

  /**
   * Get prefetch statistics
   * Day 23-24: For debugging and monitoring
   */
  getPrefetchStats(): {
    totalPatterns: number;
    mostCommonTransition: string | null;
    currentPage: string;
  } {
    return this.prefetchManager.getStats();
  }

  /**
   * Manually trigger prefetch for a specific page
   * Day 23-24: Performance optimization
   */
  async prefetchForPage(pageName: string): Promise<void> {
    return this.prefetchManager.prefetchForPage(pageName);
  }

  /**
   * Run LRU eviction on all tables to reduce memory footprint
   * Day 23-24: Performance optimization
   *
   * @param targetSizeMB - Target total cache size in MB (default: 50 MB)
   * @returns Total number of rows evicted across all tables
   */
  async evictLRU(targetSizeMB: number = 50): Promise<number> {
    const targetSizeBytes = targetSizeMB * 1024 * 1024;

    logger.log(`[ReplicationManager] Starting LRU eviction (target: ${targetSizeMB} MB)`);

    // Get total size across all tables
    let totalSize = 0;
    const tableSizes: Array<{ tableName: string; size: number; table: ReplicatedTable<any> }> = [];

    for (const [tableName, table] of this.tables) {
      const stats = await table.getCacheStats();
      totalSize += stats.sizeBytes;
      tableSizes.push({ tableName, size: stats.sizeBytes, table });
    }

    const totalSizeMB = totalSize / 1024 / 1024;

    if (totalSize <= targetSizeBytes) {
      logger.log(
        `[ReplicationManager] Total cache size ${totalSizeMB.toFixed(2)} MB already under target`
      );
      return 0;
    }

    logger.log(
      `[ReplicationManager] Total cache size: ${totalSizeMB.toFixed(2)} MB, evicting to ${targetSizeMB} MB`
    );

    // Sort tables by size (largest first)
    tableSizes.sort((a, b) => b.size - a.size);

    // Calculate target size per table (proportional to current size)
    let totalEvicted = 0;

    for (const { tableName, size, table } of tableSizes) {
      const proportion = size / totalSize;
      const tableTargetSize = Math.floor(targetSizeBytes * proportion);

      if (size > tableTargetSize) {
        const evicted = await table.evictLRU(tableTargetSize);
        totalEvicted += evicted;
        logger.log(
          `[ReplicationManager] Evicted ${evicted} rows from ${tableName}`
        );
      }
    }

    logger.log(
      `[ReplicationManager] LRU eviction complete: ${totalEvicted} rows evicted`
    );

    return totalEvicted;
  }

  /**
   * Get cache statistics across all tables
   * Day 23-24: Monitoring for LRU eviction decisions
   */
  async getCacheStats(): Promise<{
    totalRows: number;
    totalSizeMB: number;
    tableStats: Array<{
      tableName: string;
      rowCount: number;
      sizeMB: number;
      dirtyCount: number;
    }>;
  }> {
    const tableStats: Array<{
      tableName: string;
      rowCount: number;
      sizeMB: number;
      dirtyCount: number;
    }> = [];

    let totalRows = 0;
    let totalSizeBytes = 0;

    for (const [tableName, table] of this.tables) {
      const stats = await table.getCacheStats();
      totalRows += stats.rowCount;
      totalSizeBytes += stats.sizeBytes;

      tableStats.push({
        tableName,
        rowCount: stats.rowCount,
        sizeMB: stats.sizeMB,
        dirtyCount: stats.dirtyCount,
      });
    }

    return {
      totalRows,
      totalSizeMB: totalSizeBytes / 1024 / 1024,
      tableStats: tableStats.sort((a, b) => b.sizeMB - a.sizeMB),
    };
  }

  /**
   * Initialize cross-tab sync via BroadcastChannel
   * Day 25-26 MEDIUM Fix: Instant cache invalidation across browser tabs
   */
  private initCrossTabSync(): void {
    try {
      this.broadcastChannel = new BroadcastChannel('replication-sync');

      this.broadcastChannel.onmessage = (event) => {
        const { type, tableName, licenseKey } = event.data;

        // Only process messages for our license key
        if (licenseKey !== this.config.licenseKey) {
          return;
        }

        if (type === 'table-changed') {
          logger.log(`[ReplicationManager] Cross-tab sync: ${tableName} changed in another tab`);

          // Trigger incremental sync for this table
          const table = this.getTable(tableName);
          if (table) {
            this.syncTable(tableName, { forceFullSync: false }).catch((error) => {
              logger.error(`[ReplicationManager] Cross-tab sync failed for ${tableName}:`, error);
            });
          }
        }
      };

      logger.log('✅ [ReplicationManager] Cross-tab sync initialized');
    } catch (error) {
      logger.warn('[ReplicationManager] BroadcastChannel not supported:', error);
    }
  }

  /**
   * Subscribe to real-time changes for a table
   * Day 25-26 MEDIUM Fix: Instant cache invalidation via Supabase real-time
   */
  private subscribeToRealtimeChanges(tableName: string): void {
    try {
      const channel = supabase
        .channel(`replication:${tableName}:${this.config.licenseKey}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: tableName,
            filter: `license_key=eq.${this.config.licenseKey}`,
          },
          (payload) => {
            logger.log(`[ReplicationManager] Real-time change detected in ${tableName}:`, payload.eventType);

            // Trigger incremental sync for this table
            const table = this.getTable(tableName);
            if (table) {
              this.syncTable(tableName, { forceFullSync: false }).catch((error) => {
                logger.error(`[ReplicationManager] Real-time sync failed for ${tableName}:`, error);
              });
            }

            // Notify other tabs via BroadcastChannel
            if (this.broadcastChannel) {
              this.broadcastChannel.postMessage({
                type: 'table-changed',
                tableName,
                licenseKey: this.config.licenseKey,
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.log(`✅ [ReplicationManager] Real-time subscription active for ${tableName}`);
          } else if (status === 'CHANNEL_ERROR') {
            logger.error(`[ReplicationManager] Real-time subscription error for ${tableName}`);
          }
        });

      this.realtimeChannels.set(tableName, channel);
    } catch (error) {
      logger.error(`[ReplicationManager] Failed to subscribe to real-time changes for ${tableName}:`, error);
    }
  }

  /**
   * Unsubscribe from real-time changes for a table
   * Day 25-26 MEDIUM Fix: Clean up subscriptions
   */
  private unsubscribeFromRealtimeChanges(tableName: string): void {
    const channel = this.realtimeChannels.get(tableName);
    if (channel) {
      supabase.removeChannel(channel);
      this.realtimeChannels.delete(tableName);
      logger.log(`[ReplicationManager] Unsubscribed from real-time changes for ${tableName}`);
    }
  }

  /**
   * Cleanup resources
   * Day 25-26 MEDIUM Fix: Also clean up real-time subscriptions
   */
  destroy(): void {
    this.stopAutoSync();

    window.removeEventListener('replication:network-online', this.handleOnline);
    window.removeEventListener(
      'replication:network-offline',
      this.handleOffline
    );

    // Day 25-26 MEDIUM Fix: Clean up real-time subscriptions
    for (const [tableName, channel] of this.realtimeChannels) {
      supabase.removeChannel(channel);
      logger.log(`[ReplicationManager] Unsubscribed from ${tableName}`);
    }
    this.realtimeChannels.clear();

    // Day 25-26 MEDIUM Fix: Clean up BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.syncEngine.destroy();
    this.tables.clear();

    logger.log('🗑️ [ReplicationManager] Destroyed');
  }
}

// Singleton instance (will be initialized by app)
let instance: ReplicationManager | null = null;

export function initReplicationManager(
  config: ReplicationManagerConfig
): ReplicationManager {
  if (instance) {
    logger.warn('[ReplicationManager] Already initialized, returning existing instance');
    return instance;
  }

  instance = new ReplicationManager(config);
  return instance;
}

export function getReplicationManager(): ReplicationManager | null {
  return instance;
}

export function destroyReplicationManager(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}

export async function stopReplicationManager(): Promise<void> {
  if (instance) {
    await instance.stop();
  }
}
