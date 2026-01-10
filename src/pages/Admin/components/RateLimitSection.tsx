/**
 * RateLimitSection Component
 *
 * Collapsible section for managing login rate limits.
 * Allows admins to view blocked IPs and clear rate limits
 * when users are locked out due to failed login attempts.
 */

import React, { useEffect } from 'react';
import { ShieldAlert, Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import type { RateLimitEntry } from '../hooks/useRateLimitSettings';

export interface RateLimitSectionProps {
  /** Whether the section is expanded */
  isExpanded: boolean;
  /** Toggle section expansion */
  onToggleExpanded: () => void;
  /** List of IPs with failed login attempts */
  rateLimits: RateLimitEntry[];
  /** Number of currently blocked IPs */
  blockedCount: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Fetch current rate limit status */
  onRefresh: () => Promise<void>;
  /** Clear all rate limits */
  onClearAll: () => Promise<{ success: boolean; message: string }>;
  /** Clear rate limits for a specific IP */
  onClearIp: (ipAddress: string) => Promise<{ success: boolean; message: string }>;
}

/**
 * Formats a timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timestamp;
  }
}

/**
 * Formats time remaining until unblocked
 */
function formatTimeRemaining(blockedUntil: string | null): string {
  if (!blockedUntil) return '';

  try {
    const until = new Date(blockedUntil);
    const now = new Date();
    const diffMs = until.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const minutes = Math.ceil(diffMs / 60000);
    return `${minutes} min`;
  } catch {
    return '';
  }
}

export function RateLimitSection({
  isExpanded,
  onToggleExpanded,
  rateLimits,
  blockedCount,
  isLoading,
  error,
  onRefresh,
  onClearAll,
  onClearIp,
}: RateLimitSectionProps): React.ReactElement {
  const [actionMessage, setActionMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch status when section is expanded
  useEffect(() => {
    if (isExpanded) {
      onRefresh();
    }
  }, [isExpanded, onRefresh]);

  // Clear action message after 3 seconds
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const handleClearAll = async () => {
    const result = await onClearAll();
    setActionMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
  };

  const handleClearIp = async (ipAddress: string) => {
    const result = await onClearIp(ipAddress);
    setActionMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
  };

  return (
    <div className="visibility-control-section rate-limit-section">
      <div className="visibility-header" onClick={onToggleExpanded}>
        <div className="visibility-title">
          <ShieldAlert className="section-icon" />
          <h3>Login Rate Limits</h3>
          {blockedCount > 0 && (
            <span className="blocked-badge">{blockedCount} blocked</span>
          )}
        </div>
        <span className="expand-toggle">{isExpanded ? '▲ Collapse' : '▼ Expand'}</span>
      </div>

      {isExpanded && (
        <>
          {/* Action message */}
          {actionMessage && (
            <div className={`action-message ${actionMessage.type}`}>
              {actionMessage.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              {actionMessage.text}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="error-card">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions bar */}
          <div className="rate-limit-actions">
            <button
              className="action-btn refresh-btn"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
              Refresh
            </button>
            {rateLimits.length > 0 && (
              <button
                className="action-btn clear-all-btn"
                onClick={handleClearAll}
                disabled={isLoading}
              >
                <Trash2 size={16} />
                Clear All
              </button>
            )}
          </div>

          {/* Rate limits list */}
          {isLoading && rateLimits.length === 0 ? (
            <div className="loading-card">Loading rate limit data...</div>
          ) : rateLimits.length === 0 ? (
            <div className="empty-card">
              <CheckCircle size={24} />
              <p>No blocked IPs or failed login attempts in the last 2 hours.</p>
            </div>
          ) : (
            <div className="rate-limit-list">
              <div className="rate-limit-header-row">
                <span className="col-ip">IP Address</span>
                <span className="col-attempts">Attempts</span>
                <span className="col-last">Last Attempt</span>
                <span className="col-status">Status</span>
                <span className="col-action">Action</span>
              </div>
              {rateLimits.map((entry) => (
                <div
                  key={entry.ip_address}
                  className={`rate-limit-row ${entry.is_blocked ? 'blocked' : ''}`}
                >
                  <span className="col-ip">{entry.ip_address}</span>
                  <span className="col-attempts">{entry.failed_attempts}</span>
                  <span className="col-last">{formatTimestamp(entry.last_attempt)}</span>
                  <span className="col-status">
                    {entry.is_blocked ? (
                      <span className="status-blocked">
                        Blocked ({formatTimeRemaining(entry.blocked_until)})
                      </span>
                    ) : (
                      <span className="status-warning">Warning</span>
                    )}
                  </span>
                  <span className="col-action">
                    <button
                      className="clear-ip-btn"
                      onClick={() => handleClearIp(entry.ip_address)}
                      disabled={isLoading}
                      title="Clear rate limit for this IP"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Explanation card */}
          <div className="visibility-explanation">
            <h5>How It Works:</h5>
            <ul>
              <li><strong>Rate Limiting:</strong> Protects against brute force login attempts</li>
              <li><strong>Threshold:</strong> 10 failed attempts in 15 minutes triggers a 15-minute block</li>
              <li><strong>Shared IP Issue:</strong> At venues with shared WiFi, one person's failed attempts can block everyone</li>
              <li><strong>Clear All:</strong> Removes all failed attempt records from the last 2 hours</li>
              <li><strong>Per-IP Clear:</strong> Removes failed attempts for a specific IP address only</li>
            </ul>
          </div>
        </>
      )}

      <style>{`
        .rate-limit-section .blocked-badge {
          background: var(--status-error, #dc2626);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-left: 8px;
        }

        .rate-limit-section .action-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 0.875rem;
        }

        .rate-limit-section .action-message.success {
          background: var(--status-success-light, #dcfce7);
          color: var(--status-success, #16a34a);
        }

        .rate-limit-section .action-message.error {
          background: var(--status-error-light, #fee2e2);
          color: var(--status-error, #dc2626);
        }

        .rate-limit-section .error-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: var(--status-error-light, #fee2e2);
          color: var(--status-error, #dc2626);
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .rate-limit-section .rate-limit-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .rate-limit-section .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .rate-limit-section .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rate-limit-section .refresh-btn {
          background: var(--color-surface-secondary, #f3f4f6);
          color: var(--color-text-primary, #1f2937);
        }

        .rate-limit-section .clear-all-btn {
          background: var(--status-error, #dc2626);
          color: white;
        }

        .rate-limit-section .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .rate-limit-section .loading-card,
        .rate-limit-section .empty-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--color-surface-secondary, #f9fafb);
          border-radius: 8px;
          color: var(--color-text-secondary, #6b7280);
          text-align: center;
          gap: 8px;
        }

        .rate-limit-section .rate-limit-list {
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .rate-limit-section .rate-limit-header-row {
          display: grid;
          grid-template-columns: 1fr 80px 120px 100px 60px;
          gap: 8px;
          padding: 10px 12px;
          background: var(--color-surface-secondary, #f3f4f6);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary, #6b7280);
          text-transform: uppercase;
        }

        .rate-limit-section .rate-limit-row {
          display: grid;
          grid-template-columns: 1fr 80px 120px 100px 60px;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid var(--color-border, #e5e7eb);
          font-size: 0.875rem;
          align-items: center;
        }

        .rate-limit-section .rate-limit-row.blocked {
          background: var(--status-error-light, #fee2e2);
        }

        .rate-limit-section .col-ip {
          font-family: monospace;
          font-size: 0.8rem;
        }

        .rate-limit-section .col-attempts {
          text-align: center;
        }

        .rate-limit-section .col-last {
          font-size: 0.8rem;
          color: var(--color-text-secondary, #6b7280);
        }

        .rate-limit-section .status-blocked {
          color: var(--status-error, #dc2626);
          font-weight: 600;
          font-size: 0.75rem;
        }

        .rate-limit-section .status-warning {
          color: var(--status-warning, #d97706);
          font-weight: 500;
          font-size: 0.75rem;
        }

        .rate-limit-section .clear-ip-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border: none;
          border-radius: 4px;
          background: var(--color-surface-secondary, #f3f4f6);
          color: var(--color-text-secondary, #6b7280);
          cursor: pointer;
          transition: all 0.2s;
        }

        .rate-limit-section .clear-ip-btn:hover:not(:disabled) {
          background: var(--status-error, #dc2626);
          color: white;
        }

        .rate-limit-section .clear-ip-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .rate-limit-section .rate-limit-header-row,
          .rate-limit-section .rate-limit-row {
            grid-template-columns: 1fr 60px 80px;
          }

          .rate-limit-section .col-last,
          .rate-limit-section .col-action {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
