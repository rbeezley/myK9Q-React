/**
 * ConnectionManager - Connection and Subscription Management for Replication
 *
 * Extracted from ReplicationManager.ts (DEBT-004) to improve maintainability.
 *
 * Responsibilities:
 * - Real-time subscriptions via Supabase
 * - Cross-tab sync via BroadcastChannel
 * - Network event handling
 * - Subscription lifecycle management
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

/**
 * Issue #8 Fix: Unique tab identifier to prevent cross-tab message echo
 * Each browser tab gets a unique ID to identify its own messages
 */
const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/**
 * Configuration for ConnectionManager
 */
export interface ConnectionManagerConfig {
  /** License key for multi-tenant filtering */
  licenseKey: string;
  /** Enable real-time subscriptions (default: true) */
  enableRealtimeSync?: boolean;
  /** Enable cross-tab sync via BroadcastChannel (default: true) */
  enableCrossTabSync?: boolean;
}

/**
 * Callback type for table sync trigger
 */
export type SyncTableCallback = (tableName: string, forceFullSync: boolean) => Promise<void>;

/**
 * ConnectionManager - handles all connection/subscription concerns
 */
export class ConnectionManager {
  private config: ConnectionManagerConfig;
  private syncTableCallback: SyncTableCallback;

  /** Real-time subscription channels per table */
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  /** Cross-tab sync via BroadcastChannel */
  private broadcastChannel: BroadcastChannel | null = null;

  /** Issue #4 Fix: Track subscription setup promises */
  private subscriptionReadyPromises: Map<string, Promise<void>> = new Map();

  /** Network event handlers (bound for cleanup) */
  private handleOnline: () => Promise<void>;
  private handleOffline: () => void;

  constructor(
    config: ConnectionManagerConfig,
    syncTableCallback: SyncTableCallback
  ) {
    this.config = config;
    this.syncTableCallback = syncTableCallback;

    // Bind network event handlers
    this.handleOnline = this.onNetworkOnline.bind(this);
    this.handleOffline = this.onNetworkOffline.bind(this);
  }

  /**
   * Initialize all connections and listeners
   */
  initialize(): void {
    // Set up network event listeners
    window.addEventListener('replication:network-online', this.handleOnline);
    window.addEventListener('replication:network-offline', this.handleOffline);

    // Initialize cross-tab sync if enabled
    if (this.config.enableCrossTabSync !== false) {
      this.initCrossTabSync();
    }

    logger.log('✅ [ConnectionManager] Initialized');
  }

  /**
   * Subscribe to real-time changes for a table
   * Day 25-26 MEDIUM Fix: Instant cache invalidation via Supabase real-time
   * Issue #4 Fix: Return Promise to track subscription readiness
   */
  subscribeToTable(tableName: string): void {
    if (this.config.enableRealtimeSync === false) {
      return;
    }

    const readyPromise = this.createRealtimeSubscription(tableName);
    this.subscriptionReadyPromises.set(tableName, readyPromise);
  }

  /**
   * Unsubscribe from real-time changes for a table
   * Day 25-26 MEDIUM Fix: Clean up subscriptions
   */
  unsubscribeFromTable(tableName: string): void {
    const channel = this.realtimeChannels.get(tableName);
    if (channel) {
      supabase.removeChannel(channel);
      this.realtimeChannels.delete(tableName);
      this.subscriptionReadyPromises.delete(tableName);
      logger.log(`[ConnectionManager] Unsubscribed from real-time changes for ${tableName}`);
    }
  }

  /**
   * Wait for all subscription setups to complete
   * Issue #4 Fix: Prevents sync from starting before subscriptions are ready
   */
  async waitForSubscriptionsReady(): Promise<void> {
    if (this.subscriptionReadyPromises.size === 0) {
      logger.log('[ConnectionManager] No subscriptions to wait for (real-time sync may be disabled)');
      return;
    }

    logger.log(
      `[ConnectionManager] Waiting for ${this.subscriptionReadyPromises.size} subscription(s) to be ready...`
    );

    try {
      await Promise.all(this.subscriptionReadyPromises.values());
      logger.log('[ConnectionManager] All subscriptions ready');
    } catch (error) {
      logger.error('[ConnectionManager] Some subscriptions failed to initialize:', error);
      // Don't throw - app can work without real-time sync
    }
  }

