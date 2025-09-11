import { useOfflineQueueStore } from '../stores/offlineQueueStore';
import { submitBatchScores } from './entryService';

/**
 * Service for managing offline sync operations
 */

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  
  /**
   * Initialize sync service and monitor online status
   */
  initialize() {
    // Monitor online status
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Initial status check
    this.updateOnlineStatus();
  }
  
  /**
   * Cleanup sync service
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopPeriodicSync();
  }
  
  /**
   * Handle online event
   */
  private handleOnline = () => {
    // Connection restored - starting sync
    useOfflineQueueStore.getState().setOnlineStatus(true);
    this.syncQueue();
  };
  
  /**
   * Handle offline event
   */
  private handleOffline = () => {
    // Connection lost - pausing sync
    useOfflineQueueStore.getState().setOnlineStatus(false);
  };
  
  /**
   * Update online status
   */
  private updateOnlineStatus() {
    const isOnline = navigator.onLine;
    useOfflineQueueStore.getState().setOnlineStatus(isOnline);
  }
  
  /**
   * Start periodic sync (every 30 seconds)
   */
  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncQueue();
      }
    }, 30000);
  }
  
  /**
   * Stop periodic sync
   */
  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  /**
   * Sync offline queue with server
   */
  async syncQueue() {
    if (this.isSyncing) {
      return;
    }
    
    const store = useOfflineQueueStore.getState();
    const pendingCount = store.getPendingCount();
    
    if (pendingCount === 0) {
      return;
    }
    
    this.isSyncing = true;
    store.startSync();
    
    try {
      // Get all pending items
      const pendingItems = store.queue.filter(item => item.status === 'pending');
      
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        return;
      }
      
      // Mark items as syncing
      pendingItems.forEach(item => {
        store.markAsSyncing(item.id);
      });
      
      // Submit batch
      const { successful, failed } = await submitBatchScores(pendingItems);
      
      // Update sync status
      store.syncComplete(successful, failed);
      
      
      // If there are failed items that haven't exceeded retry limit, retry them
      const retryableItems = store.queue.filter(
        item => item.status === 'failed' && item.retryCount < item.maxRetries
      );
      
      if (retryableItems.length > 0) {
        setTimeout(() => this.syncQueue(), 5000); // Retry after 5 seconds
      }
      
    } catch (error) {
      console.error('Sync error:', error);
      
      // Mark all syncing items as failed
      const syncingItems = store.queue.filter(item => item.status === 'syncing');
      syncingItems.forEach(item => {
        store.markAsFailed(item.id, error instanceof Error ? error.message : 'Unknown error');
      });
      
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Force sync regardless of online status
   */
  async forceSync() {
    await this.syncQueue();
  }
  
  /**
   * Get sync status
   */
  getSyncStatus() {
    const store = useOfflineQueueStore.getState();
    return {
      isOnline: store.isOnline,
      isSyncing: store.isSyncing || this.isSyncing,
      pendingCount: store.getPendingCount(),
      failedCount: store.getFailedCount(),
      lastSyncAttempt: store.lastSyncAttempt
    };
  }
  
  /**
   * Retry all failed items
   */
  retryFailed() {
    const store = useOfflineQueueStore.getState();
    store.retryFailed();
    this.syncQueue();
  }
  
  /**
   * Clear completed items from queue
   */
  clearCompleted() {
    useOfflineQueueStore.getState().clearCompleted();
  }
}

// Create singleton instance
export const syncService = new SyncService();

// Export hook for React components
export function useSyncStatus() {
  const { isOnline, isSyncing, queue, failedItems } = useOfflineQueueStore();
  
  return {
    isOnline,
    isSyncing,
    pendingCount: queue.filter(item => item.status === 'pending').length,
    failedCount: failedItems.length,
    totalQueued: queue.length
  };
}