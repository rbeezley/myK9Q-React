import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, Loader } from 'lucide-react';
import { runIndexedDBDiagnostics, attemptAutoCleanup, getManualCleanupInstructions } from '@/utils/indexedDBDiagnostics';
import { stopReplicationManager } from '@/services/replication/ReplicationManager';
import './DatabaseRecovery.css';

interface DatabaseRecoveryProps {
  onRecovered?: () => void;
}

export const DatabaseRecovery: React.FC<DatabaseRecoveryProps> = ({ onRecovered }) => {
  const [isDetecting, setIsDetecting] = useState(true);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string>('');
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [autoRecoveryAttempted, setAutoRecoveryAttempted] = useState(false);

  useEffect(() => {
    detectDatabaseIssues();

    // Listen for database errors in console
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Database open timed out') ||
          errorMessage.includes('database may be corrupted') ||
          errorMessage.includes('ReplicationManager] Failed to sync') ||
          errorMessage.includes('Failed to open IndexedDB') ||
          errorMessage.includes('IDBDatabase.transaction') ||
          errorMessage.includes('QuotaExceededError') ||
          errorMessage.includes('UnknownError') ||
          errorMessage.includes('VersionError')) {
        console.log('[DatabaseRecovery] Corruption/error detected via console error');
        setIsCorrupted(true);
        setIsDetecting(false);

        // Note: Auto-recovery will be triggered by detectDatabaseIssues
      }
      originalError.apply(console, args);
    };

    // Also listen for critical alerts
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const warnMessage = args.join(' ');
      if (warnMessage.includes('CRITICAL ALERT') ||
          warnMessage.includes('Deleting corrupted database') ||
          warnMessage.includes('Database blocked') ||
          warnMessage.includes('Delete blocked')) {
        console.log('[DatabaseRecovery] Corruption/blocking detected via console warning');
        setIsCorrupted(true);
        setIsDetecting(false);
      }
      originalWarn.apply(console, args);
    };

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const detectDatabaseIssues = async () => {
    try {
      setIsDetecting(true);

      // Run diagnostics
      const result = await runIndexedDBDiagnostics();

      if (result.status === 'corrupted' || result.status === 'locked') {
        setIsCorrupted(true);

        // Show modal first, then attempt auto-recovery after a short delay
        console.log('[DatabaseRecovery] Storage optimization needed - showing optimization modal');

        // Auto-attempt recovery after 2 seconds (gives user time to see what's happening)
        if (!autoRecoveryAttempted) {
          setAutoRecoveryAttempted(true);
          setTimeout(() => {
            console.log('[DatabaseRecovery] Starting automatic optimization...');
            handleAutoRecovery();
          }, 2000);
        }
      } else if (result.status === 'healthy') {
        setIsCorrupted(false);
        onRecovered?.();
      }
    } catch (error) {
      console.error('[DatabaseRecovery] Detection error:', error);
      setIsCorrupted(true);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAutoRecovery = async () => {
    try {
      setIsRecovering(true);
      setRecoveryStatus('Optimizing your local storage...');

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Recovery timeout')), 10000) // 10 second timeout
      );

      // Create recovery promise
      const recoveryPromise = async () => {
        // First, try to stop any active replication
        try {
          await stopReplicationManager();
        } catch (error) {
          console.warn('[DatabaseRecovery] Could not stop replication:', error);
        }

        // Attempt cleanup
        const cleanupResult = await attemptAutoCleanup();
        return cleanupResult;
      };

      // Race between recovery and timeout
      const cleanupResult = await Promise.race([
        recoveryPromise(),
        timeoutPromise
      ]) as { success: boolean; message?: string };

      if (cleanupResult.success) {
        setRecoveryStatus('Optimization complete! Refreshing...');

        // Wait a moment for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force reload to reinitialize everything
        window.location.reload();
      } else {
        setRecoveryStatus('Additional steps needed. Please follow the instructions below.');
        setShowManualInstructions(true);
      }
    } catch (error: any) {
      console.error('[DatabaseRecovery] Optimization error or timeout:', error);

      // If it's a timeout, provide a more direct solution
      if (error?.message === 'Recovery timeout') {
        setRecoveryStatus('The optimization is taking longer than expected. Please use the manual steps below.');
      } else {
        setRecoveryStatus('Please follow these simple steps to continue.');
      }
      setShowManualInstructions(true);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleManualRecovery = () => {
    setShowManualInstructions(true);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Don't show anything if database is healthy
  if (!isDetecting && !isCorrupted) {
    return null;
  }

  // Show subtle loading indicator during detection
  if (isDetecting) {
    return (
      <div className="database-recovery-detecting">
        <Loader className="detecting-icon" />
        <span>Preparing your workspace...</span>
      </div>
    );
  }

  return (
    <div className="database-recovery-modal">
      <div className="database-recovery-overlay" />
      <div className="database-recovery-content">
        <div className="recovery-header">
          <RefreshCw className="warning-icon" />
          <h2>Optimizing Your Experience</h2>
        </div>

        <div className="recovery-body">
          <p className="recovery-message">
            We're performing a quick optimization to ensure your data loads smoothly. This typically happens when your browser's storage needs a refresh.
            {process.env.NODE_ENV === 'production' && !autoRecoveryAttempted &&
              ' This will only take a moment.'}
          </p>

          {recoveryStatus && (
            <div className="recovery-status">
              {isRecovering && <Loader className="status-icon spinning" />}
              {!isRecovering && recoveryStatus.includes('recovered') &&
                <CheckCircle className="status-icon success" />}
              {!isRecovering && recoveryStatus.includes('failed') &&
                <AlertTriangle className="status-icon error" />}
              <span>{recoveryStatus}</span>
            </div>
          )}

          {!isRecovering && !autoRecoveryAttempted && (
            <div className="recovery-actions">
              <button
                className="btn-primary"
                onClick={handleAutoRecovery}
              >
                <RefreshCw className="btn-icon" />
                Optimize Now
              </button>
              <button
                className="btn-secondary"
                onClick={handleManualRecovery}
              >
                Show Me How
              </button>
            </div>
          )}

          {showManualInstructions && (
            <div className="manual-instructions">
              <h3>Quick Browser Refresh Steps</h3>

              {/* Quick fix button for stuck situations */}
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--background-secondary)', borderRadius: 'var(--token-radius-md)' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Quick Fix (Try This First):</p>
                <button
                  className="btn-primary"
                  onClick={async () => {
                    setRecoveryStatus('Clearing cache...');
                    setIsRecovering(true);

                    try {
                      // Get all databases if possible
                      let allDatabases = [
                        'myK9Q_Replication',
                        'myK9Q_OfflineCache',
                        'myK9Q_Mutations',
                        'myK9Q_entries',
                        'myK9Q_classes',
                        'myK9Q_trials',
                        'myK9Q_shows',
                        'myK9Q_announcements'
                      ];

                      // Try to get actual list of databases
                      if ('databases' in indexedDB) {
                        try {
                          const dbs = await indexedDB.databases();
                          const myK9QDbs = dbs.filter(db => db.name?.startsWith('myK9Q')).map(db => db.name!);
                          if (myK9QDbs.length > 0) {
                            allDatabases = myK9QDbs;
                          }
                        } catch {
                          // Use default list
                        }
                      }

                      // Clear all myK9Q databases
                      for (const db of allDatabases) {
                        try {
                          const deleteReq = indexedDB.deleteDatabase(db);
                          await new Promise((resolve) => {
                            deleteReq.onsuccess = resolve;
                            deleteReq.onerror = resolve;
                            deleteReq.onblocked = resolve;
                            // Force timeout after 500ms per database
                            setTimeout(resolve, 500);
                          });
                          console.log(`Deleted ${db}`);
                        } catch (e) {
                          console.log(`Could not delete ${db}`);
                        }
                      }

                      // Clear localStorage (except auth)
                      Object.keys(localStorage).forEach(key => {
                        if (key.includes('myK9Q') && !key.includes('auth')) {
                          localStorage.removeItem(key);
                        }
                      });

                      // Clear service worker cache
                      if ('serviceWorker' in navigator) {
                        try {
                          const registrations = await navigator.serviceWorker.getRegistrations();
                          for (const registration of registrations) {
                            await registration.unregister();
                          }
                        } catch {
                          // Ignore
                        }
                      }

                      console.log('Cache cleared successfully, reloading...');
                      window.location.reload();
                    } catch (error) {
                      console.error('Error clearing cache:', error);
                      // Reload anyway
                      window.location.reload();
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  <RefreshCw className="btn-icon" />
                  Clear Cache & Reload
                </button>
              </div>

              <p style={{ marginBottom: '1rem' }}>Or follow these manual steps:</p>
              <ol>
                <li>Press F12 to open Developer Tools</li>
                <li>Go to the Application tab</li>
                <li>Click "Storage" in the left sidebar</li>
                <li>Click "Clear site data"</li>
                <li>Refresh this page</li>
              </ol>
              <button
                className="btn-primary"
                onClick={handleRefresh}
                style={{ marginTop: '1rem' }}
              >
                <RefreshCw className="btn-icon" />
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};