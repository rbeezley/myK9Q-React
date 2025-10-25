/**
 * Offline Status Bar Component
 *
 * Shows connection status, pending sync count, and manual sync button.
 * Appears at the top of the page when offline or when there are pending changes.
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { syncManager } from '@/services/syncManager';
import { networkDetectionService } from '@/services/networkDetectionService';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';
import './shared-ui.css';

interface OfflineStatusBarProps {
  className?: string;
}

export function OfflineStatusBar({ className = '' }: OfflineStatusBarProps) {
  const [networkInfo, setNetworkInfo] = useState(networkDetectionService.getNetworkInfo());
  const [syncState, setSyncState] = useState(syncManager.getState());
  const { getPendingCount, getFailedCount } = useOfflineQueueStore();

  const pendingCount = getPendingCount();
  const failedCount = getFailedCount();

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribeNetwork = networkDetectionService.subscribe((info) => {
      setNetworkInfo(info);
    });

    // Subscribe to sync state changes
    const unsubscribeSync = syncManager.subscribe((state) => {
      setSyncState(state);
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  const handleManualSync = async () => {
    try {
      await syncManager.manualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  // Don't show if online with no pending changes
  if (networkInfo.isOnline && pendingCount === 0 && failedCount === 0 && syncState.status === 'synced') {
    return null;
  }

  const getStatusIcon = () => {
    if (!networkInfo.isOnline) {
      return <WifiOff className="status-icon offline" />;
    }

    if (syncState.status === 'error' || failedCount > 0) {
      return <AlertCircle className="status-icon error" />;
    }

    if (syncState.status === 'syncing') {
      return <RefreshCw className="status-icon syncing" />;
    }

    if (pendingCount > 0) {
      return <Wifi className="status-icon pending" />;
    }

    return <CheckCircle className="status-icon synced" />;
  };

  const getStatusText = () => {
    if (!networkInfo.isOnline) {
      if (pendingCount > 0) {
        return `Offline • ${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending`;
      }
      return 'Working offline';
    }

    if (syncState.status === 'syncing') {
      return 'Syncing changes...';
    }

    if (syncState.status === 'error' || failedCount > 0) {
      return `Sync error • ${failedCount} failed`;
    }

    if (pendingCount > 0) {
      return `${pendingCount} change${pendingCount !== 1 ? 's' : ''} to sync`;
    }

    if (syncState.status === 'paused') {
      return 'Sync paused';
    }

    return 'All changes synced';
  };

  const getConnectionTypeLabel = () => {
    if (!networkInfo.isOnline) {
      return null;
    }

    const { connectionType, effectiveType } = networkInfo;

    if (connectionType === 'cellular') {
      return (
        <span className="connection-type cellular">
          {effectiveType.toUpperCase()}
        </span>
      );
    }

    if (connectionType === 'wifi') {
      return (
        <span className="connection-type wifi">
          WiFi
        </span>
      );
    }

    return null;
  };

  const showManualSyncButton = networkInfo.isOnline && (pendingCount > 0 || failedCount > 0) && syncState.status !== 'syncing';

  return (
    <div className={`offline-status-bar ${className} ${syncState.status}`}>
      <div className="status-content">
        <div className="status-left">
          {getStatusIcon()}
          <span className="status-text">{getStatusText()}</span>
          {getConnectionTypeLabel()}
        </div>

        <div className="status-right">
          {syncState.lastSyncTime && (
            <span className="last-sync">
              Last sync: {formatRelativeTime(syncState.lastSyncTime)}
            </span>
          )}

          {showManualSyncButton && (
            <button
              className="manual-sync-btn"
              onClick={handleManualSync}
              title="Sync now"
            >
              <RefreshCw size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              Sync
            </button>
          )}
        </div>
      </div>

      {syncState.error && (
        <div className="status-error">
          <AlertCircle size={14}  style={{ width: '14px', height: '14px', flexShrink: 0 }} />
          {syncState.error}
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) {
    return 'just now';
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
