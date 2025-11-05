/**
 * Subscription Monitor Component
 *
 * Developer tool for monitoring real-time subscription health and detecting memory leaks.
 * Only visible in development mode.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { subscriptionCleanup, SubscriptionInfo } from '../../services/subscriptionCleanup';
import { memoryLeakDetector } from '../../utils/memoryLeakDetector';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Trash2, X, Database } from 'lucide-react';
import './SubscriptionMonitor.css';

export const SubscriptionMonitor: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([]);
  const [healthReport, setHealthReport] = useState<any>(null);
  const [leakCheck, setLeakCheck] = useState<any>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh data
  const refreshData = () => {
    setSubscriptions(subscriptionCleanup.getAll());
    setHealthReport(subscriptionCleanup.generateHealthReport());
    setLeakCheck(subscriptionCleanup.checkForLeaks());
    setMemoryStats(memoryLeakDetector.getCurrentStats());
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (autoRefresh) {
      refreshData();
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Manual refresh
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  // Compute current time once per render for age calculations
  // eslint-disable-next-line react-hooks/purity
  const now = useMemo(() => Date.now(), [subscriptions]);

  // Only show in development - check AFTER all hooks
  if (import.meta.env.PROD) {
    return null;
  }

  const handleCleanupAll = () => {
    const count = subscriptionCleanup.cleanupAll();
    alert(`Cleaned up ${count} subscriptions`);
    refreshData();
  };

  const handleCleanupStale = () => {
    // Clean up subscriptions older than 5 minutes
    const currentTime = Date.now();
    const count = subscriptions.filter(s => {
      const ageMinutes = (currentTime - s.createdAt.getTime()) / 60000;
      return ageMinutes > 5;
    }).length;

    subscriptions.forEach(s => {
      const ageMinutes = (currentTime - s.createdAt.getTime()) / 60000;
      if (ageMinutes > 5) {
        subscriptionCleanup.unregister(s.key);
      }
    });

    alert(`Cleaned up ${count} stale subscriptions (>5 minutes old)`);
    refreshData();
  };

  if (!isOpen) {
    return (
      <button
        className="subscription-monitor-toggle"
        onClick={() => setIsOpen(true)}
        title="Subscription Monitor"
      >
        <Activity size={20} />
        {leakCheck?.hasLeaks && (
          <span className="leak-indicator">!</span>
        )}
        <span className="count-badge">{healthReport?.activeCount || 0}</span>
      </button>
    );
  }

  return (
    <div className="subscription-monitor-panel">
      <div className="monitor-header">
        <div className="header-left">
          <Activity size={20} />
          <h3>Subscription Monitor</h3>
          {leakCheck?.hasLeaks && (
            <span className="leak-warning">
              <AlertTriangle size={16} />
              LEAK DETECTED
            </span>
          )}
        </div>
        <div className="header-actions">
          <button
            className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            <RefreshCw size={16} className={autoRefresh ? 'spinning' : ''} />
          </button>
          <button
            className="action-btn"
            onClick={handleCleanupStale}
            title="Cleanup stale subscriptions"
          >
            <Trash2 size={16} />
            Cleanup Stale
          </button>
          <button
            className="action-btn danger"
            onClick={handleCleanupAll}
            title="Cleanup all subscriptions"
          >
            <Trash2 size={16} />
            Cleanup All
          </button>
          <button
            className="close-btn"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="monitor-content">
        {/* Health Summary */}
        <div className="health-summary">
          <div className="stat-card">
            <div className="stat-label">Active Subscriptions</div>
            <div className={`stat-value ${healthReport?.activeCount > 10 ? 'warning' : ''}`}>
              {healthReport?.activeCount || 0}
            </div>
          </div>

          {healthReport?.oldestSubscription && (
            <div className="stat-card">
              <div className="stat-label">Oldest Subscription</div>
              <div className={`stat-value ${healthReport.oldestSubscription.ageMinutes > 60 ? 'warning' : ''}`}>
                {healthReport.oldestSubscription.ageMinutes}m
              </div>
              <div className="stat-sublabel">{healthReport.oldestSubscription.key}</div>
            </div>
          )}

          <div className="stat-card">
            <div className="stat-label">Recent Cleanups</div>
            <div className="stat-value">
              {healthReport?.recentCleanups || 0}
            </div>
            <div className="stat-sublabel">Last hour</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Avg Cleanup Size</div>
            <div className="stat-value">
              {healthReport?.averageCleanupSize || 0}
            </div>
          </div>

          {/* Memory Stats (if available) */}
          {memoryStats && (
            <>
              <div className="stat-card">
                <div className="stat-label">
                  <Database size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Heap Used
                </div>
                <div className={`stat-value ${memoryStats.heapUsedMB > 100 ? 'warning' : ''}`}>
                  {memoryStats.heapUsedMB}MB
                </div>
                <div className="stat-sublabel">/ {memoryStats.heapTotalMB}MB total</div>
              </div>
            </>
          )}
        </div>

        {/* Leak Detection */}
        {leakCheck?.hasLeaks && (
          <div className="leak-alert">
            <AlertTriangle size={20} />
            <div className="leak-details">
              <strong>Potential Memory Leak Detected</strong>
              <p>
                {leakCheck.count} active subscriptions detected.
                Oldest subscription is {leakCheck.oldestAge} minutes old.
              </p>
            </div>
          </div>
        )}

        {/* By Type */}
        <div className="type-breakdown">
          <h4>By Type</h4>
          <div className="type-grid">
            {Object.entries(healthReport?.byType || {}).map(([type, count]) => (
              <div key={type} className="type-item">
                <span className="type-name">{type}</span>
                <span className="type-count">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Subscriptions List */}
        <div className="subscriptions-list">
          <h4>Active Subscriptions ({subscriptions.length})</h4>
          {subscriptions.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={32} />
              <p>No active subscriptions</p>
            </div>
          ) : (
            <div className="subscription-items">
              {subscriptions.map(sub => {
                const ageMinutes = Math.round((now - sub.createdAt.getTime()) / 60000);
                const isOld = ageMinutes > 30;

                return (
                  <div key={sub.key} className={`subscription-item ${isOld ? 'old' : ''}`}>
                    <div className="sub-info">
                      <div className="sub-key">{sub.key}</div>
                      <div className="sub-meta">
                        <span className={`sub-type type-${sub.type}`}>{sub.type}</span>
                        {sub.licenseKey && (
                          <span className="sub-license">{sub.licenseKey.slice(0, 8)}...</span>
                        )}
                        <span className={`sub-age ${isOld ? 'warning' : ''}`}>
                          {ageMinutes}m old
                        </span>
                      </div>
                    </div>
                    <button
                      className="sub-remove"
                      onClick={() => {
                        subscriptionCleanup.unregister(sub.key);
                        refreshData();
                      }}
                      title="Remove subscription"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cleanup History */}
        <div className="cleanup-history">
          <h4>Recent Cleanups</h4>
          <div className="history-items">
            {subscriptionCleanup.getHistory().slice(-10).reverse().map((h, i) => (
              <div key={i} className="history-item">
                <span className="history-time">
                  {new Date(h.timestamp).toLocaleTimeString()}
                </span>
                <span className="history-count">{h.count} subscriptions</span>
                {h.route && <span className="history-route">{h.route}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
