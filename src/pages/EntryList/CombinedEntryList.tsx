import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { HamburgerMenu, HeaderTicker, SyncIndicator, RefreshIndicator, ErrorState } from '../../components/ui';
import { DogCard } from '../../components/DogCard';
import { CheckinStatusDialog } from '../../components/dialogs/CheckinStatusDialog';
import { Search, X, Clock, CheckCircle, ArrowUpDown, Calendar, Target, User, ChevronDown, Trophy, RefreshCw, Circle, Check, AlertTriangle, XCircle, Star, Bell } from 'lucide-react';
import { Entry } from '../../stores/entryStore';
import { useEntryListData, useEntryListActions, useEntryListFilters, useEntryListSubscriptions } from './hooks';
import { formatTimeForDisplay } from '../../utils/timeUtils';
import './EntryList.css';

export const CombinedEntryList: React.FC = () => {
  const { classIdA, classIdB } = useParams<{ classIdA: string; classIdB: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission } = usePermission();

  // Data management using shared hook
  const {
    entries,
    classInfo,
    isRefreshing,
    fetchError,
    refresh
  } = useEntryListData({
    classIdA,
    classIdB
  });

  // Actions using shared hook
  const {
    handleStatusChange: handleStatusChangeHook,
    handleResetScore: handleResetScoreHook,
    isSyncing,
    hasError
  } = useEntryListActions(refresh);

  // Filters using shared hook (with section filter enabled)
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    sectionFilter,
    setSectionFilter,
    filteredEntries,
    entryCounts
  } = useEntryListFilters({
    entries,
    supportManualSort: false,
    supportSectionFilter: true
  });

  // Real-time subscriptions using shared hook
  const classIds = classIdA && classIdB ? [parseInt(classIdA), parseInt(classIdB)] : [];
  useEntryListSubscriptions({
    classIds,
    licenseKey: showContext?.licenseKey || '',
    onRefresh: refresh,
    enabled: classIds.length > 0
  });

  // Local UI state
  const [localEntries, setLocalEntries] = useState<Entry[]>([]);
  const [sortOrder, setSortOrder] = useState<'run' | 'armband' | 'placement' | 'section-armband'>('section-armband');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(true);
  const [activeResetMenu, setActiveResetMenu] = useState<number | null>(null);
  const [resetMenuPosition, setResetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{ show: boolean; entry: Entry | null }>({ show: false, entry: null });
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);

  // Sync local entries with fetched data
  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  // Initial load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Date formatting helper
  const formatTrialDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNumber = date.getDate();
    const yearNumber = date.getFullYear();

    return `${dayName}, ${monthName} ${dayNumber}, ${yearNumber}`;
  };

  // Apply section filter and sort
  const sectionFilteredEntries = sectionFilter === 'all'
    ? filteredEntries
    : filteredEntries.filter(e => e.section === sectionFilter);

  const sortedEntries = [...sectionFilteredEntries].sort((a, b) => {
    if (sortOrder === 'section-armband') {
      // Sort by section first, then armband
      if (a.section && b.section && a.section !== b.section) {
        return a.section.localeCompare(b.section);
      }
      return a.armband - b.armband;
    } else if (sortOrder === 'armband') {
      return a.armband - b.armband;
    } else if (sortOrder === 'placement') {
      // Sort by section, then placement
      if (a.section && b.section && a.section !== b.section) {
        return a.section.localeCompare(b.section);
      }
      if (a.placement === undefined && b.placement === undefined) return 0;
      if (a.placement === undefined) return 1;
      if (b.placement === undefined) return -1;
      return a.placement - b.placement;
    } else if (sortOrder === 'run') {
      return (a.exhibitorOrder || 0) - (b.exhibitorOrder || 0);
    }
    return 0;
  });

  const pendingEntries = sortedEntries.filter(e => !e.isScored);
  const completedEntries = sortedEntries.filter(e => e.isScored);
  const currentEntries = activeTab === 'pending' ? pendingEntries : completedEntries;

  // Reset score handlers
  const handleResetMenuClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setResetMenuPosition({
      top: rect.bottom + 4,
      left: rect.left
    });
    setActiveResetMenu(entryId);
  };

  const handleResetScore = (entry: Entry) => {
    setActiveResetMenu(null);
    setResetMenuPosition(null);
    setResetConfirmDialog({ show: true, entry });
  };

  const confirmResetScore = async () => {
    if (!resetConfirmDialog.entry) return;

    try {
      await handleResetScoreHook(resetConfirmDialog.entry.id);

      // Update local state to move entry back to pending
      setLocalEntries(prev => prev.map(entry =>
        entry.id === resetConfirmDialog.entry!.id
          ? {
              ...entry,
              isScored: false,
              inRing: false,
              placement: undefined,
              searchTime: undefined,
              resultText: undefined
            }
          : entry
      ));

      // Switch to pending tab to show the reset entry
      setActiveTab('pending');
    } catch (error) {
      console.error('Failed to reset score:', error);
      alert(`Failed to reset score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setResetConfirmDialog({ show: false, entry: null });
  };

  const cancelResetScore = () => {
    setResetConfirmDialog({ show: false, entry: null });
  };

  // Check-in status handlers
  const handleStatusClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveStatusPopup(entryId);
  };

  const handleStatusChange = async (entryId: number, newStatus: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'come-to-gate') => {
    // Close popup first
    setActiveStatusPopup(null);

    // Optimistic update: update local state immediately
    setLocalEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, checkinStatus: newStatus }
        : entry
    ));

    // Sync with server (hook handles rollback on error)
    try {
      await handleStatusChangeHook(entryId, newStatus);
    } catch (error) {
      console.error('Status change failed:', error);
      // Refresh to get correct state
      refresh();
    }
  };

  // Organization parsing
  const parseOrganizationData = (orgString: string) => {
    if (!orgString || orgString.trim() === '') {
      return {
        organization: 'AKC',
        activity_type: 'Scent Work'
      };
    }

    const parts = orgString.split(' ');
    return {
      organization: parts[0],
      activity_type: parts.slice(1).join(' '),
    };
  };

  // Score click handler
  const handleScoreClick = (entry: Entry) => {
    if (entry.isScored) {
      return;
    }

    if (!hasPermission('canScore')) {
      alert('You do not have permission to score entries.');
      return;
    }

    // Determine the paired class ID (the class the entry does NOT belong to)
    const pairedClassId = entry.classId === parseInt(classIdA!)
      ? parseInt(classIdB!)
      : parseInt(classIdA!);

    // Route to single-class scoresheet using the entry's actual class_id
    // Pass pairedClassId via location state so scoresheet knows to update both classes
    const orgData = parseOrganizationData(showContext?.org || '');
    const element = entry.element || '';

    const navigationState = { pairedClassId };

    if (orgData.organization === 'AKC') {
      if (orgData.activity_type === 'Scent Work' || orgData.activity_type === 'ScentWork') {
        navigate(`/scoresheet/akc-scent-work/${entry.classId}/${entry.id}`, { state: navigationState });
      } else if (orgData.activity_type === 'FastCat' || orgData.activity_type === 'Fast Cat') {
        navigate(`/scoresheet/akc-fastcat/${entry.classId}/${entry.id}`, { state: navigationState });
      }
    } else if (orgData.organization === 'UKC') {
      if (element === 'Obedience') {
        navigate(`/scoresheet/ukc-obedience/${entry.classId}/${entry.id}`, { state: navigationState });
      } else if (element === 'Rally') {
        navigate(`/scoresheet/ukc-rally/${entry.classId}/${entry.id}`, { state: navigationState });
      }
    }
  };

  // Loading state
  if (!entries.length && !fetchError) {
    return (
      <div className="entry-list-container">
        <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading combined entries...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="entry-list-container">
        <ErrorState
          message={`Failed to load entries: ${fetchError.message || 'Please check your connection and try again.'}`}
          onRetry={refresh}
          isRetrying={isRefreshing}
        />
      </div>
    );
  }

  return (
    <div className={`entry-list-container app-container${isLoaded ? ' loaded' : ''}`} data-loaded={isLoaded}>
      <header className="entry-list-header">
        <HamburgerMenu
          backNavigation={{
            label: "Back to Classes",
            action: () => navigate(-1)
          }}
          currentPage="entries"
        />
        <div className="class-info">
          <h1>
            {classInfo?.className?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
          <div className="class-subtitle">
            <div className="trial-info-row">
              <div className="trial-details-group">
                {classInfo?.trialDate && classInfo.trialDate !== '' && (
                  <span className="trial-detail">
                    <Calendar size={14} /> {formatTrialDate(classInfo.trialDate)}
                  </span>
                )}
                {classInfo?.trialNumber && classInfo.trialNumber !== '' && classInfo.trialNumber !== '0' && (
                  <span className="trial-detail"><Target size={14} /> Trial {classInfo.trialNumber}</span>
                )}
                {classInfo?.judgeName && classInfo.judgeName !== 'No Judge Assigned' && classInfo.judgeName !== '' && (
                  <span className="trial-detail"><User size={14} /> {classInfo.judgeName}</span>
                )}
                {classInfo?.judgeNameB && classInfo.judgeNameB !== classInfo.judgeName && classInfo.judgeNameB !== 'No Judge Assigned' && (
                  <span className="trial-detail judge-warning">⚠️ Section B: {classInfo.judgeNameB}</span>
                )}
                {(classInfo?.timeLimit || classInfo?.timeLimit2 || classInfo?.timeLimit3) && (
                  <span className="trial-detail time-limits">
                    <Clock size={14} />
                    {classInfo.areas && classInfo.areas > 1 ? (
                      // Multi-area: show all time limits
                      <>
                        {classInfo.timeLimit && <span className="time-limit-badge">A1: {classInfo.timeLimit}</span>}
                        {classInfo.timeLimit2 && <span className="time-limit-badge">A2: {classInfo.timeLimit2}</span>}
                        {classInfo.timeLimit3 && <span className="time-limit-badge">A3: {classInfo.timeLimit3}</span>}
                      </>
                    ) : (
                      // Single area: just show the time
                      <>{classInfo.timeLimit}</>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="header-buttons">
          {/* Background refresh indicator */}
          {isRefreshing && <RefreshIndicator isRefreshing={isRefreshing} />}

          {/* Sync indicator for optimistic updates */}
          {isSyncing && (
            <SyncIndicator
              status="syncing"
              compact
            />
          )}
          {hasError && (
            <SyncIndicator
              status="error"
              compact
              errorMessage="Sync failed"
            />
          )}

          <button
            className={`icon-button ${isRefreshing ? 'rotating' : ''}`}
            onClick={() => refresh()}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </header>

      <HeaderTicker />

      {/* Search and Sort Header */}
      <div className="search-controls-header">
        <button
          className={`search-toggle-icon ${!isSearchCollapsed ? 'active' : ''}`}
          onClick={() => setIsSearchCollapsed(!isSearchCollapsed)}
          aria-label={isSearchCollapsed ? "Show search and sort options" : "Hide search and sort options"}
          title={isSearchCollapsed ? "Show search and sort options" : "Hide search and sort options"}
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        <span className="search-controls-label">
          {searchTerm ? `Found ${filteredEntries.length} of ${entries.length} entries` : 'Search & Sort'}
        </span>
      </div>

      {searchTerm && (
        <div className="search-results-header">
          <div className="search-results-summary">
            {filteredEntries.length} of {entries.length} entries
          </div>
        </div>
      )}

      <div className={`search-sort-container ${isSearchCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search dog name, handler, breed, or armband..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-full"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="sort-controls">
          <button
            className={`sort-btn ${sortOrder === 'section-armband' ? 'active' : ''}`}
            onClick={() => setSortOrder('section-armband')}
          >
            <ArrowUpDown size={16} />
            Section & Armband
          </button>
          <button
            className={`sort-btn ${sortOrder === 'run' ? 'active' : ''}`}
            onClick={() => setSortOrder('run')}
          >
            <Clock size={16} />
            Run Order
          </button>
          <button
            className={`sort-btn ${sortOrder === 'armband' ? 'active' : ''}`}
            onClick={() => setSortOrder('armband')}
          >
            <ArrowUpDown size={16} />
            Armband
          </button>
          <button
            className={`sort-btn ${sortOrder === 'placement' ? 'active' : ''}`}
            onClick={() => setSortOrder('placement')}
          >
            <Trophy size={16} />
            Placement
          </button>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className="section-filter-tabs">
        <button
          className={`section-tab ${sectionFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSectionFilter('all')}
        >
          All Sections ({entries.length})
        </button>
        <button
          className={`section-tab ${sectionFilter === 'A' ? 'active' : ''}`}
          onClick={() => setSectionFilter('A')}
        >
          Section A ({entries.filter(e => e.section === 'A').length})
        </button>
        <button
          className={`section-tab ${sectionFilter === 'B' ? 'active' : ''}`}
          onClick={() => setSectionFilter('B')}
        >
          Section B ({entries.filter(e => e.section === 'B').length})
        </button>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        <button
          className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock className="status-icon" size={16} />
          Pending ({entryCounts.pending})
        </button>
        <button
          className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle className="status-icon" size={16} />
          Completed ({entryCounts.completed})
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
              <DogCard
                key={entry.id}
                armband={entry.armband}
                callName={entry.callName}
                breed={entry.breed}
                handler={entry.handler}
                onClick={() => handleScoreClick(entry)}
                className={hasPermission('canScore') && !entry.isScored ? 'clickable' : ''}
                statusBorder={
                  entry.isScored ? (
                    // For scored entries, use result status color
                    (() => {
                      const result = (entry.resultText || '').toLowerCase();
                      if (result === 'q' || result === 'qualified') return 'result-qualified';
                      if (result === 'nq' || result === 'non-qualifying') return 'result-nq';
                      if (result === 'ex' || result === 'excused') return 'result-ex';
                      if (result === 'abs' || result === 'absent') return 'result-abs';
                      if (result === 'wd' || result === 'withdrawn') return 'result-wd';
                      return 'scored'; // Fallback to generic scored
                    })()
                  ) :
                  entry.inRing ? 'none' :
                  (entry.checkinStatus === 'checked-in' ? 'checked-in' :
                   entry.checkinStatus === 'conflict' ? 'conflict' :
                   entry.checkinStatus === 'pulled' ? 'pulled' :
                   entry.checkinStatus === 'at-gate' ? 'at-gate' : 'none')
                }
                sectionBadge={entry.section as 'A' | 'B' | null}
                resultBadges={
                  entry.isScored ? (
                    // Check if this is a nationals show using show type from context
                    showContext?.competition_type?.toLowerCase().includes('national') ? (
                      <div className="nationals-scoresheet-improved">
                        {/* Header Row: Placement, Time, and Result badges */}
                        <div className="nationals-header-row">
                          {entry.placement && (
                            <span className="placement-badge">
                              {entry.placement === 1 ? '1st' : entry.placement === 2 ? '2nd' : entry.placement === 3 ? '3rd' : `${entry.placement}th`}
                            </span>
                          )}
                          <span className="time-badge">{formatTimeForDisplay(entry.searchTime || null)}</span>
                          <span className={`result-badge ${(entry.resultText || '').toLowerCase()}`}>
                            {(() => {
                              const result = (entry.resultText || '').toLowerCase();
                              if (result === 'q' || result === 'qualified') return 'Q';
                              if (result === 'nq' || result === 'non-qualifying') return 'NQ';
                              if (result === 'abs' || result === 'absent' || result === 'e') return 'ABS';
                              if (result === 'ex' || result === 'excused') return 'EX';
                              if (result === 'wd' || result === 'withdrawn') return 'WD';
                              return entry.resultText || 'N/A';
                            })()}
                          </span>
                        </div>

                        {/* Stats Grid: 2x2 for Calls and Faults */}
                        <div className="nationals-stats-grid">
                          <div className="nationals-stat-item">
                            <span className="nationals-stat-label">Correct</span>
                            <span className="nationals-stat-value">{entry.correctFinds || 0}</span>
                          </div>
                          <div className="nationals-stat-item">
                            <span className="nationals-stat-label">Incorrect</span>
                            <span className="nationals-stat-value">{entry.incorrectFinds || 0}</span>
                          </div>
                          <div className="nationals-stat-item">
                            <span className="nationals-stat-label">Faults</span>
                            <span className="nationals-stat-value">{entry.faultCount || 0}</span>
                          </div>
                          <div className="nationals-stat-item">
                            <span className="nationals-stat-label">No Finish</span>
                            <span className="nationals-stat-value">{entry.noFinishCount || 0}</span>
                          </div>
                        </div>

                        {/* Total Points Row */}
                        <div className="nationals-total-points-improved">
                          <span className="nationals-total-label">Total Points</span>
                          <span className={`nationals-total-value ${(entry.totalPoints || 0) >= 0 ? 'positive' : 'negative'}`}>
                            {(entry.totalPoints || 0) >= 0 ? '+' : ''}{entry.totalPoints || 0}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Regular (non-nationals) scoring display
                      entry.searchTime ? (
                        <div className="regular-scoresheet-single-line">
                          {/* Single line: Placement, Result, Time, Faults */}
                          {(() => {
                            const resultLower = (entry.resultText || '').toLowerCase();
                            const isNonQualifying = resultLower.includes('nq') || resultLower.includes('non-qualifying') ||
                                                   resultLower.includes('abs') || resultLower.includes('absent') ||
                                                   resultLower.includes('ex') || resultLower.includes('excused') ||
                                                   resultLower.includes('wd') || resultLower.includes('withdrawn');

                            // Show placement only if qualified (placement exists and result is qualified)
                            if (entry.placement && !isNonQualifying && entry.placement < 100) {
                              return (
                                <span className="placement-badge">
                                  {entry.placement === 1 ? '1st' : entry.placement === 2 ? '2nd' : entry.placement === 3 ? '3rd' : `${entry.placement}th`}
                                </span>
                              );
                            }
                            return null;
                          })()}

                          {entry.resultText && (
                            <span className={`result-badge ${entry.resultText.toLowerCase()}`}>
                              {(() => {
                                const result = entry.resultText.toLowerCase();
                                if (result === 'q' || result === 'qualified') return 'Q';
                                if (result === 'nq' || result === 'non-qualifying') return 'NQ';
                                if (result === 'abs' || result === 'absent' || result === 'e') return 'ABS';
                                if (result === 'ex' || result === 'excused') return 'EX';
                                if (result === 'wd' || result === 'withdrawn') return 'WD';
                                return entry.resultText;
                              })()}
                            </span>
                          )}

                          <span className="time-badge">{formatTimeForDisplay(entry.searchTime || null)}</span>

                          <span className="faults-badge-subtle">{entry.faultCount || 0}&nbsp;{entry.faultCount === 1 ? 'Fault' : 'Faults'}</span>
                        </div>
                      ) : undefined
                    )
                  ) : undefined
                }
                actionButton={
                  !entry.isScored ? (
                    <div
                      className={`status-badge checkin-status ${
                        entry.inRing ? 'in-ring' :
                        (entry.checkinStatus || 'none').toLowerCase().replace(' ', '-')
                      } ${
                        !hasPermission('canCheckInDogs') && !(classInfo?.selfCheckin ?? true) ? 'disabled' : ''
                      }`}
                      style={{ textTransform: 'none' }}
                      onClick={(e) => {
                        const canCheckIn = hasPermission('canCheckInDogs');
                        const isSelfCheckinEnabled = classInfo?.selfCheckin ?? true;

                        if (canCheckIn || isSelfCheckinEnabled) {
                          handleStatusClick(e, entry.id);
                        } else {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      title={
                        (!hasPermission('canCheckInDogs') && !(classInfo?.selfCheckin ?? true))
                          ? "Self check-in disabled"
                          : "Tap to change status"
                      }
                    >
                      {(() => {
                        if (entry.inRing) {
                          return <><span className="status-icon">▶</span><span style={{ textTransform: 'none' }}> In Ring</span></>;
                        }
                        const status = entry.checkinStatus || 'none';
                        switch(status) {
                          case 'none': return <><Circle className="status-icon" size={12} style={{ width: '12px', height: '12px', flexShrink: 0, marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} /><span style={{ textTransform: 'none' }}>No Status</span></>;
                          case 'checked-in': return <><Check className="status-icon" size={12} style={{ width: '12px', height: '12px', flexShrink: 0, marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} /><span style={{ textTransform: 'none' }}>Checked-in</span></>;
                          case 'conflict': return <><AlertTriangle className="status-icon" size={12} style={{ width: '12px', height: '12px', flexShrink: 0, marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} /><span style={{ textTransform: 'none' }}>Conflict</span></>;
                          case 'pulled': return <><XCircle className="status-icon" size={12} style={{ width: '12px', height: '12px', flexShrink: 0, marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} /><span style={{ textTransform: 'none' }}>Pulled</span></>;
                          case 'at-gate': return <><Star className="status-icon" size={12} style={{ width: '12px', height: '12px', flexShrink: 0, marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} /><span style={{ textTransform: 'none' }}>At Gate</span></>;
                          case 'come-to-gate': return <><Bell className="status-icon" size={12} style={{ width: '12px', height: '12px', flexShrink: 0, marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} /><span style={{ textTransform: 'none' }}>Come to Gate</span></>;
                          default: return <span style={{ textTransform: 'none' }}>{status}</span>;
                        }
                      })()}
                    </div>
                  ) : (
                    <button
                      className="reset-button"
                      onClick={(e) => handleResetMenuClick(e, entry.id)}
                      title="Reset score"
                    >
                      ⋯
                    </button>
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Reset Menu Popup */}
      {activeResetMenu !== null && resetMenuPosition && (
        <>
          <div className="reset-menu-overlay" onClick={() => {
            setActiveResetMenu(null);
            setResetMenuPosition(null);
          }}></div>
          <div
            className="reset-menu"
            style={{
              position: 'fixed',
              top: `${resetMenuPosition.top}px`,
              left: `${resetMenuPosition.left}px`,
            }}
          >
            <div
              className="reset-option"
              onClick={() => {
                const entry = localEntries.find(e => e.id === activeResetMenu);
                if (entry) handleResetScore(entry);
              }}
            >
              🔄 Reset Score
            </div>
          </div>
        </>
      )}

      {/* Check-in Status Dialog */}
      <CheckinStatusDialog
        isOpen={activeStatusPopup !== null}
        onClose={() => {
          setActiveStatusPopup(null);
        }}
        onStatusChange={(status) => {
          if (activeStatusPopup !== null) {
            handleStatusChange(activeStatusPopup, status);
          }
        }}
        dogInfo={{
          armband: (() => {
            const currentEntry = localEntries.find(e => e.id === activeStatusPopup);
            return currentEntry?.armband || 0;
          })(),
          callName: (() => {
            const currentEntry = localEntries.find(e => e.id === activeStatusPopup);
            return currentEntry?.callName || '';
          })(),
          handler: (() => {
            const currentEntry = localEntries.find(e => e.id === activeStatusPopup);
            return currentEntry?.handler || '';
          })()
        }}
        showDescriptions={true}
      />

      {/* Reset Confirmation Dialog */}
      {resetConfirmDialog.show && resetConfirmDialog.entry && (
        <div className="reset-dialog-overlay">
          <div className="reset-dialog">
            <h3>Reset Score</h3>
            <p>
              Are you sure you want to reset the score for <strong>{resetConfirmDialog.entry.callName}</strong> ({resetConfirmDialog.entry.armband})?
            </p>
            <p className="reset-dialog-warning">
              This will remove their current score and move them back to the pending list.
            </p>
            <div className="reset-dialog-buttons">
              <button className="reset-dialog-cancel" onClick={cancelResetScore}>
                Cancel
              </button>
              <button className="reset-dialog-confirm" onClick={confirmResetScore}>
                Reset Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
