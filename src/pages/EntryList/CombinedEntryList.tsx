import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { usePrefetch } from '@/hooks/usePrefetch';
import { HamburgerMenu, SyncIndicator, RefreshIndicator, ErrorState, TabBar, Tab, FilterPanel, FilterTriggerButton, SortOption } from '../../components/ui';
// DogCard replaced by SortableEntryCard for drag-and-drop support
import { CheckinStatusDialog } from '../../components/dialogs/CheckinStatusDialog';
import { RunOrderDialog, RunOrderPreset } from '../../components/dialogs/RunOrderDialog';
import { SortableEntryCard } from './SortableEntryCard';
import { Clock, CheckCircle, ArrowUpDown, Trophy, RefreshCw, MoreVertical, Printer, ClipboardCheck, Users } from 'lucide-react';
import { Entry } from '../../stores/entryStore';
import { applyRunOrderPreset } from '../../services/runOrderService';
import { generateCheckInSheet, generateResultsSheet, ReportClassInfo } from '../../services/reportService';
import { getScoresheetRoute } from '../../services/scoresheetRouter';
import { preloadScoresheetByType } from '../../utils/scoresheetPreloader';
import { useEntryListData, useEntryListActions, useEntryListFilters, useDragAndDropEntries } from './hooks';
// formatTimeForDisplay now handled internally by SortableEntryCard
import { formatTrialDate } from '../../utils/dateUtils';
import { logger } from '@/utils/logger';
import {
  DndContext,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import './EntryList.css';

export const CombinedEntryList: React.FC = () => {
  const { classIdA, classIdB } = useParams<{ classIdA: string; classIdB: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission } = usePermission();
  const { prefetch } = usePrefetch();

  // Drag state ref - declared early so it can be passed to hooks
  const isDraggingRef = useRef<boolean>(false);

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

  // Force fresh fetch on mount to avoid stale cache issues after scoring
  // This ensures we always see the latest scores after navigating back from scoresheet or page refresh
  useEffect(() => {
    console.log('🔄 CombinedEntryList mounted - refreshing to get latest scores');
    refresh(); // Refresh on mount
  }, [refresh]); // Run when refresh function changes (effectively once per mount)

  // Actions using shared hook
  const {
    handleStatusChange: handleStatusChangeHook,
    handleResetScore: handleResetScoreHook,
    handleMarkInRing,
    handleMarkCompleted,
    isSyncing,
    hasError
  } = useEntryListActions(refresh);

  // Local UI state (must be declared before useEntryListFilters)
  const [localEntries, setLocalEntries] = useState<Entry[]>([]);
  const [_manualOrder, setManualOrder] = useState<Entry[]>([]); // Used internally by drag hook
  const [sortOrder, setSortOrder] = useState<'run' | 'armband' | 'placement' | 'section-armband'>('section-armband');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeResetMenu, setActiveResetMenu] = useState<number | null>(null);
  const [resetMenuPosition, setResetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{ show: boolean; entry: Entry | null }>({ show: false, entry: null });
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  const [runOrderDialogOpen, setRunOrderDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [selfCheckinDisabledDialog, setSelfCheckinDisabledDialog] = useState(false);

  // Filters using shared hook (search and section filter)
  // Note: CombinedEntryList has custom sorting logic, so we don't use the hook's sorting
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
    entries: localEntries,
    supportManualSort: false,
    supportSectionFilter: true
  });

  // Real-time subscriptions using shared hook
  const classIds = useMemo(
    () => classIdA && classIdB ? [parseInt(classIdA), parseInt(classIdB)] : [],
    [classIdA, classIdB]
  );

  // Subscribe to cache updates from ReplicationManager (replaces old syncManager subscriptions)
  // When ReplicationManager updates the cache via real-time events, we refresh the UI
  useEffect(() => {
    if (!classIds.length) return;

    let unsubscribe: (() => void) | null = null;

    const setupCacheListener = async () => {
      try {
        const { ensureReplicationManager } = await import('@/utils/replicationHelper');
        const manager = await ensureReplicationManager();

        // Subscribe to cache updates for entries table
        unsubscribe = manager.onCacheUpdate('entries', (tableName: string) => {
          console.log(`✅ [CombinedEntryList] Cache updated for ${tableName}, refreshing UI`);
          refresh();
        });

        logger.log('[CombinedEntryList] Subscribed to cache updates from ReplicationManager');
      } catch (error) {
        logger.error('[CombinedEntryList] Failed to subscribe to cache updates:', error);
      }
    };

    setupCacheListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
        logger.log('[CombinedEntryList] Unsubscribed from cache updates');
      }
    };
  }, [classIds, refresh]);

  // Sync local entries with fetched data - but skip during drag to prevent snap-back
  useEffect(() => {
    if (entries.length > 0 && !isDraggingRef.current) {
      setLocalEntries(entries);
    }
  }, [entries]);

  // Initial load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsMenu]);

  // Apply section filter and sort
  const sectionFilteredEntries = sectionFilter === 'all'
    ? filteredEntries
    : filteredEntries.filter(e => e.section === sectionFilter);

  const sortedEntries = [...sectionFilteredEntries].sort((a, b) => {
    // ALWAYS sort "in-ring" entries to the top first
    const aInRing = a.status === 'in-ring';
    const bInRing = b.status === 'in-ring';

    if (aInRing && !bInRing) return -1; // a goes first
    if (!aInRing && bInRing) return 1;  // b goes first

    // If both or neither are in-ring, use the selected sort order
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

  // Drag and drop (extracted hook)
  const {
    sensors,
    handleDragStart,
    handleDragEnd,
  } = useDragAndDropEntries({
    localEntries,
    setLocalEntries,
    currentEntries,
    isDraggingRef,
    setManualOrder
  });

  // Prepare section tabs
  const sectionTabs: Tab[] = useMemo(() => [
    {
      id: 'all',
      label: 'All Sections',
      count: entries.length
    },
    {
      id: 'A',
      label: 'Section A',
      count: entries.filter(e => e.section === 'A').length
    },
    {
      id: 'B',
      label: 'Section B',
      count: entries.filter(e => e.section === 'B').length
    }
  ], [entries]);

  // Prepare status tabs
  const statusTabs: Tab[] = useMemo(() => [
    {
      id: 'pending',
      label: 'Pending',
      icon: <Clock size={16} />,
      count: entryCounts.pending
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircle size={16} />,
      count: entryCounts.completed
    }
  ], [entryCounts]);

  // Prepare sort options for FilterPanel
  const sortOptions: SortOption[] = useMemo(() => {
    const options: SortOption[] = [
      { value: 'section-armband', label: 'Section & Armband', icon: <ArrowUpDown size={16} /> },
      { value: 'run', label: 'Run Order', icon: <ArrowUpDown size={16} /> },
      { value: 'armband', label: 'Armband', icon: <ArrowUpDown size={16} /> }
    ];
    // Only show placement sort on completed tab
    if (activeTab === 'completed') {
      options.push({ value: 'placement', label: 'Placement', icon: <Trophy size={16} /> });
    }
    return options;
  }, [activeTab]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm.length > 0 || sortOrder !== 'section-armband';

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

  // Handle applying run order preset from dialog
  const handleApplyRunOrder = async (preset: RunOrderPreset) => {
    try {
      console.log('🔄 Applying run order preset:', preset);

      // Apply the preset and update database
      const reorderedEntries = await applyRunOrderPreset(localEntries, preset);

      // Update local state
      setLocalEntries(reorderedEntries);

      // Close dialog
      setRunOrderDialogOpen(false);

      // Show success message
      setShowSuccessMessage(true);

      // Switch to run order sort view
      setSortOrder('run');

      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);

      // Refresh to ensure data is in sync
      await refresh();

      console.log('✅ Run order applied successfully');
    } catch (error) {
      console.error('❌ Error applying run order:', error);
      setRunOrderDialogOpen(false);
      // TODO: Show error toast
    }
  };

  const confirmResetScore = async () => {
    if (!resetConfirmDialog.entry) return;

    const entryId = resetConfirmDialog.entry.id;
    console.log('[CombinedEntryList] Resetting score for entry:', entryId);

    try {
      await handleResetScoreHook(entryId);

      // CRITICAL: Wait longer for the sync AND real-time update to fully propagate
      // The sync updates the database AND the replication cache
      // Real-time subscriptions also fire and update the cache
      // We need to wait for both to complete before refreshing
      console.log('[CombinedEntryList] Waiting for sync and real-time updates to complete...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Give sync + real-time time to complete

      console.log('[CombinedEntryList] Refreshing entries from server...');
      await refresh(); // Fetch updated data from server/cache

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

  const handleStatusChange = async (entryId: number, newStatus: 'no-status' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'come-to-gate' | 'in-ring' | 'completed') => {
    // Close popup first
    setActiveStatusPopup(null);

    // Handle special manual ring management statuses
    if (newStatus === 'in-ring') {
      // Optimistic update for in-ring
      setLocalEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, status: 'in-ring' }
          : entry
      ));

      try {
        await handleMarkInRing(entryId);
      } catch (error) {
        console.error('Mark in-ring failed:', error);
        refresh();
      }
      return;
    }

    if (newStatus === 'completed') {
      // Optimistic update for completed
      setLocalEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, isScored: true, status: 'completed' }
          : entry
      ));

      try {
        await handleMarkCompleted(entryId);
      } catch (error) {
        console.error('Mark completed failed:', error);
        refresh();
      }
      return;
    }

    // Handle normal check-in status changes
    // Optimistic update: update local state immediately
    // Create completely new object reference to ensure React detects the change
    setLocalEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? {
            ...entry,
            checkedIn: newStatus !== 'no-status',
            status: newStatus,
            // Force new reference
            _timestamp: Date.now()
          }
        : entry
    ));

    // Sync with server and WAIT for database write to complete
    try {
      console.log('⏳ Waiting for database write to complete...');
      await handleStatusChangeHook(entryId, newStatus);
      console.log('✅ Database write confirmed - refreshing');
      // Refresh to get latest data
      // This ensures immediate page refresh shows the correct status
      await refresh();
      console.log('✅ Refreshed - safe to continue');
    } catch (error) {
      console.error('Status change failed:', error);
      // Rollback optimistic update on error
      setLocalEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, status: entries.find(e => e.id === entryId)?.status || 'no-status' }
          : entry
      ));
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

  // Helper to get scoresheet route for an entry
  const getScoreSheetRoute = (entry: Entry): string => {
    return getScoresheetRoute({
      org: showContext?.org || '',
      element: entry.element || '',
      level: entry.level || '',
      classId: entry.classId,
      entryId: entry.id,
      competition_type: showContext?.competition_type || 'Regular'
    });
  };

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
  }, [showContext?.org, prefetch, pendingEntries]);

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

  // Print report handlers
  const handlePrintCheckIn = () => {
    if (!classInfo) return;

    const orgData = parseOrganizationData(showContext?.org || '');
    const reportClassInfo: ReportClassInfo = {
      className: `${classInfo.element} ${classInfo.level} A & B Combined`,
      element: classInfo.element,
      level: classInfo.level,
      section: 'A & B',
      trialDate: classInfo.trialDate || '',
      trialNumber: classInfo.trialNumber || '',
      judgeName: classInfo.judgeName || 'TBD',
      organization: orgData.organization,
      activityType: orgData.activity_type
    };

    generateCheckInSheet(reportClassInfo, entries);
    setShowActionsMenu(false);
  };

  const handlePrintResultsSectionA = () => {
    if (!classInfo) return;

    // Filter entries for Section A only
    const sectionAEntries = entries.filter(entry => entry.section === 'A');

    const orgData = parseOrganizationData(showContext?.org || '');
    const reportClassInfo: ReportClassInfo = {
      className: `${classInfo.element} ${classInfo.level} Section A`,
      element: classInfo.element,
      level: classInfo.level,
      section: 'A',
      trialDate: classInfo.trialDate || '',
      trialNumber: classInfo.trialNumber || '',
      judgeName: classInfo.judgeName || 'TBD',
      organization: orgData.organization,
      activityType: orgData.activity_type
    };

    generateResultsSheet(reportClassInfo, sectionAEntries);
    setShowActionsMenu(false);
  };

  const handlePrintResultsSectionB = () => {
    if (!classInfo) return;

    // Filter entries for Section B only
    const sectionBEntries = entries.filter(entry => entry.section === 'B');

    const orgData = parseOrganizationData(showContext?.org || '');
    const reportClassInfo: ReportClassInfo = {
      className: `${classInfo.element} ${classInfo.level} Section B`,
      element: classInfo.element,
      level: classInfo.level,
      section: 'B',
      trialDate: classInfo.trialDate || '',
      trialNumber: classInfo.trialNumber || '',
      judgeName: classInfo.judgeNameB || classInfo.judgeName || 'TBD',  // Use judgeNameB for Section B
      organization: orgData.organization,
      activityType: orgData.activity_type
    };

    generateResultsSheet(reportClassInfo, sectionBEntries);
    setShowActionsMenu(false);
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
    <div className={`entry-list-container${isLoaded ? ' loaded' : ''}`} data-loaded={isLoaded}>
      <header className="page-header entry-list-header">
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
              <Users className="title-icon" />
              {classInfo?.className?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
            {/* Show status badge */}
            {statusBadge && (
              <>
                <span className="trial-separator">•</span>
                <span className={`class-status-badge ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
              </>
            )}
            {/* Show Section A/B indicator */}
            {classInfo?.judgeNameB && classInfo.judgeNameB !== classInfo.judgeName && (
              <>
                <span className="trial-separator">•</span>
                <span className="class-status-badge sections-badge">Section A & B</span>
              </>
            )}
          </div>
          <div className="class-subtitle">
            <div className="trial-info-simple">
              {classInfo?.trialDate && classInfo.trialDate !== '' && (
                <span className="trial-date-text">{formatTrialDate(classInfo.trialDate)}</span>
              )}
              {classInfo?.trialDate && classInfo?.trialNumber && classInfo.trialNumber !== '' && classInfo.trialNumber !== '0' && (
                <span className="trial-separator">•</span>
              )}
              {classInfo?.trialNumber && classInfo.trialNumber !== '' && classInfo.trialNumber !== '0' && (
                <span className="trial-number-text">Trial {classInfo.trialNumber}</span>
              )}
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

          {/* Filter button */}
          <FilterTriggerButton
            onClick={() => setIsFilterPanelOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Actions Menu (3-dot menu) */}
          <div className="actions-menu-container">
            <button
              className="icon-button actions-button"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              aria-label="Actions menu"
              title="More Actions"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showActionsMenu && (
              <div className="actions-dropdown-menu">
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    refresh();
                  }}
                  className="action-menu-item"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'rotating' : ''}`} />
                  Refresh
                </button>
                <div className="menu-divider" />
                <button onClick={handlePrintCheckIn} className="action-menu-item">
                  <Printer className="h-4 w-4" />
                  Check-In Sheet (A & B)
                </button>
                <button
                  onClick={handlePrintResultsSectionA}
                  className="action-menu-item"
                  disabled={completedEntries.filter(e => e.section === 'A').length === 0}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Results - Section A
                </button>
                <button
                  onClick={handlePrintResultsSectionB}
                  className="action-menu-item"
                  disabled={completedEntries.filter(e => e.section === 'B').length === 0}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Results - Section B
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Section Filter Tabs */}
      <TabBar
        tabs={sectionTabs}
        activeTab={sectionFilter}
        onTabChange={(tabId) => setSectionFilter(tabId as 'all' | 'A' | 'B')}
        className="full-width"
      />

      {/* Status Tabs */}
      <TabBar
        tabs={statusTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'pending' | 'completed')}
      />

      {/* Scrollable Content Area - only the grid scrolls */}
      <div className="entry-list-scrollable">
        <div className="entry-list-content">
        {currentEntries.length === 0 ? (
          <div className="no-entries">
            <h2>No {activeTab} entries</h2>
            <p>{activeTab === 'pending' ? 'All entries have been scored.' : 'No entries have been scored yet.'}</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentEntries.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={`grid-responsive ${isDragMode ? 'drag-mode' : ''}`}>
                {currentEntries.map((entry) => (
                  <SortableEntryCard
                    key={`${entry.id}-${entry.status}-${entry.isScored}`}
                    entry={entry}
                    isDragMode={isDragMode}
                    showContext={showContext}
                    classInfo={classInfo}
                    hasPermission={hasPermission}
                    handleEntryClick={handleScoreClick}
                    handleStatusClick={handleStatusClick}
                    handleResetMenuClick={handleResetMenuClick}
                    setSelfCheckinDisabledDialog={setSelfCheckinDisabledDialog}
                    onPrefetch={handleEntryPrefetch}
                    sectionBadge={entry.section as 'A' | 'B' | null}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        </div>
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
        showRingManagement={hasPermission('canScore')}
      />

      {/* Run Order Dialog */}
      <RunOrderDialog
        isOpen={runOrderDialogOpen}
        onClose={() => setRunOrderDialogOpen(false)}
        entries={localEntries}
        onApplyOrder={handleApplyRunOrder}
        onOpenDragMode={() => {
          // Enable drag mode for manual reordering
          setRunOrderDialogOpen(false);
          // Capture current entries for drag snapshot (matches EntryList pattern)
          setManualOrder([...currentEntries]);
          setIsDragMode(true);
          // Switch to run order sort to show the current order
          setSortOrder('run');
        }}
      />

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="success-toast">
          <CheckCircle size={20}  style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span>Run order updated successfully</span>
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

      {/* Search & Sort Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search dog, handler, breed, armband..."
        sortOptions={sortOptions}
        sortOrder={sortOrder}
        onSortChange={(order) => {
          setSortOrder(order as 'run' | 'armband' | 'placement' | 'section-armband');
          setIsDragMode(false);
        }}
        resultsLabel={searchTerm ? `${filteredEntries.length} of ${localEntries.length} entries` : `${currentEntries.length} entries`}
      />

      {/* Floating Done Button - Exit Drag Mode */}
      {isDragMode && (
        <button
          className="floating-done-button"
          onClick={() => {
            setIsDragMode(false);
            setSortOrder('run'); // Switch to Run Order to show the new order
          }}
          aria-label="Done reordering"
        >
          <CheckCircle size={20} />
          Done
        </button>
      )}
    </div>
  );
};

export default CombinedEntryList;
