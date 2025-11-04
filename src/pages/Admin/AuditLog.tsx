/**
 * Audit Log Page
 *
 * Displays a searchable, filterable history of all competition admin changes
 * including visibility settings and self check-in configuration changes.
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import {
  fetchAuditLog,
  getUniqueAdministrators,
  formatAuditEntry,
  type AuditLogEntry,
  type AuditLogFilters,
} from '@/services/auditLogService';
import { HamburgerMenu, HeaderTicker } from '@/components/ui';
import { Clock, Filter, X, User, Calendar, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './AuditLog.css';

const AuditLog: React.FC = () => {
  const { licenseKey } = useParams<{ licenseKey: string }>();
  const { isAdmin } = usePermission();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [administrators, setAdministrators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [limit, setLimit] = useState(100);

  // Load data
  useEffect(() => {
    loadAuditLog();
    loadAdministrators();
  }, [licenseKey, filters, limit]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLog(licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604', filters, limit);
      setEntries(data);
    } catch (err) {
      console.error('Error loading audit log:', err);
      setError('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const loadAdministrators = async () => {
    try {
      const admins = await getUniqueAdministrators(licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604');
      setAdministrators(admins);
    } catch (err) {
      console.error('Error loading administrators:', err);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Permission check
  if (!isAdmin()) {
    return (
      <div className="page-container">
        <div className="audit-log-error">
          <h2>Access Denied</h2>
          <p>You need administrator permissions to view the audit log.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-log page-container">
      {/* Header */}
      <div className="audit-log-header">
        <div className="header-top">
          <HamburgerMenu currentPage="admin" />
          <div className="header-info">
            <div className="header-title">
              <Clock className="header-icon" />
              <h1>Audit Log</h1>
            </div>
          </div>
        </div>
        <p className="header-description">
          Track all changes to competition settings including result visibility and self check-in configuration.
        </p>
      </div>

      {/* Header Ticker */}
      <HeaderTicker />

      {/* Controls */}
      <div className="audit-log-controls">
        <button
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="btn-icon" />
          <span>Filters</span>
          {hasActiveFilters && <span className="filter-badge">{Object.keys(filters).length}</span>}
        </button>

        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            <X className="btn-icon" />
            Clear Filters
          </button>
        )}

        <div className="limit-control">
          <label htmlFor="limit-select">Show:</label>
          <select
            id="limit-select"
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
          >
            <option value={50}>50 entries</option>
            <option value={100}>100 entries</option>
            <option value={250}>250 entries</option>
            <option value={500}>500 entries</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-grid">
            {/* Scope Filter */}
            <div className="filter-group">
              <label htmlFor="scope-filter">Scope</label>
              <select
                id="scope-filter"
                value={filters.scope || ''}
                onChange={e => handleFilterChange('scope', e.target.value)}
              >
                <option value="">All Scopes</option>
                <option value="Show Level">Show Level</option>
                <option value="Trial Level">Trial Level</option>
                <option value="Class Level">Class Level</option>
              </select>
            </div>

            {/* Administrator Filter */}
            <div className="filter-group">
              <label htmlFor="admin-filter">Administrator</label>
              <select
                id="admin-filter"
                value={filters.updated_by || ''}
                onChange={e => handleFilterChange('updated_by', e.target.value)}
              >
                <option value="">All Administrators</option>
                {administrators.map(admin => (
                  <option key={admin} value={admin}>
                    {admin}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="filter-group">
              <label htmlFor="start-date-filter">From Date</label>
              <input
                type="date"
                id="start-date-filter"
                value={filters.startDate || ''}
                onChange={e => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date Filter */}
            <div className="filter-group">
              <label htmlFor="end-date-filter">To Date</label>
              <input
                type="date"
                id="end-date-filter"
                value={filters.endDate || ''}
                onChange={e => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="audit-log-loading">
          <div className="spinner"></div>
          <p>Loading audit log...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="audit-log-error">
          <p>{error}</p>
          <button onClick={loadAuditLog}>Try Again</button>
        </div>
      )}

      {/* Audit Log Table */}
      {!loading && !error && (
        <>
          {entries.length === 0 ? (
            <div className="no-entries">
              <Clock className="no-entries-icon" />
              <p>No audit log entries found</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="clear-filters-link">
                  Clear filters to see all entries
                </button>
              )}
            </div>
          ) : (
            <div className="audit-log-table-container">
              <table className="audit-log-table">
                <thead>
                  <tr>
                    <th className="col-timestamp">
                      <span className="th-content">
                        <Calendar className="th-icon" />
                        When
                      </span>
                    </th>
                    <th className="col-admin">
                      <span className="th-content">
                        <User className="th-icon" />
                        Administrator
                      </span>
                    </th>
                    <th className="col-scope">
                      <span className="th-content">
                        <Settings className="th-icon" />
                        Scope
                      </span>
                    </th>
                    <th className="col-change">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const timestamp = new Date(entry.updated_at);
                    const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });

                    return (
                      <tr key={index}>
                        <td className="col-timestamp">
                          <div className="timestamp-cell">
                            <span className="relative-time">{relativeTime}</span>
                            <span className="absolute-time">
                              {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="col-admin">
                          <span className="admin-name">
                            {entry.updated_by || <span className="unknown-admin">(Not recorded)</span>}
                          </span>
                        </td>
                        <td className="col-scope">
                          <span className={`scope-badge scope-${entry.scope.toLowerCase().replace(' ', '-')}`}>
                            {entry.scope}
                          </span>
                        </td>
                        <td className="col-change">
                          <div className="change-description">
                            {formatAuditEntry(entry)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Entry Count */}
          {entries.length > 0 && (
            <div className="audit-log-footer">
              <p>
                Showing {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                {hasActiveFilters && ' (filtered)'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLog;
