/**
 * Replication System Initialization
 *
 * Initializes the ReplicationManager and registers all tables.
 * Called from app startup (main.tsx or App.tsx).
 *
 * **Phase 4 Day 16** - UI Integration
 */

import {
  initReplicationManager,
  getReplicationManager,
  replicatedEntriesTable,
  replicatedClassesTable,
  replicatedTrialsTable,
  replicatedShowsTable,
  replicatedClassRequirementsTable,
  replicatedShowVisibilityDefaultsTable,
  replicatedTrialVisibilityOverridesTable,
  replicatedClassVisibilityOverridesTable,
  replicatedAnnouncementsTable,
  replicatedAnnouncementReadsTable,
  replicatedPushSubscriptionsTable,
  replicatedPushNotificationConfigTable,
  replicatedStatsViewTable,
  replicatedEventStatisticsTable,
  replicatedNationalsRankingsTable,
  replicatedAuditLogViewTable,
} from './index';
import { isReplicationEnabled, handleDatabaseCorruption } from './replicationConfig';

// Track if we've already initialized to prevent duplicate initialization
let isInitialized = false;

/**
 * Initialize the replication system
 * Should be called once at app startup
 * Subsequent calls will be ignored to prevent duplicate initialization
 */
export async function initializeReplication(): Promise<void> {
  try {
    // Check if replication is enabled
    if (!isReplicationEnabled()) {
      console.warn('[Replication] Replication is disabled, skipping initialization');
      return;
    }

    // Prevent duplicate initialization
    if (isInitialized) {
      console.log('[Replication] Already initialized, skipping duplicate initialization');
      return;
    }

    // Get license key from auth
    const auth = JSON.parse(localStorage.getItem('myK9Q_auth') || '{}');
    const licenseKey = auth.showContext?.licenseKey;

    if (!licenseKey) {
      console.log('[Replication] No license key found, skipping initialization');
      return;
    }

    console.log('[Replication] Initializing replication system...');
    isInitialized = true; // Mark as initialized

    // Initialize ReplicationManager with configuration
    const manager = initReplicationManager({
      licenseKey,
      autoSyncInterval: 5 * 60 * 1000, // 5 minutes
      autoSyncOnStartup: true,
      autoSyncOnReconnect: true,
    });

    // Register all tables
    console.log('[Replication] Registering tables...');

    // Core tables
    manager.registerTable('entries', replicatedEntriesTable);
    manager.registerTable('classes', replicatedClassesTable);
    manager.registerTable('trials', replicatedTrialsTable);
    manager.registerTable('shows', replicatedShowsTable);
    manager.registerTable('class_requirements', replicatedClassRequirementsTable);

    // Visibility config tables
    manager.registerTable('show_result_visibility_defaults', replicatedShowVisibilityDefaultsTable);
    manager.registerTable('trial_result_visibility_overrides', replicatedTrialVisibilityOverridesTable);
    manager.registerTable('class_result_visibility_overrides', replicatedClassVisibilityOverridesTable);

    // Announcements & Push Notifications (Day 16-17)
    manager.registerTable('announcements', replicatedAnnouncementsTable);
    manager.registerTable('announcement_reads', replicatedAnnouncementReadsTable);
    manager.registerTable('push_subscriptions', replicatedPushSubscriptionsTable);
    manager.registerTable('push_notification_config', replicatedPushNotificationConfigTable);

    // Statistics Views (Day 18)
    manager.registerTable('view_stats_summary', replicatedStatsViewTable);

    // Nationals Tables (Day 19 - Dormant)
    manager.registerTable('event_statistics', replicatedEventStatisticsTable);
    manager.registerTable('nationals_rankings', replicatedNationalsRankingsTable);

    // Audit Log View (Day 20)
    manager.registerTable('view_audit_log', replicatedAuditLogViewTable);

    console.log('[Replication] Registered 16 tables');

    // Start auto-sync (will sync enabled tables on interval)
    manager.startAutoSync();

    console.log('[Replication] ✅ Replication system initialized successfully');
  } catch (error) {
    console.error('[Replication] Failed to initialize replication system:', error);
    // Don't throw - app should work without replication
  }
}

/**
 * Trigger a manual sync for a specific table
 * Useful for pull-to-refresh functionality
 */
export async function triggerManualSync(tableName: string): Promise<void> {
  const manager = getReplicationManager();
  if (!manager) {
    console.warn('[Replication] Cannot sync - manager not initialized');
    return;
  }

  try {
    console.log(`[Replication] Manual sync triggered for ${tableName}`);
    const result = await manager.syncTable(tableName);

    if (result.success) {
      console.log(`[Replication] ✅ Manual sync complete: ${result.rowsAffected} rows`);
    } else {
      console.error(`[Replication] ❌ Manual sync failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`[Replication] Manual sync error for ${tableName}:`, error);
  }
}

/**
 * Trigger a full sync (all tables)
 * Useful for initial data load
 */
export async function triggerFullSync(licenseKey: string): Promise<void> {
  const manager = getReplicationManager();
  if (!manager) {
    console.warn('[Replication] Cannot sync - manager not initialized');
    return;
  }

  try {
    console.log('[Replication] Full sync triggered for all tables');
    const results = await manager.syncAll({ licenseKey, forceFullSync: true });

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Replication] ✅ Full sync complete: ${successful} succeeded, ${failed} failed`);
  } catch (error) {
    console.error('[Replication] Full sync error:', error);
  }
}

/**
 * Clear all caches (call when switching shows)
 * Prevents multi-tenant data leakage
 */
export async function clearReplicationCaches(): Promise<void> {
  const manager = getReplicationManager();
  if (!manager) {
    console.warn('[Replication] Cannot clear caches - manager not initialized');
    return;
  }

  try {
    console.log('[Replication] Clearing all caches for show change...');
    await manager.clearAllCaches();
    console.log('[Replication] ✅ All caches cleared');
  } catch (error) {
    console.error('[Replication] Failed to clear caches:', error);
  }
}

/**
 * Get performance report for monitoring
 */
export async function getReplicationPerformance() {
  const manager = getReplicationManager();
  if (!manager) {
    return null;
  }

  return await manager.getPerformanceReport();
}

/**
 * Refresh a specific table (pull-to-refresh)
 * Forces a full sync to get the latest data from server
 */
export async function refreshTable(tableName: string): Promise<void> {
  const manager = getReplicationManager();
  if (!manager) {
    console.warn('[Replication] Cannot refresh - manager not initialized');
    return;
  }

  try {
    console.log(`[Replication] Refreshing table: ${tableName}`);
    const result = await manager.refreshTable(tableName);

    if (result.success) {
      console.log(`[Replication] ✅ Refresh complete: ${result.rowsAffected} rows`);
    } else {
      console.error(`[Replication] ❌ Refresh failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`[Replication] Refresh error for ${tableName}:`, error);
  }
}

/**
 * Refresh all tables (pull-to-refresh)
 * Forces a full sync to get the latest data from server
 */
export async function refreshAllTables(): Promise<void> {
  const manager = getReplicationManager();
  if (!manager) {
    console.warn('[Replication] Cannot refresh - manager not initialized');
    return;
  }

  try {
    console.log('[Replication] Refreshing all tables...');
    const results = await manager.refreshAll();

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Replication] ✅ Refresh complete: ${successful} succeeded, ${failed} failed`);
  } catch (error) {
    console.error('[Replication] Refresh error:', error);
  }
}

/**
 * Re-export getReplicationManager for external use
 */
export { getReplicationManager };
