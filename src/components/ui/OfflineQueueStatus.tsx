/**
 * Offline Queue Status Component
 *
 * Shows a toast notification when syncing queued scores after coming back online.
 * Displays progress and allows user to see what's being synced.
 */

import React from 'react';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import { Cloud, CloudOff, AlertCircle, CheckCircle } from 'lucide-react';

export const OfflineQueueStatus: React.FC = () => {
  const { queue, isOnline, isSyncing, failedItems } = useOfflineQueueStore();

  const pendingCount = queue.filter(item => item.status === 'pending').length;
  const syncingCount = queue.filter(item => item.status === 'syncing').length;
  const failedCount = failedItems.length;

  // Don't show if nothing in queue
  if (queue.length === 0 && failedItems.length === 0) {
    return null;
  }

  // Don't show if all synced and online
  if (isOnline && !isSyncing && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  return (
    <div className="offline-queue-status">
      {/* Offline with pending items */}
      {!isOnline && pendingCount > 0 && (
        <div className="queue-toast queue-toast-offline">
          <CloudOff size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <div className="queue-message">
            <strong>Offline Mode</strong>
            <span>{pendingCount} score{pendingCount !== 1 ? 's' : ''} queued for sync</span>
          </div>
        </div>
      )}

      {/* Syncing when back online */}
      {isOnline && (isSyncing || syncingCount > 0) && (
        <div className="queue-toast queue-toast-syncing">
          <Cloud size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} className="rotating" />
          <div className="queue-message">
            <strong>Syncing Scores</strong>
            <span>Uploading {pendingCount + syncingCount} queued score{pendingCount + syncingCount !== 1 ? 's' : ''}...</span>
          </div>
        </div>
      )}

      {/* Failed items (need manual retry) */}
      {failedCount > 0 && (
        <div className="queue-toast queue-toast-error">
          <AlertCircle size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <div className="queue-message">
            <strong>Sync Failed</strong>
            <span>{failedCount} score{failedCount !== 1 ? 's' : ''} failed to sync</span>
          </div>
        </div>
      )}

      {/* Success (briefly show then auto-hide) */}
      {isOnline && !isSyncing && pendingCount === 0 && failedCount === 0 && queue.length > 0 && (
        <div className="queue-toast queue-toast-success">
          <CheckCircle size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <div className="queue-message">
            <strong>Sync Complete</strong>
            <span>All scores uploaded successfully</span>
          </div>
        </div>
      )}
    </div>
  );
};
