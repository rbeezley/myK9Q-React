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

import { Wifi, WifiOff, Cloud, CloudUpload } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import './shared-ui.css';

interface CompactOfflineIndicatorProps {
  /** Optional additional className */
  className?: string;
}

export function CompactOfflineIndicator({ className = '' }: CompactOfflineIndicatorProps) {
  const { mode, counts, tooltipText } = useOfflineStatus();

  // Don't render anything for failed mode - the full banner handles that
  if (mode === 'failed') {
    return null;
  }

  // Calculate badge count based on mode
  const badgeCount = mode === 'syncing' ? counts.syncing : counts.pending;
  const showBadge = badgeCount > 0 && mode !== 'online';

  return (
    <div
      className={`compact-offline-indicator compact-offline-${mode} ${className}`}
      title={tooltipText}
      role="status"
      aria-label={tooltipText}
    >
      {mode === 'online' && (
        <Wifi
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
