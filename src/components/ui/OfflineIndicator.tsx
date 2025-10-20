/**
 * Offline Indicator Component
 *
 * Shows a persistent banner when the app is offline, with sync status
 * and number of pending mutations. Provides visual feedback for offline
 * operation and automatic sync progress.
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, CloudOff, CloudUpload, AlertCircle } from 'lucide-react';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';
import './OfflineIndicator.css';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { queue, isSyncing, failedItems } = useOfflineQueueStore();

  const pendingCount = queue.filter(q => q.status === 'pending').length;
  const syncingCount = queue.filter(q => q.status === 'syncing').length;
  const failedCount = failedItems.length;

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

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0 && syncingCount === 0 && failedCount === 0) {
    return null;
  }

  // Offline mode
  if (!isOnline) {
    return (
      <div className="offline-indicator offline-mode">
        <div className="offline-indicator-content">
          <WifiOff className="offline-icon" size={20} />
          <div className="offline-text">
            <strong>Working Offline</strong>
            {pendingCount > 0 && (
              <span className="offline-count">
                {pendingCount} {pendingCount === 1 ? 'score' : 'scores'} queued
              </span>
            )}
          </div>
          <CloudOff className="offline-cloud-icon" size={16} />
        </div>
      </div>
    );
  }

  // Syncing mode
  if (isSyncing || syncingCount > 0) {
    return (
      <div className="offline-indicator syncing-mode">
        <div className="offline-indicator-content">
          <CloudUpload className="offline-icon syncing-icon" size={20} />
          <div className="offline-text">
            <strong>Syncing...</strong>
            <span className="offline-count">
              {syncingCount} of {pendingCount + syncingCount} {pendingCount + syncingCount === 1 ? 'score' : 'scores'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Failed mode
  if (failedCount > 0) {
    return (
      <div className="offline-indicator failed-mode">
        <div className="offline-indicator-content">
          <AlertCircle className="offline-icon" size={20} />
          <div className="offline-text">
            <strong>Sync Failed</strong>
            <span className="offline-count">
              {failedCount} {failedCount === 1 ? 'score' : 'scores'} failed to sync
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Online with pending (brief state)
  if (pendingCount > 0) {
    return (
      <div className="offline-indicator pending-mode">
        <div className="offline-indicator-content">
          <Wifi className="offline-icon" size={20} />
          <div className="offline-text">
            <strong>Online</strong>
            <span className="offline-count">
              {pendingCount} {pendingCount === 1 ? 'score' : 'scores'} pending sync
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
