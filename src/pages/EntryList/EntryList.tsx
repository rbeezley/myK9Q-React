import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { getClassEntries, updateEntryCheckinStatus } from '../../services/entryService';
import { Entry } from '../../stores/entryStore';
import { Card, CardContent, Button, ArmbandBadge } from '../../components/ui';
import './EntryList.css';

type TabType = 'pending' | 'completed';

export const EntryList: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission } = usePermission();
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [classInfo, setClassInfo] = useState<{
    className: string;
    element: string;
    level: string;
    section: string;
  } | null>(null);
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, showContext]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-popup') && !target.closest('.checkin-status')) {
        setActiveStatusPopup(null);
        setPopupPosition(null);
      }
    };

    if (activeStatusPopup !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeStatusPopup]);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleStatusChange = async (entryId: number, status: NonNullable<Entry['checkinStatus']>) => {
    // Store original state for potential rollback
    const originalEntries = entries;
    
    try {
      console.log('Updating check-in status:', entryId, status);
      
      // Update local state immediately for better UX
      setEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { 
              ...entry, 
              checkedIn: status !== 'none',
              checkinStatus: status,
            } 
          : entry
      ));
      
      // Close the popup
      setActiveStatusPopup(null);
      setPopupPosition(null);
      
      // Make API call to update database
      if (status) {
        await updateEntryCheckinStatus(entryId, status);
      }
      console.log('Check-in status successfully saved to database');
      
    } catch (error) {
      console.error('Failed to update check-in status:', error);
      
      // Revert local state changes on error
      setEntries(originalEntries);
      
      // Show error message to user
      alert('Failed to update check-in status. Please try again.');
    }
  };

  const handleStatusClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      top: rect.bottom + 5,
      left: rect.left
    });
    setActiveStatusPopup(entryId);
  };

  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading entries for classId:', classId, 'licenseKey:', showContext.licenseKey);
      const classEntries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      console.log('Loaded entries:', classEntries);
      console.log('Check-in statuses:', classEntries.map(e => ({ id: e.id, armband: e.armband, checkinStatus: e.checkinStatus, checkedIn: e.checkedIn })));
      setEntries(classEntries);
      
      // Get class info from first entry
      if (classEntries.length > 0) {
        const firstEntry = classEntries[0];
        console.log('First entry:', firstEntry);
        setClassInfo({
          className: firstEntry.className,
          element: firstEntry.element || '',
          level: firstEntry.level || '',
          section: firstEntry.section || ''
        });
      }
    } catch (err) {
      console.error('Error loading entries:', err);
      console.error('Error details:', err);
      setError(`Failed to load entries: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const parseOrganizationData = (orgString: string) => {
    const parts = orgString.split(' ');
    return {
      organization: parts[0], // "AKC"
      activity_type: parts.slice(1).join(' ') // "Scent Work" (keep spaces)
    };
  };

  const getScoreSheetRoute = (entry: Entry): string => {
    const orgData = parseOrganizationData(showContext?.org || '');
    const _competition_type = showContext?.competition_type || 'Regular';
    const element = entry.element || '';
    const _level = entry.level || '';
    
    
    // Same routing logic as ClassList - now includes entry ID
    if (orgData.organization === 'AKC') {
      if (orgData.activity_type === 'Scent Work' || orgData.activity_type === 'ScentWork') {
        return `/scoresheet/akc-scent-work/${classId}/${entry.id}`;
      } else if (orgData.activity_type === 'FastCat' || orgData.activity_type === 'Fast Cat') {
        return `/scoresheet/akc-fastcat/${classId}/${entry.id}`;
      } else {
        return `/scoresheet/akc-scent-work/${classId}/${entry.id}`;
      }
    } else if (orgData.organization === 'UKC') {
      if (orgData.activity_type === 'Obedience' || element === 'Obedience') {
        return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
      } else if (element === 'Rally' || orgData.activity_type === 'Rally') {
        return `/scoresheet/ukc-rally/${classId}/${entry.id}`;
      } else if (orgData.activity_type === 'Nosework') {
        return `/scoresheet/asca-scent-detection/${classId}/${entry.id}`;
      } else {
        if (element === 'Obedience') {
          return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
        } else {
          return `/scoresheet/ukc-rally/${classId}/${entry.id}`;
        }
      }
    } else if (orgData.organization === 'ASCA') {
      return `/scoresheet/asca-scent-detection/${classId}/${entry.id}`;
    } else {
      // Default fallback
      if (element === 'Obedience') {
        return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
      } else if (element === 'Rally') {
        return `/scoresheet/ukc-rally/${classId}/${entry.id}`;
      } else {
        return `/scoresheet/ukc-obedience/${classId}/${entry.id}`;
      }
    }
  };

  const handleEntryClick = (entry: Entry) => {
    if (!hasPermission('canScore')) {
      alert('You do not have permission to score entries.');
      return;
    }
    
    const route = getScoreSheetRoute(entry);
    navigate(route);
  };

  const handleStartScoring = () => {
    if (!hasPermission('canScore')) {
      alert('You do not have permission to score entries.');
      return;
    }
    
    // Navigate to first unscored entry's scoresheet
    const unscored = entries.find(e => !e.isScored);
    if (unscored) {
      const route = getScoreSheetRoute(unscored);
      navigate(route);
    } else {
      alert('All entries have been scored.');
    }
  };

  if (isLoading) {
    return (
      <div className="entry-list-container">
        <div className="loading">Loading entries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entry-list-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const scoredCount = entries.filter(e => e.isScored).length;
  const totalCount = entries.length;
  const pendingEntries = entries.filter(e => !e.isScored);
  const completedEntries = entries.filter(e => e.isScored);
  
  const currentEntries = activeTab === 'pending' ? pendingEntries : completedEntries;

  return (
    <div className="entry-list-container">
      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {darkMode ? '☀️' : '🌙'}
      </button>
      
      <header className="entry-list-header">
        <Button variant="secondary" onClick={() => navigate(-1)} className="back-button">
          ← Back to Classes
        </Button>
        <div className="class-info">
          <h1>{classInfo?.element} {classInfo?.level}</h1>
          <div className="class-subtitle">
            <span className="section-info">{classInfo?.element} • {classInfo?.level} • SECTION {classInfo?.section}</span>
            <span className="progress">{scoredCount}/{totalCount} Scored</span>
          </div>
        </div>
        {hasPermission('canScore') && (
          <Button 
            variant="gradient"
            onClick={handleStartScoring}
            disabled={scoredCount === totalCount}
            className="continue-scoring-button"
          >
            Continue Scoring
          </Button>
        )}
      </header>

      <div className="status-tabs">
        <button 
          className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <span className="status-icon">⏳</span>
          Pending ({pendingEntries.length})
        </button>
        <button 
          className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <span className="status-icon">✓</span>
          Completed ({completedEntries.length})
        </button>
      </div>

      <div className="entry-list-content">
        {currentEntries.length === 0 ? (
          <div className="no-entries">
            <h2>No {activeTab} entries</h2>
            <p>{activeTab === 'pending' ? 'All entries have been scored.' : 'No entries have been scored yet.'}</p>
          </div>
        ) : (
          <div className="entries-grid">
            {currentEntries.map((entry) => (
              <Card 
                key={entry.id} 
                variant={entry.isScored ? 'scored' : 'unscored'}
                onClick={() => hasPermission('canScore') && handleEntryClick(entry)}
                className={`entry-card ${!entry.isScored ? `checkin-${(entry.checkinStatus || 'none').replace(' ', '-')}` : ''}`}
              >
                <ArmbandBadge number={entry.armband} />
                
                {!entry.isScored && (
                  <div 
                    className={`checkin-status ${(entry.checkinStatus || 'none').toLowerCase().replace(' ', '-')}`}
                    onClick={(e) => handleStatusClick(e, entry.id)}
                    title="Click to change check-in status"
                  >
                    {(() => {
                      const status = entry.checkinStatus || 'none';
                      switch(status) {
                        case 'none': return <><span className="status-icon">⚪</span> Not Set</>;
                        case 'checked-in': return <><span className="status-icon">✓</span> Checked-in</>;
                        case 'conflict': return <><span className="status-icon">⚠</span> Conflict</>;
                        case 'pulled': return <><span className="status-icon">✕</span> Pulled</>;
                        case 'at-gate': return <><span className="status-icon">▶</span> At Gate</>;
                        default: return status;
                      }
                    })()}
                  </div>
                )}
                
                <CardContent className="entry-content">
                  <div className="entry-info-compact">
                    <div className="dog-info">
                      <h3 className="dog-name">{entry.callName}</h3>
                      <p className="breed">{entry.breed}</p>
                    </div>
                    <div className="handler-info">
                      <span className="handler">Handler: {entry.handler}</span>
                      {entry.isScored && entry.resultText && (
                        <div className="result-inline">
                          <span className={`result-badge ${entry.resultText.toLowerCase()}`}>
                            {entry.resultText.toUpperCase()}
                          </span>
                          {entry.searchTime && (
                            <span className="time-badge">
                              {entry.searchTime}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Status Change Popup */}
      {activeStatusPopup !== null && popupPosition && (
        <div 
          className="status-popup"
          style={{
            position: 'fixed',
            top: popupPosition.top,
            left: popupPosition.left,
            zIndex: 1000
          }}
        >
          <div className="status-popup-content">
            <button 
              className="status-option status-none"
              onClick={() => handleStatusChange(activeStatusPopup, 'none')}
            >
              <span className="popup-icon">⚪</span> Not Set
            </button>
            <button 
              className="status-option status-checked-in"
              onClick={() => handleStatusChange(activeStatusPopup, 'checked-in')}
            >
              <span className="popup-icon">✓</span> Checked-in
            </button>
            <button 
              className="status-option status-conflict"
              onClick={() => handleStatusChange(activeStatusPopup, 'conflict')}
            >
              <span className="popup-icon">⚠</span> Conflict
            </button>
            <button 
              className="status-option status-pulled"
              onClick={() => handleStatusChange(activeStatusPopup, 'pulled')}
            >
              <span className="popup-icon">✕</span> Pulled
            </button>
            <button 
              className="status-option status-at-gate"
              onClick={() => handleStatusChange(activeStatusPopup, 'at-gate')}
            >
              <span className="popup-icon">▶</span> At Gate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};