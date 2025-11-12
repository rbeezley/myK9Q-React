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

        // Don't auto-recover immediately - let user see the modal and click the button
        // This gives them visibility into what's happening
        console.log('[DatabaseRecovery] Database corruption confirmed - showing recovery modal');
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
      setRecoveryStatus('Attempting automatic recovery...');

      // First, try to stop any active replication
      try {
        await stopReplicationManager();
      } catch (error) {
        console.warn('[DatabaseRecovery] Could not stop replication:', error);
      }

      // Attempt cleanup
      const cleanupResult = await attemptAutoCleanup();

      if (cleanupResult.success) {
        setRecoveryStatus('Database recovered! Reloading...');

        // Wait a moment for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Force reload to reinitialize everything
        window.location.reload();
      } else {
        setRecoveryStatus('Automatic recovery failed. Manual intervention required.');
        setShowManualInstructions(true);
      }
    } catch (error) {
      console.error('[DatabaseRecovery] Recovery error:', error);
      setRecoveryStatus('Recovery failed. Please follow manual instructions.');
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
        <span>Checking database...</span>
      </div>
    );
  }

  return (
    <div className="database-recovery-modal">
      <div className="database-recovery-overlay" />
      <div className="database-recovery-content">
        <div className="recovery-header">
          <AlertTriangle className="warning-icon" />
          <h2>Database Issue Detected</h2>
        </div>

        <div className="recovery-body">
          <p className="recovery-message">
            We've detected an issue with your local database that's preventing data from loading properly.
            {process.env.NODE_ENV === 'production' && !autoRecoveryAttempted &&
              ' We\'ll attempt to fix this automatically.'}
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
                Attempt Recovery
              </button>
              <button
                className="btn-secondary"
                onClick={handleManualRecovery}
              >
                Manual Instructions
              </button>
            </div>
          )}

          {showManualInstructions && (
            <div className="manual-instructions">
              <h3>Manual Recovery Steps</h3>
              <ol>
                {getManualCleanupInstructions()
                  .filter(line => line && !line.startsWith('🔧') && !line.startsWith('⚠️'))
                  .map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))
                }
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