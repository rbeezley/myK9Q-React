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
 * - If pending scores exist → shows warning dialog, blocks logout
 * - If offline (no pending scores) → shows offline warning (can't re-login without WiFi)
 * - If online with no pending scores → logout proceeds normally
 * - Dialog shows sync status and instructions for safely syncing
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';

/** Type of warning being shown */
export type LogoutWarningType = 'pending_scores' | 'offline' | null;

interface UseSafeLogoutResult {
  /**
   * Attempts a safe logout. If pending scores exist, shows warning dialog.
   * If offline, shows offline warning. If online with no pending scores, logs out immediately.
   */
  safeLogout: () => void;

  /**
   * Forces logout regardless of pending scores or offline status.
   * Use with extreme caution - will lose all unsynced data!
   */
  forceLogout: () => void;

  /**
   * Whether the warning dialog should be shown
   */
  showWarningDialog: boolean;

  /**
   * The type of warning being shown (for UI to display appropriate message)
   */
  warningType: LogoutWarningType;

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
  const [warningType, setWarningType] = useState<LogoutWarningType>(null);

  // Get offline queue state
  const pendingCount = useOfflineQueueStore((state) => state.getPendingCount());
  const isOnline = useOfflineQueueStore((state) => state.isOnline);
  const isSyncing = useOfflineQueueStore((state) => state.isSyncing);

  /**
   * Attempts safe logout - checks for pending scores and offline status
   *
   * Priority order:
   * 1. Pending scores → BLOCK (data would be lost)
   * 2. Offline (no pending) → WARN (can't re-login without connectivity)
   * 3. Online (no pending) → ALLOW immediate logout
   */
  const safeLogout = useCallback(() => {
    // Get fresh state at logout time (not stale from render)
    const currentPendingCount = useOfflineQueueStore.getState().getPendingCount();
    const currentIsOnline = useOfflineQueueStore.getState().isOnline;

    if (currentPendingCount > 0) {
      // BLOCK: Pending scores would be lost
      console.warn(
        `[SAFE_LOGOUT] Blocking logout - ${currentPendingCount} pending score(s) would be lost`
      );
      setWarningType('pending_scores');
      setShowWarningDialog(true);
    } else if (!currentIsOnline) {
      // WARN: User is offline, can't re-login without WiFi
      console.warn(
        '[SAFE_LOGOUT] Warning: User is offline - logout will prevent re-login until connectivity restored'
      );
      setWarningType('offline');
      setShowWarningDialog(true);
    } else {
      // ALLOW: Online with no pending scores - safe to logout
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
    setWarningType(null);
  }, []);

  return {
    safeLogout,
    forceLogout,
    showWarningDialog,
    warningType,
    closeWarningDialog,
    pendingCount,
    isOnline,
    isSyncing,
  };
}
