/**
 * useSafeLogout Hook
 *
 * Provides a safe logout mechanism that prevents data loss by checking
 * for pending unsynced scores before allowing logout.
 *
 * **Why This Matters:**
 * When judging offline, scores are queued in IndexedDB until connectivity
 * is restored. If a user logs out before syncing, ALL pending scores are
 * permanently lost (logout clears the cache). This hook prevents that scenario.
 *
 * **Behavior:**
 * - If no pending scores → logout proceeds normally
 * - If pending scores exist → shows warning dialog, blocks logout
 * - Dialog shows sync status and instructions for safely syncing
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';

interface UseSafeLogoutResult {
  /**
   * Attempts a safe logout. If pending scores exist, shows warning dialog.
   * If no pending scores, logs out immediately.
   */
  safeLogout: () => void;

  /**
   * Forces logout regardless of pending scores.
   * Use with extreme caution - will lose all unsynced data!
   */
  forceLogout: () => void;

  /**
   * Whether the warning dialog should be shown
   */
  showWarningDialog: boolean;

  /**
   * Close the warning dialog without logging out
   */
  closeWarningDialog: () => void;

  /**
   * Number of scores pending sync
   */
  pendingCount: number;

  /**
   * Whether the device is currently online
   */
  isOnline: boolean;

  /**
   * Whether sync is currently in progress
   */
  isSyncing: boolean;
}

export function useSafeLogout(): UseSafeLogoutResult {
  const { logout } = useAuth();
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Get offline queue state
  const pendingCount = useOfflineQueueStore((state) => state.getPendingCount());
  const isOnline = useOfflineQueueStore((state) => state.isOnline);
  const isSyncing = useOfflineQueueStore((state) => state.isSyncing);

  /**
   * Attempts safe logout - checks for pending scores first
   */
  const safeLogout = useCallback(() => {
    // Get fresh count at logout time (not stale from render)
    const currentPendingCount = useOfflineQueueStore.getState().getPendingCount();

    if (currentPendingCount > 0) {
      // Block logout and show warning
      console.warn(
        `[SAFE_LOGOUT] Blocking logout - ${currentPendingCount} pending score(s) would be lost`
      );
      setShowWarningDialog(true);
    } else {
      // Safe to logout - no pending scores
      logout();
    }
  }, [logout]);

  /**
   * Forces logout regardless of pending scores
   * This is intentionally not exposed in the UI by default,
   * but available for emergency use cases
   */
  const forceLogout = useCallback(() => {
    const currentPendingCount = useOfflineQueueStore.getState().getPendingCount();
    if (currentPendingCount > 0) {
      console.error(
        `[SAFE_LOGOUT] ⚠️ FORCE LOGOUT - ${currentPendingCount} pending score(s) WILL BE LOST!`
      );
    }
    setShowWarningDialog(false);
    logout();
  }, [logout]);

  /**
   * Closes the warning dialog without logging out
   */
  const closeWarningDialog = useCallback(() => {
    setShowWarningDialog(false);
  }, []);

  return {
    safeLogout,
    forceLogout,
    showWarningDialog,
    closeWarningDialog,
    pendingCount,
    isOnline,
    isSyncing,
  };
}
