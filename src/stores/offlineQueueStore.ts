import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface QueuedScore {
  id: string; // UUID for queue item
  entryId: number;
  armband: number;
  classId: number;
  className: string;
  scoreData: {
    resultText: string;
    searchTime?: string;
    faultCount?: number;
    points?: number;
    nonQualifyingReason?: string;
    areas?: { [key: string]: string };
    healthCheckPassed?: boolean;
    mph?: number;
    score?: number;
    deductions?: number;
    // Nationals-specific fields
    correctCount?: number;
    incorrectCount?: number;
    finishCallErrors?: number;
    // Area time fields for AKC Scent Work
    areaTimes?: string[];
    element?: string;
    level?: string;
  };
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

interface OfflineQueueState {
  queue: QueuedScore[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAttempt: string | null;
  failedItems: QueuedScore[];
  
  // Actions
  addToQueue: (score: Omit<QueuedScore, 'id' | 'timestamp' | 'retryCount' | 'maxRetries' | 'status'>) => void;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, updates: Partial<QueuedScore>) => void;
  
  // Sync Actions
  setOnlineStatus: (isOnline: boolean) => void;
  startSync: () => void;
  syncComplete: (successIds: string[], failedIds: string[]) => void;
  retryFailed: () => void;
  clearCompleted: () => void;
  
  // Utilities
  getPendingCount: () => number;
  getFailedCount: () => number;
  getNextItemToSync: () => QueuedScore | null;
  markAsSyncing: (id: string) => void;
  markAsFailed: (id: string, error: string) => void;
  markAsCompleted: (id: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  devtools(
    persist(
      (set, get) => ({
        queue: [],
        isOnline: true,
        isSyncing: false,
        lastSyncAttempt: null,
        failedItems: [],

        addToQueue: (score) => {
          const queueItem: QueuedScore = {
            ...score,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            retryCount: 0,
            maxRetries: 3,
            status: 'pending'
          };

          set((state) => ({
            queue: [...state.queue, queueItem]
          }));

          // If online, trigger sync immediately
          if (get().isOnline && !get().isSyncing) {
            setTimeout(() => get().startSync(), 100);
          }
        },

        removeFromQueue: (id) => {
          set((state) => ({
            queue: state.queue.filter(item => item.id !== id),
            failedItems: state.failedItems.filter(item => item.id !== id)
          }));
        },

        updateQueueItem: (id, updates) => {
          set((state) => ({
            queue: state.queue.map(item =>
              item.id === id ? { ...item, ...updates } : item
            )
          }));
        },

        setOnlineStatus: (isOnline) => {
          set({ isOnline });
          
          // Start sync when coming online
          if (isOnline && get().queue.some(item => item.status === 'pending')) {
            get().startSync();
          }
        },

        startSync: () => {
          const { isOnline, isSyncing, queue } = get();
          
          if (!isOnline || isSyncing || !queue.some(item => item.status === 'pending')) {
            return;
          }

          set({
            isSyncing: true,
            lastSyncAttempt: new Date().toISOString()
          });
        },

        syncComplete: (successIds, failedIds) => {
          set((state) => {
            const updatedQueue = state.queue.map(item => {
              if (successIds.includes(item.id)) {
                return { ...item, status: 'completed' as const };
              }
              if (failedIds.includes(item.id)) {
                return {
                  ...item,
                  status: 'failed' as const,
                  retryCount: item.retryCount + 1
                };
              }
              return item;
            });

            const failedItems = updatedQueue.filter(
              item => item.status === 'failed' && item.retryCount >= item.maxRetries
            );

            return {
              queue: updatedQueue.filter(
                item => item.status !== 'completed' && !failedItems.includes(item)
              ),
              failedItems: [...state.failedItems, ...failedItems],
              isSyncing: false
            };
          });
        },

        retryFailed: () => {
          set((state) => {
            const itemsToRetry = state.failedItems.map(item => ({
              ...item,
              status: 'pending' as const,
              retryCount: 0
            }));

            return {
              queue: [...state.queue, ...itemsToRetry],
              failedItems: []
            };
          });

          // Trigger sync
          if (get().isOnline) {
            get().startSync();
          }
        },

        clearCompleted: () => {
          set((state) => ({
            queue: state.queue.filter(item => item.status !== 'completed')
          }));
        },

        getPendingCount: () => {
          return get().queue.filter(item => item.status === 'pending').length;
        },

        getFailedCount: () => {
          return get().failedItems.length;
        },

        getNextItemToSync: () => {
          const pending = get().queue.find(item => item.status === 'pending');
          return pending || null;
        },

        markAsSyncing: (id) => {
          get().updateQueueItem(id, { status: 'syncing' });
        },

        markAsFailed: (id, error) => {
          set((state) => {
            const item = state.queue.find(q => q.id === id);
            if (!item) return state;

            const updatedItem = {
              ...item,
              status: 'failed' as const,
              lastError: error,
              retryCount: item.retryCount + 1
            };

            if (updatedItem.retryCount >= updatedItem.maxRetries) {
              return {
                queue: state.queue.filter(q => q.id !== id),
                failedItems: [...state.failedItems, updatedItem]
              };
            }

            return {
              queue: state.queue.map(q =>
                q.id === id ? updatedItem : q
              )
            };
          });
        },

        markAsCompleted: (id) => {
          set((state) => ({
            queue: state.queue.filter(item => item.id !== id)
          }));
        }
      }),
      {
        name: 'offline-queue-storage',
        partialize: (state) => ({
          queue: state.queue,
          failedItems: state.failedItems
        })
      }
    )
  )
);