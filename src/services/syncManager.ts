/**
 * Sync Manager Service
 *
 * Centralized service for managing all real-time synchronization:
 * - Controls real-time subscription lifecycle
 * - Manages sync frequency and batching
 * - Handles offline queue processing
 * - Provides conflict detection and resolution
 * - Respects user settings for sync behavior
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';
import { submitScore } from './entryService';

export type SyncStatus = 'synced' | 'syncing' | 'paused' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  pendingChanges: number;
  error: string | null;
}

interface ActiveSubscription {
  channel: RealtimeChannel;
  key: string;
  callback: (payload: any) => void;
}

class SyncManager {
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private state: SyncState = {
    status: 'synced',
    lastSyncTime: null,
    pendingChanges: 0,
    error: null,
  };
  private listeners: Set<(state: SyncState) => void> = new Set();

  constructor() {
    // Listen for network status changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Update sync state
   */
  private updateState(updates: Partial<SyncState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  /**
   * Subscribe to real-time updates for a resource
   * Real-time sync is always enabled for multi-user trials
   */
  subscribeToUpdates(
    key: string,
    table: string,
    filter: string,
    callback: (payload: any) => void
  ): () => void {
    // Check if already subscribed
    if (this.subscriptions.has(key)) {
      console.warn(`Already subscribed to ${key}, unsubscribing old subscription`);
      this.unsubscribe(key);
    }

    console.log(`🔌 Creating subscription: ${key}`);

    const channel = supabase
      .channel(key)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          console.log(`🔄 Real-time update received for ${key}:`, payload.eventType);
          callback(payload);
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`❌ Subscription error for ${key}:`, err);
          this.updateState({ status: 'error', error: err.message });
        } else if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to ${key}`);
        }
      });

    this.subscriptions.set(key, { channel, key, callback });

    // Return unsubscribe function
    return () => this.unsubscribe(key);
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      console.log(`🔌 Unsubscribing from ${key}`);
      subscription.channel.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll() {
    console.log(`🔌 Unsubscribing from all ${this.subscriptions.size} subscriptions`);
    this.subscriptions.forEach((sub) => {
      sub.channel.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Pause all real-time subscriptions
   */
  pauseSync() {
    console.log('⏸️ Pausing real-time sync');
    this.unsubscribeAll();
    this.updateState({ status: 'paused' });

    // Stop batch sync interval if running
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Resume real-time subscriptions
   * Note: Subscriptions need to be re-established by calling components
   */
  resumeSync() {
    console.log('▶️ Resuming real-time sync');
    this.updateState({ status: 'synced' });

    // Start batch sync if configured
    this.startBatchSync();
  }

  /**
   * Start batch sync - now a no-op since real-time sync is always enabled
   */
  private startBatchSync() {
    // Clear existing interval if any
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Real-time sync is always enabled - no batch sync needed
  }

  /**
   * Add a sync operation to the queue
   */
  queueSync(operation: () => Promise<void>) {
    this.syncQueue.push(operation);
    this.updateState({ pendingChanges: this.syncQueue.length });

    // Real-time sync is always enabled - process right away
    this.processSyncQueue();
  }

  /**
   * Process queued sync operations
   */
  private async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.updateState({ status: 'syncing' });

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    console.log(`🔄 Processing ${operations.length} queued sync operations`);

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('❌ Sync operation failed:', error);
        this.updateState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Sync failed'
        });
      }
    }

    this.isSyncing = false;
    this.updateState({
      status: 'synced',
      lastSyncTime: new Date(),
      pendingChanges: this.syncQueue.length
    });
  }

  /**
   * Manually trigger sync (for manual sync mode)
   */
  async manualSync(): Promise<void> {
    console.log('🔄 Manual sync triggered');
    await this.processOfflineQueue();
    await this.processSyncQueue();
  }

  /**
   * Process offline queue
   */
  private async processOfflineQueue() {
    const offlineQueue = useOfflineQueueStore.getState();
    const pendingItems = offlineQueue.queue.filter(item => item.status === 'pending');

    if (pendingItems.length === 0) {
      return;
    }

    console.log(`🔄 Processing ${pendingItems.length} offline queue items`);

    offlineQueue.startSync();

    const successIds: string[] = [];
    const failedIds: string[] = [];

    for (const item of pendingItems) {
      offlineQueue.markAsSyncing(item.id);

      try {
        await submitScore(item.entryId, item.scoreData);
        successIds.push(item.id);
        await offlineQueue.markAsCompleted(item.id);
      } catch (error) {
        console.error(`❌ Failed to sync item ${item.id}:`, error);
        failedIds.push(item.id);
        offlineQueue.markAsFailed(
          item.id,
          error instanceof Error ? error.message : 'Sync failed'
        );
      }
    }

    offlineQueue.syncComplete(successIds, failedIds);

    console.log(`✅ Offline queue sync complete: ${successIds.length} success, ${failedIds.length} failed`);
  }

  /**
   * Handle coming online
   */
  private async handleOnline() {
    console.log('🌐 Network came online');
    this.updateState({ status: 'syncing' });

    // Process offline queue
    await this.processOfflineQueue();

    // Resume sync
    this.resumeSync();
  }

  /**
   * Handle going offline
   */
  private handleOffline() {
    console.log('📴 Network went offline');
    this.updateState({ status: 'offline' });

    // Pause sync
    this.pauseSync();
  }

  /**
   * Check if WiFi-only sync is enabled and we're on cellular
   * Note: WiFi-only setting removed - warnings handled by useConnectionWarning hook
   */
  isWiFiOnlyAndCellular(): boolean {
    // Always return false - WiFi warnings are now handled by useConnectionWarning hook
    return false;
  }

  /**
   * Check if sync should be blocked
   */
  shouldBlockSync(): boolean {
    // Block if offline
    if (!navigator.onLine) {
      return true;
    }

    // Block if WiFi-only and on cellular
    if (this.isWiFiOnlyAndCellular()) {
      console.log('📱 Blocking sync: WiFi-only mode and on cellular');
      return true;
    }

    // Block if sync is paused
    if (this.state.status === 'paused') {
      return true;
    }

    return false;
  }

  /**
   * Get retry delay with exponential backoff
   */
  getRetryDelay(attempt: number, baseDelay = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attempt), 30000);
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
