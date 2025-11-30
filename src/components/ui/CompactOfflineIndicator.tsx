/**
 * Compact Offline Status Indicator
 *
 * A small, non-intrusive icon that displays next to the hamburger menu
 * showing offline/sync status without blocking UI elements.
 *
 * States:
 * - Online (no pending): Green checkmark
 * - Offline: Orange wifi-off icon with pending count badge
 * - Pending (online): Blue cloud icon with pending count badge
 * - Syncing: Blue cloud-upload icon (pulsing) with count badge
 * - Failed: Handled by the full OfflineIndicator banner (not shown here)
 */

import { useEffect, useState } from 'react';
import { WifiOff, Cloud, CloudUpload, CheckCircle } from 'lucide-react';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';
import './shared-ui.css';

type CompactIndicatorMode = 'online' | 'offline' | 'pending' | 'syncing' | 'failed';

interface CompactOfflineIndicatorProps {
  /** Optional additional className */
  className?: string;
}

/**
 * Determine which compact indicator mode to display
 */
function determineCompactMode(
  isOnline: boolean,
  pendingCount: number,
  syncingCount: number,
  failedCount: number,
  isSyncing: boolean
): CompactIndicatorMode {
  // Failed mode is handled by the full banner, not the compact indicator
  if (failedCount > 0) return 'failed';

  // Offline mode
  if (!isOnline) return 'offline';

  // Syncing mode
  if (isSyncing || syncingCount > 0) return 'syncing';

  // Online with pending
  if (pendingCount > 0) return 'pending';

  // Online, all synced
  return 'online';
}

/**
 * Get tooltip text for current mode
 */
function getTooltipText(
  mode: CompactIndicatorMode,
  pendingCount: number,
  syncingCount: number
): string {
  switch (mode) {
    case 'online':
      return 'Online - All scores synced';
    case 'offline':
      return pendingCount > 0
        ? `Offline - ${pendingCount} score${pendingCount > 1 ? 's' : ''} queued`
        : 'Offline - Changes will sync when connected';
    case 'pending':
      return `${pendingCount} score${pendingCount > 1 ? 's' : ''} pending sync`;
    case 'syncing':
      return `Syncing ${syncingCount} score${syncingCount > 1 ? 's' : ''}...`;
    case 'failed':
      return 'Sync failed - See banner above';
    default:
      return '';
  }
}

export function CompactOfflineIndicator({ className = '' }: CompactOfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { queue, isSyncing, failedItems } = useOfflineQueueStore();

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const syncingCount = queue.filter(q => q.status === 'syncing').length;
  const failedCount = failedItems.length;

  // Network status effect
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const mode = determineCompactMode(isOnline, pendingCount, syncingCount, failedCount, isSyncing);
  const tooltip = getTooltipText(mode, pendingCount, syncingCount);

  // Don't render anything for failed mode - the full banner handles that
  if (mode === 'failed') {
    return null;
  }

  // Calculate badge count based on mode
  const badgeCount = mode === 'syncing' ? syncingCount : pendingCount;
  const showBadge = badgeCount > 0 && mode !== 'online';

  return (
    <div
      className={`compact-offline-indicator compact-offline-${mode} ${className}`}
      title={tooltip}
      role="status"
      aria-label={tooltip}
    >
      {mode === 'online' && (
        <CheckCircle
          className="compact-offline-icon"
          size={18}
          strokeWidth={2}
        />
      )}

      {mode === 'offline' && (
        <WifiOff
          className="compact-offline-icon"
          size={18}
          strokeWidth={2}
        />
      )}

      {mode === 'pending' && (
        <Cloud
          className="compact-offline-icon"
          size={18}
          strokeWidth={2}
        />
      )}

      {mode === 'syncing' && (
        <CloudUpload
          className="compact-offline-icon compact-offline-syncing"
          size={18}
          strokeWidth={2}
        />
      )}

      {showBadge && (
        <span className="compact-offline-badge">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </div>
  );
}

export default CompactOfflineIndicator;