  /**
   * Initialize cross-tab sync via BroadcastChannel
   * Day 25-26 MEDIUM Fix: Instant cache invalidation across browser tabs
   *
   * Issue #8 Fix: Prevent cross-tab sync cascade
   * - Ignore messages from our own tab
   * - Only sync when OTHER tabs make changes
   */
  private initCrossTabSync(): void {
    try {
      this.broadcastChannel = new BroadcastChannel('replication-sync');

      this.broadcastChannel.onmessage = (event) => {
        const { type, tableName, licenseKey, originTabId } = event.data;

        // Ignore our own messages
        if (originTabId === TAB_ID) {
          return;
        }

        // Only process messages for our license key
        if (licenseKey !== this.config.licenseKey) {
          return;
        }

        if (type === 'table-changed') {
          // Trigger incremental sync for this table
          this.syncTableCallback(tableName, false).catch((error) => {
            logger.error(`[ConnectionManager] Cross-tab sync failed for ${tableName}:`, error);
          });
        }
      };

      logger.log(`✅ [ConnectionManager] Cross-tab sync initialized (Tab ID: ${TAB_ID})`);
    } catch (error) {
      logger.warn('[ConnectionManager] BroadcastChannel not supported:', error);
    }
  }

  /**
   * Create real-time subscription for a table
   * Returns promise that resolves when subscription is ready
   */
  private createRealtimeSubscription(tableName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const channel = supabase
          .channel(`replication:${tableName}:${this.config.licenseKey}`)
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: tableName,
              // All replicated tables now have license_key column for efficient filtering
              filter: `license_key=eq.${this.config.licenseKey}`,
            },
            async (_payload) => {
              // Trigger incremental sync for this table and WAIT for it to complete
              // This ensures cache is updated before UI refreshes
              try {
                await this.syncTableCallback(tableName, false);
              } catch (error) {
                logger.error(`[ConnectionManager] Real-time sync failed for ${tableName}:`, error);
              }

              // Notify other tabs via BroadcastChannel (AFTER sync completes)
              this.broadcastTableChange(tableName);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.log(`✅ [ConnectionManager] Real-time subscription active for ${tableName}`);
              resolve(); // Issue #4 Fix: Resolve promise when subscribed
            } else if (status === 'CHANNEL_ERROR') {
              logger.error(`[ConnectionManager] Real-time subscription error for ${tableName}`);
              reject(new Error(`Subscription failed for ${tableName}`));
            }
          });

        this.realtimeChannels.set(tableName, channel);
      } catch (error) {
        logger.error(`[ConnectionManager] Failed to subscribe to real-time changes for ${tableName}:`, error);
        reject(error);
      }
    });
  }

  /**
   * Broadcast a table change to other tabs
   * Issue #8 Fix: Include originTabId to prevent cascade
   */
  broadcastTableChange(tableName: string): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'table-changed',
        tableName,
        licenseKey: this.config.licenseKey,
        originTabId: TAB_ID, // Track origin to prevent cascade
      });
    }
  }

  /**
   * Handle network online event
   */
  private async onNetworkOnline(): Promise<void> {
    logger.log('[ConnectionManager] Network online, triggering sync...');
    // Dispatch event for ReplicationManager to handle
    window.dispatchEvent(new CustomEvent('connection:network-online'));
  }

  /**
   * Handle network offline event
   */
  private onNetworkOffline(): void {
    logger.log('[ConnectionManager] Network offline');
    // Dispatch event for ReplicationManager to handle
    window.dispatchEvent(new CustomEvent('connection:network-offline'));
  }

  /**
   * Get the unique tab ID (for debugging)
   */
  getTabId(): string {
    return TAB_ID;
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Remove network event listeners
    window.removeEventListener('replication:network-online', this.handleOnline);
    window.removeEventListener('replication:network-offline', this.handleOffline);

    // Clean up real-time subscriptions
    for (const [tableName, channel] of this.realtimeChannels) {
      supabase.removeChannel(channel);
      logger.log(`[ConnectionManager] Unsubscribed from ${tableName}`);
    }
    this.realtimeChannels.clear();
    this.subscriptionReadyPromises.clear();

    // Clean up BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    logger.log('🗑️ [ConnectionManager] Destroyed');
  }
}
