/**
 * State Inspector Component
 *
 * Displays real-time Zustand store state with change history and diff viewing.
 * Only enabled in development mode.
 */

import React, { useState, useEffect } from 'react';
import developerModeService from '@/services/developerMode';
import { useSettingsStore } from '@/stores/settingsStore';
import { useEntryStore } from '@/stores/entryStore';
import { useAnnouncementStore } from '@/stores/announcementStore';
import { X, Eye, EyeOff, Download } from 'lucide-react';
import './shared-monitoring.css';

interface StateChange {
  store: string;
  action: string;
  timestamp: number;
  data?: unknown;
}

export const StateInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('settings');
  const [changes, setChanges] = useState<StateChange[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Subscribe to stores
  const settings = useSettingsStore();
  const entries = useEntryStore();
  const announcements = useAnnouncementStore();

  useEffect(() => {
    const config = developerModeService.getConfig();
    if (!config.enabled || !config.showStateInspector) {
      setIsOpen(false);
      return;
    }

    // Poll for state changes
    const interval = setInterval(() => {
      const stateChanges = developerModeService.getStateChanges();
      setChanges([...stateChanges].reverse()); // Most recent first
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const stores = {
    settings: settings,
    entries: {
      entries: entries.entries,
      currentEntry: entries.currentEntry,
      filters: entries.filters,
      currentPage: entries.currentPage,
      entriesPerPage: entries.entriesPerPage,
      totalEntries: entries.totalEntries,
    },
    announcements: {
      announcements: announcements.announcements,
      unreadCount: announcements.unreadCount,
    },
  };

  const handleExport = () => {
    const data = {
      stores,
      changes,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // eslint-disable-next-line react-hooks/purity
    a.download = `state-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!developerModeService.getConfig().enabled) {
    return null;
  }

  const currentState = stores[selectedStore as keyof typeof stores];

  return (
    <>
      {/* Toggle Button */}
      <button
        className="state-inspector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="State Inspector"
      >
        🔍 State
      </button>

      {/* Inspector Panel */}
      {isOpen && (
        <div className="state-inspector">
          <div className="state-inspector-header">
            <h3>State Inspector</h3>
            <div className="header-actions">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="icon-button"
                title={showDetails ? "Hide Details" : "Show Details"}
              >
                {showDetails ? <EyeOff size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} /> : <Eye size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />}
              </button>
              <button onClick={handleExport} className="icon-button" title="Export Snapshot">
                <Download size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              </button>
              <button onClick={() => setIsOpen(false)} className="icon-button">
                <X size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              </button>
            </div>
          </div>

          <div className="state-inspector-content">
            {/* Store Tabs */}
            <div className="store-tabs">
              <button
                className={selectedStore === 'settings' ? 'active' : ''}
                onClick={() => setSelectedStore('settings')}
              >
                Settings
              </button>
              <button
                className={selectedStore === 'entries' ? 'active' : ''}
                onClick={() => setSelectedStore('entries')}
              >
                Entries
              </button>
              <button
                className={selectedStore === 'announcements' ? 'active' : ''}
                onClick={() => setSelectedStore('announcements')}
              >
                Announcements
              </button>
            </div>

            {/* Current State */}
            <div className="current-state">
              <div className="section-title">Current State</div>
              <pre className="state-json">
                {JSON.stringify(currentState, null, 2)}
              </pre>
            </div>

            {/* Change History */}
            {showDetails && (
              <div className="change-history">
                <div className="section-title">
                  Change History ({changes.length})
                </div>
                <div className="change-list">
                  {changes.length === 0 ? (
                    <div className="empty-state">No state changes recorded</div>
                  ) : (
                    changes.map((change, idx) => (
                      <div key={`${change.timestamp}-${idx}`} className="change-item">
                        <div className="change-header">
                          <span className="change-store">[{change.store}]</span>
                          <span className="change-action">{change.action}</span>
                          <span className="change-time">{formatTime(change.timestamp)}</span>
                        </div>
                        {change.data !== undefined && (
                          <pre className="change-data">
                            {JSON.stringify(change.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
