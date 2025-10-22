/**
 * Network Inspector Component
 *
 * Displays real-time network requests with filtering and search capabilities.
 * Only enabled in development mode.
 */

import React, { useState, useEffect } from 'react';
import developerModeService from '@/services/developerMode';
import { X, Search, Filter, Download } from 'lucide-react';
import './NetworkInspector.css';

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
}

export const NetworkInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [filter, setFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const config = developerModeService.getConfig();
    if (!config.enabled || !config.showNetwork) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
      return;
    }

    // Poll for network requests
    const interval = setInterval(() => {
      const networkRequests = developerModeService.getNetworkRequests();
      setRequests([...networkRequests].reverse()); // Most recent first
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredRequests = requests.filter(req => {
    // Text filter
    if (filter && !req.url.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }

    // Method filter
    if (methodFilter !== 'all' && req.method !== methodFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === '2xx' && (req.status < 200 || req.status >= 300)) {
      return false;
    }
    if (statusFilter === '4xx' && (req.status < 400 || req.status >= 500)) {
      return false;
    }
    if (statusFilter === '5xx' && (req.status < 500 || req.status >= 600)) {
      return false;
    }

    return true;
  });

  const handleExport = () => {
    const data = {
      requests: filteredRequests,
      exportedAt: new Date().toISOString(),
      filters: { text: filter, method: methodFilter, status: statusFilter },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-requests-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return '#10b981';
    if (status >= 300 && status < 400) return '#3b82f6';
    if (status >= 400 && status < 500) return '#f59e0b';
    return '#ef4444';
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  if (!developerModeService.getConfig().enabled) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        className="network-inspector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Network Inspector"
      >
        📡 {requests.length}
      </button>

      {/* Inspector Panel */}
      {isOpen && (
        <div className="network-inspector">
          <div className="network-inspector-header">
            <h3>Network Inspector</h3>
            <button onClick={() => setIsOpen(false)} className="close-button">
              <X size={18} />
            </button>
          </div>

          <div className="network-inspector-controls">
            <div className="search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Filter by URL..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <Filter size={14} />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="2xx">2xx Success</option>
                <option value="4xx">4xx Client Error</option>
                <option value="5xx">5xx Server Error</option>
              </select>
            </div>

            <button onClick={handleExport} className="export-button" title="Export as JSON">
              <Download size={14} />
              Export
            </button>
          </div>

          <div className="network-inspector-stats">
            <span>Total: {requests.length}</span>
            <span>Filtered: {filteredRequests.length}</span>
            <span>Avg: {filteredRequests.length > 0 ? formatDuration(filteredRequests.reduce((sum, r) => sum + r.duration, 0) / filteredRequests.length) : '0ms'}</span>
          </div>

          <div className="network-inspector-list">
            {filteredRequests.length === 0 ? (
              <div className="network-inspector-empty">
                No network requests captured
              </div>
            ) : (
              filteredRequests.map((req, idx) => (
                <div key={`${req.timestamp}-${idx}`} className="network-request-item">
                  <div className="request-method">{req.method}</div>
                  <div
                    className="request-status"
                    style={{ background: getStatusColor(req.status) }}
                  >
                    {req.status}
                  </div>
                  <div className="request-url" title={req.url}>
                    {new URL(req.url, window.location.origin).pathname}
                  </div>
                  <div className="request-duration">{formatDuration(req.duration)}</div>
                  <div className="request-time">{formatTime(req.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
