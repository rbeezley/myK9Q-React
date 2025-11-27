/**
 * Offline Indicator Component
 *
 * Shows a persistent banner when the app is offline, with sync status
 * and number of pending mutations. Provides visual feedback for offline
 * operation and automatic sync progress.
 *
 * Refactored as part of DEBT-008 to reduce complexity.
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, CloudOff, CloudUpload, AlertCircle, SignalLow, X } from 'lucide-react';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';
import { networkDetectionService, type NetworkInfo } from '@/services/networkDetectionService';
import './shared-ui.css';

// ========================================
// TYPES
// ========================================

type ConnectionQuality = 'slow' | 'medium' | 'fast' | null;

type IndicatorMode =
  | 'slow-connection'
  | 'offline'
  | 'syncing'
  | 'failed'
  | 'pending'
  | 'hidden';


// ========================================
// HELPER FUNCTIONS (extracted for reduced complexity)
// ========================================

/**
 * Determine connection quality from network info
 */
function determineConnectionQuality(networkInfo: NetworkInfo): ConnectionQuality {
  const isSlowConnection =
    networkInfo.effectiveType === 'slow-2g' ||
    networkInfo.effectiveType === '2g' ||
    (networkInfo.downlink !== undefined && networkInfo.downlink < 1);

  if (isSlowConnection) return 'slow';
  if (networkInfo.effectiveType === '3g') return 'medium';
  if (
    networkInfo.effectiveType === '4g' ||
    networkInfo.connectionType === 'wifi' ||
    networkInfo.connectionType === 'ethernet'
  ) {
    return 'fast';
  }
  return null;
}

/**
 * Determine connection type display string from network info
 */
function determineConnectionType(networkInfo: NetworkInfo): string {
  switch (networkInfo.connectionType) {
    case 'wifi':
      return 'WiFi';
    case 'cellular':
      return `Cellular ${networkInfo.effectiveType?.toUpperCase() || ''}`;
    case 'ethernet':
      return 'Ethernet';
    default:
      return '';
  }
}

/**
 * Determine which indicator mode to display
 */
function determineIndicatorMode(
  isOnline: boolean,
  pendingCount: number,
  syncingCount: number,
  failedCount: number,
  connectionQuality: ConnectionQuality,
  slowConnectionDismissed: boolean,
  isSyncing: boolean
): IndicatorMode {
  // Slow connection warning (online, no sync issues, not dismissed)
  if (
    isOnline &&
    connectionQuality === 'slow' &&
    pendingCount === 0 &&
    syncingCount === 0 &&
    failedCount === 0 &&
    !slowConnectionDismissed
  ) {
    return 'slow-connection';
  }

  // Hidden (online, no pending items)
  if (isOnline && pendingCount === 0 && syncingCount === 0 && failedCount === 0) {
    return 'hidden';
  }

  // Offline mode
  if (!isOnline) return 'offline';

  // Syncing mode
  if (isSyncing || syncingCount > 0) return 'syncing';

  // Failed mode
  if (failedCount > 0) return 'failed';

  // Online with pending
  if (pendingCount > 0) return 'pending';

  return 'hidden';
}

/**
 * Format count text (singular/plural)
 */
function formatScoreCount(count: number): string {
  return `${count} ${count === 1 ? 'score' : 'scores'}`;
}

// ========================================
// RENDER FUNCTIONS (one per mode)
// ========================================

function renderSlowConnectionIndicator(
  connectionType: string,
  onDismiss: () => void
) {
  return (
    <div className="offline-indicator slow-connection-mode">
      <div className="offline-indicator-content">
        <SignalLow className="offline-icon" size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
        <div className="offline-text">
          <strong>Slow Connection</strong>
          <span className="offline-count">
            {connectionType} - App may be slow
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="offline-dismiss-btn"
          aria-label="Dismiss slow connection warning"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          <X size={20} style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    </div>
  );
}

function renderOfflineIndicator(pendingCount: number) {
  return (
    <div className="offline-indicator offline-mode">
      <div className="offline-indicator-content">
        <WifiOff className="offline-icon" size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
        <div className="offline-text">
          <strong>Working Offline</strong>
          {pendingCount > 0 && (
            <span className="offline-count">
              {formatScoreCount(pendingCount)} queued
            </span>
          )}
        </div>
        <CloudOff className="offline-cloud-icon" size={16} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
      </div>
    </div>
  );
}

function renderSyncingIndicator(syncingCount: number, pendingCount: number) {
  const totalCount = pendingCount + syncingCount;
  return (
    <div className="offline-indicator syncing-mode">
      <div className="offline-indicator-content">
        <CloudUpload className="offline-icon syncing-icon" size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
        <div className="offline-text">
          <strong>Syncing...</strong>
          <span className="offline-count">
            {syncingCount} of {formatScoreCount(totalCount)}
          </span>
        </div>
      </div>
    </div>
  );
}

function renderFailedIndicator(
  failedCount: number,
  connectionQuality: ConnectionQuality,
  connectionType: string
) {
  const showConnectionHint = connectionQuality === 'slow' && connectionType;
  return (
    <div className="offline-indicator failed-mode">
      <div className="offline-indicator-content">
        <AlertCircle className="offline-icon" size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
        <div className="offline-text">
          <strong>Sync Failed</strong>
          <span className="offline-count">
            {formatScoreCount(failedCount)} failed to sync
            {showConnectionHint && ` • ${connectionType} may be too slow`}
          </span>
        </div>
      </div>
    </div>
  );
}

function renderPendingIndicator(pendingCount: number) {
  return (
    <div className="offline-indicator pending-mode">
      <div className="offline-indicator-content">
        <Wifi className="offline-icon" size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
        <div className="offline-text">
          <strong>Online</strong>
          <span className="offline-count">
            {formatScoreCount(pendingCount)} pending sync
          </span>
        </div>
      </div>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(null);
  const [connectionType, setConnectionType] = useState('');
  const [slowConnectionDismissed, setSlowConnectionDismissed] = useState(false);

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

    // Subscribe to network changes
    const unsubscribe = networkDetectionService.subscribe((networkInfo) => {
      setConnectionQuality(determineConnectionQuality(networkInfo));
      setConnectionType(determineConnectionType(networkInfo));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Auto-dismiss slow connection warning after 5 seconds
  useEffect(() => {
    if (connectionQuality === 'slow' && !slowConnectionDismissed) {
      const timer = setTimeout(() => setSlowConnectionDismissed(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [connectionQuality, slowConnectionDismissed]);

  // Determine which mode to render
  const mode = determineIndicatorMode(
    isOnline,
    pendingCount,
    syncingCount,
    failedCount,
    connectionQuality,
    slowConnectionDismissed,
    isSyncing
  );

  // Render based on mode
  switch (mode) {
    case 'slow-connection':
      return renderSlowConnectionIndicator(connectionType, () => setSlowConnectionDismissed(true));
    case 'offline':
      return renderOfflineIndicator(pendingCount);
    case 'syncing':
      return renderSyncingIndicator(syncingCount, pendingCount);
    case 'failed':
      return renderFailedIndicator(failedCount, connectionQuality, connectionType);
    case 'pending':
      return renderPendingIndicator(pendingCount);
    case 'hidden':
    default:
      return null;
  }
}
