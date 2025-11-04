/**
 * Monitoring Dashboard Component
 *
 * Displays performance metrics, analytics, and rage patterns
 * in a developer-friendly interface.
 *
 * Only visible when Developer Mode is enabled in settings.
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@/services/performanceMonitor';
import { analyticsService } from '@/services/analyticsService';
import { useSettingsStore } from '@/stores/settingsStore';
import './shared-monitoring.css';

export function MonitoringDashboard() {
  const { settings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'performance' | 'analytics'>('performance');
  const [refreshKey, setRefreshKey] = useState(0);

  // Only show if developer mode enabled
  if (!settings.developerMode) {
    return null;
  }

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="monitoring-dashboard" key={refreshKey}>
      <div className="monitoring-header">
        <h2>🔍 Monitoring Dashboard</h2>
        <div className="monitoring-controls">
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Refresh
          </button>
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                JSON.stringify(performanceMonitor.generateReport(), null, 2)
              )
            }
            className="copy-btn"
          >
            📋 Copy Report
          </button>
        </div>
      </div>

      <div className="monitoring-tabs">
        <button
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          ⚡ Performance
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      <div className="monitoring-content">
        {activeTab === 'performance' && <PerformancePanel />}
        {activeTab === 'analytics' && <AnalyticsPanel />}
      </div>
    </div>
  );
}

/**
 * Performance Metrics Panel
 */
