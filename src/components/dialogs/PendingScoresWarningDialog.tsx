/**
 * PendingScoresWarningDialog
 *
 * Shown when a user attempts to logout while there are unsynced scores.
 * Prevents accidental data loss by blocking logout until scores are synced.
 */

import React from 'react';
import { AlertTriangle, Wifi, WifiOff, CloudOff } from 'lucide-react';
import './PendingScoresWarningDialog.css';

interface PendingScoresWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  onForceLogout?: () => void; // Optional: allow force logout (with warning)
}

export const PendingScoresWarningDialog: React.FC<PendingScoresWarningDialogProps> = ({
  isOpen,
  onClose,
  pendingCount,
  isOnline,
  isSyncing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="pending-scores-dialog-overlay" onClick={onClose}>
      <div
        className="pending-scores-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pending-scores-dialog-icon">
          <AlertTriangle size={48} />
        </div>

        <h2 className="pending-scores-dialog-title">
          Cannot Log Out
        </h2>

        <p className="pending-scores-dialog-message">
          You have <strong>{pendingCount} score{pendingCount !== 1 ? 's' : ''}</strong> that
          {pendingCount !== 1 ? " haven't" : " hasn't"} been uploaded yet.
        </p>

        <p className="pending-scores-dialog-warning">
          Logging out will <strong>permanently delete</strong> these scores.
        </p>

        <div className="pending-scores-dialog-status">
          {isOnline ? (
            isSyncing ? (
              <>
                <Wifi className="status-icon syncing" />
                <span>Syncing in progress... Please wait.</span>
              </>
            ) : (
              <>
                <Wifi className="status-icon online" />
                <span>Connected - scores should sync automatically</span>
              </>
            )
          ) : (
            <>
              <WifiOff className="status-icon offline" />
              <span>Offline - please reconnect to upload scores</span>
            </>
          )}
        </div>

        <div className="pending-scores-dialog-instructions">
          <h3>What to do:</h3>
          <ol>
            {!isOnline && (
              <li>Connect to WiFi or cellular data</li>
            )}
            <li>Wait for all scores to sync (check the sync indicator)</li>
            <li>Once synced, you can safely log out</li>
          </ol>

          <p className="pending-scores-dialog-tip">
            <CloudOff size={16} />
            <span>
              <strong>Tip:</strong> You can safely close the app without logging out.
              Your scores will be preserved and sync when you reopen.
            </span>
          </p>
        </div>

        <div className="pending-scores-dialog-actions">
          <button
            className="btn btn-primary"
            onClick={onClose}
          >
            OK, I'll Wait
          </button>
        </div>
      </div>
    </div>
  );
};
