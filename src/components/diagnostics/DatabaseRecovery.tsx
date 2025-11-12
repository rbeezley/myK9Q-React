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
          errorMessage.includes('ReplicationManager] Failed to sync')) {
        console.log('[DatabaseRecovery] Corruption detected via console error');
        setIsCorrupted(true);
        setIsDetecting(false);
      }
      originalError.apply(console, args);
    };

    // Also listen for critical alerts
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const warnMessage = args.join(' ');
      if (warnMessage.includes('CRITICAL ALERT') ||
          warnMessage.includes('Deleting corrupted database')) {
        console.log('[DatabaseRecovery] Corruption detected via console warning');
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

      // First, try to stop any active replication
      try {
        await stopReplicationManager();
      } catch (error) {
        console.warn('[DatabaseRecovery] Could not stop replication:', error);
      }

      // Attempt cleanup
      const cleanupResult = await attemptAutoCleanup();

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
    } catch (error) {
      console.error('[DatabaseRecovery] Optimization error:', error);
      setRecoveryStatus('Please follow these simple steps to continue.');
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