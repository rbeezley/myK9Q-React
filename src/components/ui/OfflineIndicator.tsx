/**
 * Offline Indicator Component (Banner Version)
 *
 * Shows a persistent banner ONLY for failed sync states.
 * Other states (offline, pending, syncing) are handled by the
 * CompactOfflineIndicator component in page headers.
 *
 * This banner provides:
 * - High visibility for critical sync failures
 * - Retry functionality (via the banner)
 * - Connection quality hints
 */

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';
import { networkDetectionService, type NetworkInfo } from '@/services/networkDetectionService';
import './shared-ui.css';

// ========================================
// TYPES
// ========================================

type ConnectionQuality = 'slow' | 'medium' | 'fast' | null;

// ========================================
// HELPER FUNCTIONS
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
 * Format count text (singular/plural)
 */
function formatScoreCount(count: number): string {
  return `${count} ${count === 1 ? 'score' : 'scores'}`;
}

// ========================================
// MAIN COMPONENT
// ========================================

/**
 * OfflineIndicator - Shows banner ONLY for failed sync states
 *
 * Other states (offline, pending, syncing, online) are now handled
 * by the CompactOfflineIndicator component in page headers.
 */
export function OfflineIndicator() {
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(null);
  const [connectionType, setConnectionType] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  const { failedItems, retryFailed } = useOfflineQueueStore();
  const failedCount = failedItems.length;

  // Network status effect
  useEffect(() => {
    // Subscribe to network changes for connection quality hints
    const unsubscribe = networkDetectionService.subscribe((networkInfo) => {
      setConnectionQuality(determineConnectionQuality(networkInfo));
      setConnectionType(determineConnectionType(networkInfo));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle retry button click
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryFailed();
    } finally {
      setIsRetrying(false);
    }
  };

  // Only render for failed states - other states handled by CompactOfflineIndicator
  if (failedCount === 0) {
    return null;
  }

  const showConnectionHint = connectionQuality === 'slow' && connectionType;

  return (
    <div className="offline-indicator failed-mode">
      <div className="offline-indicator-content">
        <AlertCircle
          className="offline-icon"
          size={20}
          style={{ width: '20px', height: '20px', flexShrink: 0 }}
        />
        <div className="offline-text">
          <strong>Sync Failed</strong>
          <span className="offline-count">
            {formatScoreCount(failedCount)} failed to sync
            {showConnectionHint && ` • ${connectionType} may be too slow`}
          </span>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="offline-retry-btn"
          aria-label="Retry failed sync"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'inherit',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            padding: '6px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            opacity: isRetrying ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: isRetrying ? 'spin 1s linear infinite' : 'none',
            }}
          />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    </div>
  );
}