function PerformancePanel() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [webVitals, setWebVitals] = useState<any>({});

  useEffect(() => {
    const updateMetrics = () => {
      const allMetrics = performanceMonitor.getMetrics();
      setMetrics(allMetrics);

      // Get Web Vitals
      const fcp = performanceMonitor.getMetricStats('web_vital.fcp');
      const lcp = performanceMonitor.getMetricStats('web_vital.lcp');
      const cls = performanceMonitor.getMetricStats('web_vital.cls');
      const fid = performanceMonitor.getMetricStats('web_vital.fid');

      setWebVitals({ fcp, lcp, cls, fid });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (value: number, thresholds: [number, number]): 'good' | 'needs-improvement' | 'poor' => {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  return (
    <div className="performance-panel">
      <div className="web-vitals">
        <h3>Web Vitals</h3>

        {webVitals.fcp && (
          <div className={`vital ${getStatus(webVitals.fcp.avg, [1800, 3000])}`}>
            <div className="vital-name">First Contentful Paint (FCP)</div>
            <div className="vital-value">{webVitals.fcp.avg.toFixed(0)}ms</div>
            <div className="vital-range">
              p50: {webVitals.fcp.p50.toFixed(0)}ms | p95:{' '}
              {webVitals.fcp.p95.toFixed(0)}ms
            </div>
          </div>
        )}

        {webVitals.lcp && (
          <div className={`vital ${getStatus(webVitals.lcp.avg, [2500, 4000])}`}>
            <div className="vital-name">Largest Contentful Paint (LCP)</div>
            <div className="vital-value">{webVitals.lcp.avg.toFixed(0)}ms</div>
            <div className="vital-range">
              p50: {webVitals.lcp.p50.toFixed(0)}ms | p95:{' '}
              {webVitals.lcp.p95.toFixed(0)}ms
            </div>
          </div>
        )}

        {webVitals.cls && (
          <div className={`vital ${getStatus(webVitals.cls.avg, [0.1, 0.25])}`}>
            <div className="vital-name">Cumulative Layout Shift (CLS)</div>
            <div className="vital-value">{webVitals.cls.avg.toFixed(3)}</div>
            <div className="vital-range">
              min: {webVitals.cls.min.toFixed(3)} | max:{' '}
              {webVitals.cls.max.toFixed(3)}
            </div>
          </div>
        )}

        {webVitals.fid && (
          <div className={`vital ${getStatus(webVitals.fid.avg, [100, 300])}`}>
            <div className="vital-name">First Input Delay (FID)</div>
            <div className="vital-value">{webVitals.fid.avg.toFixed(0)}ms</div>
            <div className="vital-range">
              p50: {webVitals.fid.p50.toFixed(0)}ms | p95:{' '}
              {webVitals.fid.p95.toFixed(0)}ms
            </div>
          </div>
        )}
      </div>

      <div className="metrics-list">
        <h3>Recent Metrics ({metrics.length})</h3>
        <div className="metrics-table">
          <div className="metrics-header">
            <div className="col-name">Metric</div>
            <div className="col-value">Value</div>
            <div className="col-unit">Unit</div>
            <div className="col-time">Time</div>
          </div>
          {metrics.slice(-20).reverse().map((m, i) => (
            <div key={i} className="metrics-row">
              <div className="col-name">{m.name}</div>
              <div className="col-value">{m.value.toFixed(2)}</div>
              <div className="col-unit">{m.unit}</div>
              <div className="col-time">{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Analytics Panel
 */
function AnalyticsPanel() {
  const [session, setSession] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);

  useEffect(() => {
    const updateAnalytics = () => {
      setSession(analyticsService.getSessionSummary());
      setFeatures(analyticsService.getAllFeatureStats());
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="analytics-panel">
      {session && (
        <>
          <div className="session-info">
            <h3>Session Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="label">Session ID</div>
                <div className="value">{session.sessionId}</div>
              </div>
              <div className="info-item">
                <div className="label">Duration</div>
                <div className="value">
                  {(session.duration / 1000 / 60).toFixed(1)} minutes
                </div>
              </div>
              <div className="info-item">
                <div className="label">Pages Visited</div>
                <div className="value">{session.navigationPath.length}</div>
              </div>
              <div className="info-item">
                <div className="label">Total Events</div>
                <div className="value">{session.events.length}</div>
              </div>
              <div className="info-item">
                <div className="label">Errors</div>
                <div className="value">{session.errorCount}</div>
              </div>
              <div className="info-item">
                <div className="label">Sync Conflicts</div>
                <div className="value">{session.syncConflicts}</div>
              </div>
            </div>
          </div>

          <div className="device-info">
            <h3>Device Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="label">Device Type</div>
                <div className="value">{session.deviceInfo.deviceType}</div>
              </div>
              <div className="info-item">
                <div className="label">OS</div>
                <div className="value">
                  {session.deviceInfo.osType}{' '}
                  {session.deviceInfo.osVersion}
                </div>
              </div>
              <div className="info-item">
                <div className="label">Browser</div>
                <div className="value">
                  {session.deviceInfo.browserType}{' '}
                  {session.deviceInfo.browserVersion}
                </div>
              </div>
              <div className="info-item">
                <div className="label">Screen Size</div>
                <div className="value">{session.deviceInfo.screenSize}</div>
              </div>
              {session.deviceInfo.deviceMemory && (
                <div className="info-item">
                  <div className="label">Memory</div>
                  <div className="value">
                    {session.deviceInfo.deviceMemory} GB
                  </div>
                </div>
              )}
              {session.deviceInfo.hardwareConcurrency && (
                <div className="info-item">
                  <div className="label">CPU Cores</div>
                  <div className="value">
                    {session.deviceInfo.hardwareConcurrency}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {features.length > 0 && (
        <div className="features-stats">
          <h3>Feature Usage</h3>
          <div className="features-table">
            <div className="features-header">
              <div className="col-name">Feature</div>
              <div className="col-count">Uses</div>
              <div className="col-duration">Total</div>
              <div className="col-avg">Avg</div>
              <div className="col-error">Error Rate</div>
            </div>
            {features.map((f, i) => (
              <div key={i} className="features-row">
                <div className="col-name">{f.feature}</div>
                <div className="col-count">{f.usageCount}</div>
                <div className="col-duration">
                  {f.totalDuration.toFixed(1)}s
                </div>
                <div className="col-avg">
                  {f.averageDuration.toFixed(0)}ms
                </div>
                <div className="col-error">
                  {(f.errorRate * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

