/**
 * Sync Status Store
 *
 * Tracks replication sync status for UI display:
 * - Last successful sync timestamp
 * - Sync failures and error messages
 * - Data staleness warnings
 *
 * Listens to replication events and updates state accordingly.
 */

import { create } from 'zustand';

export interface SyncStatusState {
  /** Last successful sync timestamp */
  lastSyncAt: number | null;
  /** Whether sync is currently in progress */
  isSyncing: boolean;
  /** Last sync failure (null if last sync succeeded) */
  lastFailure: {
    timestamp: number;
    message: string;
    failedTables: string[];
  } | null;
  /** Whether user has dismissed the failure banner */
  failureDismissed: boolean;
  /** Staleness threshold in hours (default 2 hours) */
  stalenessThresholdHours: number;
}

export interface SyncStatusActions {
  /** Record a successful sync */
  recordSyncSuccess: (timestamp: number) => void;
  /** Record a sync failure */
  recordSyncFailure: (message: string, failedTables: string[]) => void;
  /** Dismiss the failure banner */
  dismissFailure: () => void;
  /** Check if data is stale (older than threshold) */
  isDataStale: () => boolean;
  /** Get formatted "last synced" string */
  getLastSyncedText: () => string;
  /** Set syncing state */
  setSyncing: (isSyncing: boolean) => void;
}

export type SyncStatusStore = SyncStatusState & SyncStatusActions;

export const useSyncStatusStore = create<SyncStatusStore>((set, get) => ({
  // Initial state
  lastSyncAt: null,
  isSyncing: false,
  lastFailure: null,
  failureDismissed: false,
  stalenessThresholdHours: 2,

  // Actions
  recordSyncSuccess: (timestamp: number) => {
    set({
      lastSyncAt: timestamp,
      lastFailure: null,
      failureDismissed: false,
    });
  },

  recordSyncFailure: (message: string, failedTables: string[]) => {
    set({
      lastFailure: {
        timestamp: Date.now(),
        message,
        failedTables,
      },
      failureDismissed: false,
    });
  },

  dismissFailure: () => {
    set({ failureDismissed: true });
  },

  setSyncing: (isSyncing: boolean) => {
    set({ isSyncing });
  },

  isDataStale: () => {
    const { lastSyncAt, stalenessThresholdHours } = get();
    if (!lastSyncAt) return true; // Never synced = stale
    const thresholdMs = stalenessThresholdHours * 60 * 60 * 1000;
    return Date.now() - lastSyncAt > thresholdMs;
  },

  getLastSyncedText: () => {
    const { lastSyncAt } = get();
    if (!lastSyncAt) return 'Never synced';

    const now = Date.now();
    const diffMs = now - lastSyncAt;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(lastSyncAt).toLocaleDateString();
  },
}));

// Track if listeners have been initialized (prevents duplicate event handlers)
let listenersInitialized = false;

/**
 * Initialize sync status listeners
 * Call this once at app startup to connect to replication events
 * Safe to call multiple times - will only register listeners once
 */
export function initSyncStatusListeners(): void {
  // Prevent duplicate event listener registration
  if (listenersInitialized) {
    return;
  }
  listenersInitialized = true;

  // Listen for sync success
  window.addEventListener('replication:sync-success', ((event: CustomEvent) => {
    const { timestamp } = event.detail;
    useSyncStatusStore.getState().recordSyncSuccess(timestamp);
  }) as EventListener);

  // Listen for sync failure
  window.addEventListener('replication:sync-failed', ((event: CustomEvent) => {
    const { message, failedTables } = event.detail;
    useSyncStatusStore.getState().recordSyncFailure(message, failedTables);
  }) as EventListener);

  // Listen for sync queued (optional - could show "syncing" state)
  window.addEventListener('replication:sync-queued', (() => {
    useSyncStatusStore.getState().setSyncing(true);
  }) as EventListener);
}
