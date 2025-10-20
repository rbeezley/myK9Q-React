import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { usePrefetch } from '@/hooks/usePrefetch';
import { HamburgerMenu, HeaderTicker, TrialDateBadge, SyncIndicator, RefreshIndicator, ErrorState } from '../../components/ui';
import { CheckinStatusDialog } from '../../components/dialogs/CheckinStatusDialog';
import { SortableEntryCard } from './SortableEntryCard';
import { Search, X, Clock, CheckCircle, ArrowUpDown, GripVertical, Target, User, ChevronDown, Trophy, RefreshCw, ClipboardCheck, Printer } from 'lucide-react';
import { parseOrganizationData } from '../../utils/organizationUtils';
import { generateCheckInSheet, generateResultsSheet, ReportClassInfo } from '../../services/reportService';
import { getScoresheetRoute } from '../../services/scoresheetRouter';
import { updateExhibitorOrder, markInRing } from '../../services/entryService';
import { preloadScoresheetByType } from '../../utils/scoresheetPreloader';
import { Entry } from '../../stores/entryStore';
import { useEntryListData, useEntryListActions, useEntryListSubscriptions } from './hooks';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import './EntryList.css';

type TabType = 'pending' | 'completed';

export const EntryList: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { showContext, role } = useAuth();
  const { hasPermission } = usePermission();
  const { prefetch } = usePrefetch();

  // Data management using shared hook
  const {
    entries,
    classInfo,
    isRefreshing,
    fetchError,
    refresh
  } = useEntryListData({
    classId
  });

  // Actions using shared hook
  const {
    handleStatusChange: handleStatusChangeHook,
    handleResetScore: handleResetScoreHook,
    isSyncing,
    hasError
  } = useEntryListActions(refresh);

  // Real-time subscriptions using shared hook
  const actualClassId = classInfo?.actualClassId;
  const classIds = actualClassId ? [actualClassId] : [];
  useEntryListSubscriptions({
    classIds,
    licenseKey: showContext?.licenseKey || '',
    onRefresh: refresh,
    enabled: classIds.length > 0
  });

  // Local state for UI and features unique to EntryList
  const [localEntries, setLocalEntries] = useState<Entry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  const [_popupPosition, _setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeResetMenu, setActiveResetMenu] = useState<number | null>(null);
  const [resetMenuPosition, setResetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{ show: boolean; entry: Entry | null }>({ show: false, entry: null });
  const [selfCheckinDisabledDialog, setSelfCheckinDisabledDialog] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'run' | 'armband' | 'placement' | 'manual'>('run');
  const [isDragMode, setIsDragMode] = useState(false);
  const [manualOrder, setManualOrder] = useState<Entry[]>([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(true);
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  // Sync local entries with fetched data
  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - Updates database for persistent reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = currentEntries.findIndex(entry => entry.id === active.id);
      const newIndex = currentEntries.findIndex(entry => entry.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Create new reordered array
        const reorderedCurrentEntries = arrayMove(currentEntries, oldIndex, newIndex);

        // Update local state immediately for smooth UX
        const otherEntries = localEntries.filter(entry => !currentEntries.find(ce => ce.id === entry.id));
        const newAllEntries = [...otherEntries, ...reorderedCurrentEntries];
        setLocalEntries(newAllEntries);
        setManualOrder(reorderedCurrentEntries);
        setSortOrder('manual');

        // Update database with new exhibitor_order values
        setIsUpdatingOrder(true);
        try {
          await updateExhibitorOrder(reorderedCurrentEntries);

          // Update local entries with new exhibitor_order values
          const updatedEntries = newAllEntries.map(entry => {
            const reorderedIndex = reorderedCurrentEntries.findIndex(re => re.id === entry.id);
            if (reorderedIndex !== -1) {
              return { ...entry, exhibitorOrder: reorderedIndex + 1 };
            }
            return entry;
          });
          setLocalEntries(updatedEntries);

          console.log('✅ Successfully updated run order in database');
        } catch (error) {
          console.error('❌ Failed to update run order in database:', error);
        } finally {
          setIsUpdatingOrder(false);
        }
      }
    }
  };

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.reset-menu') && !target.closest('.reset-menu-button')) {
        setActiveResetMenu(null);
        setResetMenuPosition(null);
      }
    };

    if (activeResetMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeResetMenu]);

  // Set loaded state after initial render to enable transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  const handleStatusChange = async (entryId: number, status: NonNullable<Entry['checkinStatus']>) => {
    // Close the popup first to prevent multiple clicks
    setActiveStatusPopup(null);
    _setPopupPosition(null);

    // Optimistic update: update local state immediately
    setLocalEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? {
            ...entry,
            checkedIn: status !== 'none',
            checkinStatus: status,
            inRing: false,
          }
        : entry
    ));

    // Sync with server (hook handles retry and rollback)
    try {
      await handleStatusChangeHook(entryId, status);
    } catch (error) {
      console.error('Status change failed:', error);
      // Refresh to get correct state
      refresh();
    }
  };

  const handleStatusClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    // Check if exhibitor can check themselves in
    const _canCheckIn = hasPermission('canCheckInDogs');
    const isSelfCheckinEnabled = classInfo?.selfCheckin ?? true;
    const userRole = role;

    // If user is an exhibitor and self check-in is disabled, prevent action
    if (userRole === 'exhibitor' && !isSelfCheckinEnabled) {
      setSelfCheckinDisabledDialog(true);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    _setPopupPosition({
      top: rect.bottom + 5,
      left: rect.left
    });
    setActiveStatusPopup(entryId);

    return false;
  };

  // Refresh handler
  const handleRefresh = async () => {
    await refresh();
  };

  // Print report handlers
  const handlePrintCheckIn = () => {
    if (!classInfo) return;

    const orgData = parseOrganizationData(showContext?.org || '');
    const reportClassInfo: ReportClassInfo = {
      className: classInfo.className,
      element: classInfo.element,
      level: classInfo.level,
      section: classInfo.section || '',
      trialDate: classInfo.trialDate || '',
      trialNumber: classInfo.trialNumber || '',
      judgeName: classInfo.judgeName || 'TBD',
      organization: orgData.organization,
      activityType: orgData.activity_type
    };

    generateCheckInSheet(reportClassInfo, localEntries);
    setShowPrintMenu(false);
  };

  const handlePrintResults = () => {
    if (!classInfo) return;

    const orgData = parseOrganizationData(showContext?.org || '');
    const reportClassInfo: ReportClassInfo = {
      className: classInfo.className,
      element: classInfo.element,
      level: classInfo.level,
      section: classInfo.section || '',
      trialDate: classInfo.trialDate || '',
      trialNumber: classInfo.trialNumber || '',
      judgeName: classInfo.judgeName || 'TBD',
      organization: orgData.organization,
      activityType: orgData.activity_type
    };

    generateResultsSheet(reportClassInfo, localEntries);
    setShowPrintMenu(false);
  };

  const getScoreSheetRoute = (entry: Entry): string => {
    return getScoresheetRoute({
      org: showContext?.org || '',
      element: entry.element || '',
      level: entry.level || '',
      classId: Number(classId),
      entryId: entry.id,
      competition_type: showContext?.competition_type || 'Regular'
    });
  };

  // Clear all dogs in ring for this class, then set the specific dog
  const setDogInRingStatus = async (dogId: number, inRing: boolean) => {
    try {
      if (inRing) {
        const currentDog = localEntries.find(entry => entry.id === dogId);
        if (!currentDog?.inRing) {
          const otherEntries = localEntries.filter(entry => entry.id !== dogId && entry.inRing);
          if (otherEntries.length > 0) {
            await Promise.all(
              otherEntries.map(entry => markInRing(entry.id, false))
            );
          }
        }
      }

      const currentDog = localEntries.find(entry => entry.id === dogId);
      if (currentDog?.inRing !== inRing) {
        await markInRing(dogId, inRing);
      }
      return true;
    } catch (error) {
      console.error('Error setting dog ring status:', error);
      return false;
    }
  };


  const handleEntryClick = async (entry: Entry) => {
    if (entry.isScored) {
      return;
    }

    if (!hasPermission('canScore')) {
      alert('You do not have permission to score entries.');
      return;
    }

    // Set dog status to in-ring when scoresheet opens
    if (entry.id && !entry.isScored) {
      const success = await setDogInRingStatus(entry.id, true);
      if (success) {
        setLocalEntries(prev => prev.map(e =>
          e.id === entry.id ? { ...e, inRing: true } : e
        ));
      }
    }

    const route = getScoreSheetRoute(entry);
    navigate(route);
  };

  const handleResetMenuClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setResetMenuPosition({
      top: rect.bottom + 5,
      left: rect.left - 100
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
              resultText: '',
              searchTime: '',
              faultCount: 0,
              placement: undefined,
              inRing: false
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

  // Filter and sort entries (memoized for performance)
  const filteredEntries = useMemo(() => {
    return localEntries
      .filter(entry => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          entry.callName.toLowerCase().includes(term) ||
          entry.handler.toLowerCase().includes(term) ||
          entry.breed.toLowerCase().includes(term) ||
          entry.armband.toString().includes(term)
        );
      })
      .sort((a, b) => {
        // PRIORITY 1: In-ring dogs ALWAYS come first
        if (a.inRing && !b.inRing) return -1;
        if (!a.inRing && b.inRing) return 1;

        // PRIORITY 2: Apply normal sorting for dogs not in ring
        if (sortOrder === 'manual') {
          const aIndex = manualOrder.findIndex(entry => entry.id === a.id);
          const bIndex = manualOrder.findIndex(entry => entry.id === b.id);
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          return a.armband - b.armband;
        }

        if (sortOrder === 'run') {
          const aOrder = a.exhibitorOrder || a.armband;
          const bOrder = b.exhibitorOrder || b.armband;
          return aOrder - bOrder;
        } else if (sortOrder === 'placement') {
          const aPlacement = a.placement || 999;
          const bPlacement = b.placement || 999;
          if (aPlacement !== bPlacement) {
            return aPlacement - bPlacement;
          }
          return a.armband - b.armband;
        } else {
          return a.armband - b.armband;
        }
      });
  }, [localEntries, searchTerm, sortOrder, manualOrder]);

  const pendingEntries = useMemo(() => filteredEntries.filter(e => !e.isScored), [filteredEntries]);
  const completedEntries = useMemo(() => filteredEntries.filter(e => e.isScored), [filteredEntries]);

  const currentEntries = activeTab === 'pending' ? pendingEntries : completedEntries;

  // Prefetch scoresheet data when hovering/touching entry card
  const handleEntryPrefetch = useCallback((entry: Entry) => {
    if (entry.isScored || !showContext?.org) return;

    const route = getScoreSheetRoute(entry);

    // Preload scoresheet JavaScript bundle (parallel to data prefetch)
    preloadScoresheetByType(showContext.org, entry.element || '');

    // Prefetch current entry (high priority)
    prefetch(
      `scoresheet-${entry.id}`,
      async () => {
        // Prefetch any scoresheet-specific data here
        // For now, just cache the route info
        console.log('📡 Prefetched scoresheet route:', entry.id, route);
        return { entryId: entry.id, route, entry };
      },
      {
        ttl: 30, // 30 seconds cache (scoring data changes frequently)
        priority: 3 // High priority - likely next action
      }
    );

    // Sequential prefetch: Also prefetch next 2-3 entries in the list
    const currentIndex = pendingEntries.findIndex(e => e.id === entry.id);
    if (currentIndex !== -1) {
      // Prefetch next 2 entries with lower priority
      const nextEntries = pendingEntries.slice(currentIndex + 1, currentIndex + 3);
      nextEntries.forEach((nextEntry, offset) => {
        const nextRoute = getScoreSheetRoute(nextEntry);
        prefetch(
          `scoresheet-${nextEntry.id}`,
          async () => {
            console.log('📡 Prefetched next entry route:', nextEntry.id, nextRoute);
            return { entryId: nextEntry.id, route: nextRoute, entry: nextEntry };
          },
          {
            ttl: 30,
            priority: 2 - offset // Priority 2 for next entry, 1 for entry after
          }
        );
      });
    }
  }, [showContext?.org, prefetch, pendingEntries, getScoreSheetRoute]);

  // Early returns AFTER all hooks
  if (!entries.length && !fetchError) {
    return (
      <div className="entry-list-container">
        <div className="loading">Loading entries...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="entry-list-container">
        <ErrorState
          message={`Failed to load entries: ${fetchError.message || 'Please check your connection and try again.'}`}
          onRetry={handleRefresh}
          isRetrying={isRefreshing}
        />
      </div>
    );
  }

  // Helper function to get status badge based on class status
  const getStatusBadge = () => {
    const status = classInfo?.classStatus;

    if (status === 'in_progress') {
      return { text: 'IN PROGRESS', className: 'status-in-progress' };
    } else if (status === 'briefing') {
      return { text: 'BRIEFING NOW', className: 'status-briefing' };
    } else if (status === 'start_time') {
      return { text: 'UPCOMING', className: 'status-upcoming' };
    } else if (status === 'setup') {
      return { text: 'UPCOMING', className: 'status-upcoming' };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

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
          <div className="class-title-row">
            <h1>
              {classInfo?.className?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
            {statusBadge && (
              <span className={`class-status-badge ${statusBadge.className}`}>
                {statusBadge.text}
              </span>
            )}
          </div>
          <div className="class-subtitle">
            <div className="trial-info-row">
              <div className="trial-details-group">
                {classInfo?.trialDate && classInfo.trialDate !== '' && (
                  <TrialDateBadge date={classInfo.trialDate} />
                )}
                {classInfo?.trialNumber && classInfo.trialNumber !== '' && classInfo.trialNumber !== '0' && (
                  <span className="trial-detail"><Target size={14} /> Trial {classInfo.trialNumber}</span>
                )}
                {classInfo?.judgeName && classInfo.judgeName !== 'No Judge Assigned' && classInfo.judgeName !== '' && (
                  <span className="trial-detail"><User size={14} /> {classInfo.judgeName}</span>
                )}
                {classInfo?.totalEntries !== undefined && (
                  <span className="trial-detail"><ClipboardCheck size={14} /> {classInfo.completedEntries || 0} of {classInfo.totalEntries} scored</span>
                )}
                {(classInfo?.timeLimit || classInfo?.timeLimit2 || classInfo?.timeLimit3) && (
                  <span className="trial-detail time-limits">
                    <Clock size={14} />
                    {classInfo.areas && classInfo.areas > 1 ? (
                      <>
                        {classInfo.timeLimit && <span className="time-limit-badge">A1: {classInfo.timeLimit}</span>}
                        {classInfo.timeLimit2 && <span className="time-limit-badge">A2: {classInfo.timeLimit2}</span>}
                        {classInfo.timeLimit3 && <span className="time-limit-badge">A3: {classInfo.timeLimit3}</span>}
                      </>
                    ) : (
                      <>{classInfo.timeLimit}</>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="header-buttons">
          {isRefreshing && <RefreshIndicator isRefreshing={isRefreshing} />}

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

          <div className="print-dropdown-container">
            <button
              className="icon-button"
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              title="Print Reports"
            >
              <Printer className="h-5 w-5" />
            </button>

            {showPrintMenu && (
              <div className="print-dropdown-menu">
                <button onClick={handlePrintCheckIn} className="print-menu-item">
                  📄 Check-In Sheet
                </button>
                <button
                  onClick={handlePrintResults}
                  className="print-menu-item"
                  disabled={completedEntries.length === 0}
                >
                  📊 Results Sheet
                </button>
              </div>
            )}
          </div>

          <button
            className={`icon-button ${isRefreshing ? 'rotating' : ''}`}
            onClick={handleRefresh}
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
          {searchTerm ? `Found ${filteredEntries.length} of ${localEntries.length} entries` : 'Search & Sort'}
        </span>
      </div>

      {searchTerm && (
        <div className="search-results-header">
          <div className="search-results-summary">
            {filteredEntries.length} of {localEntries.length} entries
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
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sort-controls">
          <span className="sort-label">Sort:</span>
          <button
            className={`sort-btn ${sortOrder === 'run' ? 'active' : ''}`}
            onClick={() => {
              setSortOrder('run');
              setIsDragMode(false);
            }}
          >
            <ArrowUpDown size={16} />
            Run Order
          </button>
          <button
            className={`sort-btn ${sortOrder === 'armband' ? 'active' : ''}`}
            onClick={() => {
              setSortOrder('armband');
              setIsDragMode(false);
            }}
          >
            <ArrowUpDown size={16} />
            Armband
          </button>
          <button
            className={`sort-btn ${sortOrder === 'placement' ? 'active' : ''}`}
            onClick={() => {
              setSortOrder('placement');
              setIsDragMode(false);
            }}
          >
            <Trophy size={16} />
            Placement
          </button>
          {hasPermission('canChangeRunOrder') && (
            <button
              className={`sort-btn ${isDragMode ? 'active' : ''} ${isUpdatingOrder ? 'loading' : ''}`}
              onClick={() => {
                if (!isDragMode) {
                  setManualOrder([...currentEntries]);
                  setSortOrder('manual');
                }
                setIsDragMode(!isDragMode);
              }}
              disabled={isUpdatingOrder}
            >
              <GripVertical size={16} />
              {isUpdatingOrder ? 'Saving...' : (isDragMode ? 'Done' : 'Reorder')}
            </button>
          )}
        </div>

        {searchTerm && !isSearchCollapsed && (
          <div className="search-results-count">
            {filteredEntries.length} of {localEntries.length}
          </div>
        )}
      </div>

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentEntries.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={`entries-grid ${isDragMode ? 'drag-mode' : ''}`}>
                {currentEntries.map((entry) => (
                  <SortableEntryCard
                    key={entry.id}
                    entry={entry}
                    isDragMode={isDragMode}
                    showContext={showContext}
                    classInfo={classInfo}
                    hasPermission={hasPermission}
                    handleEntryClick={handleEntryClick}
                    handleStatusClick={handleStatusClick}
                    handleResetMenuClick={handleResetMenuClick}
                    setSelfCheckinDisabledDialog={setSelfCheckinDisabledDialog}
                    onPrefetch={handleEntryPrefetch}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Check-in Status Dialog */}
      <CheckinStatusDialog
        isOpen={activeStatusPopup !== null}
        onClose={() => {
          setActiveStatusPopup(null);
          _setPopupPosition(null);
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

      {/* Reset Menu Popup */}
      {activeResetMenu !== null && resetMenuPosition && (
        <div
          className="reset-menu"
          style={{
            position: 'fixed',
            top: resetMenuPosition.top,
            left: resetMenuPosition.left,
            zIndex: 1000
          }}
        >
          <div className="reset-menu-content">
            <button
              className="reset-option"
              onClick={() => {
                const entry = localEntries.find(e => e.id === activeResetMenu);
                if (entry) handleResetScore(entry);
              }}
            >
              🔄 Reset Score
            </button>
          </div>
        </div>
      )}

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
              <button
                className="reset-dialog-cancel"
                onClick={cancelResetScore}
                >
                Cancel
              </button>
              <button
                className="reset-dialog-confirm"
                onClick={confirmResetScore}
                >
                Reset Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self Check-in Disabled Dialog */}
      {selfCheckinDisabledDialog && (
        <div className="reset-dialog-overlay">
          <div className="reset-dialog">
            <h3>🚫 Self Check-in Disabled</h3>
            <p>
              Self check-in has been disabled for this class by the administrator.
            </p>
            <p className="reset-dialog-warning">
              Please check in at the central table or contact the ring steward for assistance.
            </p>
            <div className="reset-dialog-buttons">
              <button
                className="reset-dialog-confirm self-checkin-ok-button"
                onClick={() => setSelfCheckinDisabledDialog(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
