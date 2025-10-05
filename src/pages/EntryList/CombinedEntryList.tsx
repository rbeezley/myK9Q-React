import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { getClassEntries, resetEntryScore, updateEntryCheckinStatus } from '../../services/entryService';
import { Entry } from '../../stores/entryStore';
import { HamburgerMenu, HeaderTicker } from '../../components/ui';
import { DogCard } from '../../components/DogCard';
import { CheckinStatusDialog } from '../../components/dialogs/CheckinStatusDialog';
import { Search, X, Clock, CheckCircle, ArrowUpDown, Calendar, Target, User, ChevronDown, Trophy, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import './EntryList.css';

type TabType = 'pending' | 'completed';
type SectionFilter = 'all' | 'A' | 'B';

export const CombinedEntryList: React.FC = () => {
  const { classIdA, classIdB } = useParams<{ classIdA: string; classIdB: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission } = usePermission();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [classInfo, setClassInfo] = useState<{
    className: string;
    element: string;
    level: string;
    trialDate?: string;
    trialNumber?: string;
    judgeName?: string;
    judgeNameB?: string;
    actualClassIdA?: number;
    actualClassIdB?: number;
    selfCheckin?: boolean;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'run' | 'armband' | 'placement' | 'section-armband' | 'manual'>('section-armband');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeResetMenu, setActiveResetMenu] = useState<number | null>(null);
  const [resetMenuPosition, setResetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{ show: boolean; entry: Entry | null }>({ show: false, entry: null });
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);

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


  const loadEntries = async () => {
    if (!classIdA || !classIdB || !showContext?.licenseKey) return;

    console.log('🔄 Loading combined entries for classes:', classIdA, classIdB);
    setIsLoading(true);
    setError(null);

    try {
      // Load entries from both classes
      const classIdsArray = [parseInt(classIdA), parseInt(classIdB)];
      const combinedEntries = await getClassEntries(classIdsArray, showContext.licenseKey);

      setEntries(combinedEntries);

      // Get class info from both classes
      if (combinedEntries.length > 0) {
        const firstEntry = combinedEntries[0];

        // Fetch class data for both classes
        const { data: classDataA } = await supabase
          .from('classes')
          .select('judge_name, self_checkin_enabled')
          .eq('id', parseInt(classIdA))
          .single();

        const { data: classDataB } = await supabase
          .from('classes')
          .select('judge_name')
          .eq('id', parseInt(classIdB))
          .single();

        const judgeNameA = classDataA?.judge_name || 'No Judge Assigned';
        const judgeNameB = classDataB?.judge_name || 'No Judge Assigned';

        setClassInfo({
          className: `${firstEntry.element} ${firstEntry.level} A & B`,
          element: firstEntry.element || '',
          level: firstEntry.level || '',
          trialDate: firstEntry.trialDate || '',
          trialNumber: firstEntry.trialNumber ? String(firstEntry.trialNumber) : '',
          judgeName: judgeNameA,
          judgeNameB: judgeNameB,
          actualClassIdA: parseInt(classIdA),
          actualClassIdB: parseInt(classIdB),
          selfCheckin: classDataA?.self_checkin_enabled ?? true
        });
      }
    } catch (err) {
      console.error('Error loading combined entries:', err);
      setError(`Failed to load entries: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  useEffect(() => {
    loadEntries();
  }, [classIdA, classIdB, showContext?.licenseKey]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter entries by section
  const sectionFilteredEntries = sectionFilter === 'all'
    ? entries
    : entries.filter(e => e.section === sectionFilter);

  // Rest of the filter and sort logic (similar to EntryList)
  const filteredEntries = sectionFilteredEntries.filter(entry => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.callName.toLowerCase().includes(searchLower) ||
        entry.handler.toLowerCase().includes(searchLower) ||
        entry.breed.toLowerCase().includes(searchLower) ||
        entry.armband.toString().includes(searchLower)
      );
    }
    return true;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
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
      await resetEntryScore(resetConfirmDialog.entry.id);

      // Update local state to move entry back to pending
      setEntries(prev => prev.map(entry =>
        entry.id === resetConfirmDialog.entry!.id
          ? {
              ...entry,
              isScored: false,
              inRing: false,
              score: undefined,
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

  const handleStatusChange = async (entryId: number, newStatus: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate') => {
    try {
      await updateEntryCheckinStatus(entryId, newStatus);

      // Update local state
      setEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, checkinStatus: newStatus as 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' }
          : entry
      ));

      setActiveStatusPopup(null);
    } catch (error) {
      console.error('Failed to update check-in status:', error);
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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

  if (isLoading) {
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

  if (error) {
    return (
      <div className="entry-list-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
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
              </div>
            </div>
          </div>
        </div>

        <button
          className={`icon-button ${refreshing ? 'rotating' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
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
          Pending ({pendingEntries.length})
        </button>
        <button
          className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle className="status-icon" size={16} />
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
              <DogCard
                key={entry.id}
                armband={entry.armband}
                callName={entry.callName}
                breed={entry.breed}
                handler={entry.handler}
                onClick={() => handleScoreClick(entry)}
                className={hasPermission('canScore') && !entry.isScored ? 'clickable' : ''}
                statusBorder={
                  entry.isScored ? 'scored' : // All scored entries get green border
                  entry.inRing ? 'none' :
                  (entry.checkinStatus === 'checked-in' ? 'checked-in' :
                   entry.checkinStatus === 'conflict' ? 'conflict' :
                   entry.checkinStatus === 'pulled' ? 'pulled' :
                   entry.checkinStatus === 'at-gate' ? 'at-gate' : 'none')
                }
                sectionBadge={entry.section as 'A' | 'B' | null}
                actionButton={
                  !entry.isScored ? (
                    <div
                      className={`status-badge checkin-status ${
                        entry.inRing ? 'in-ring' :
                        (entry.checkinStatus || 'none').toLowerCase().replace(' ', '-')
                      } ${
                        !hasPermission('canCheckInDogs') && !(classInfo?.selfCheckin ?? true) ? 'disabled' : ''
                      }`}
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
                          return <><span className="status-icon">▶</span> In Ring</>;
                        }
                        const status = entry.checkinStatus || 'none';
                        switch(status) {
                          case 'none': return <><span className="status-icon">●</span> No Status</>;
                          case 'checked-in': return <><span className="status-icon">✓</span> Checked-in</>;
                          case 'conflict': return <><span className="status-icon">!</span> Conflict</>;
                          case 'pulled': return <><span className="status-icon">✕</span> Pulled</>;
                          case 'at-gate': return <><span className="status-icon">★</span> At Gate</>;
                          default: return status;
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
                const entry = entries.find(e => e.id === activeResetMenu);
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
            const currentEntry = entries.find(e => e.id === activeStatusPopup);
            return currentEntry?.armband || 0;
          })(),
          callName: (() => {
            const currentEntry = entries.find(e => e.id === activeStatusPopup);
            return currentEntry?.callName || '';
          })(),
          handler: (() => {
            const currentEntry = entries.find(e => e.id === activeStatusPopup);
            return currentEntry?.handler || '';
          })()
        }}
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
