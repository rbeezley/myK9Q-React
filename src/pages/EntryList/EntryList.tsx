import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useSettingsStore } from '@/stores/settingsStore';
import { HamburgerMenu, SyncIndicator, RefreshIndicator, ErrorState, PullToRefresh, TabBar, Tab, FilterPanel, FilterTriggerButton, SortOption } from '../../components/ui';
import { CheckinStatusDialog } from '../../components/dialogs/CheckinStatusDialog';
import { RunOrderDialog, RunOrderPreset } from '../../components/dialogs/RunOrderDialog';
import { SortableEntryCard } from './SortableEntryCard';
import { Clock, CheckCircle, Trophy, RefreshCw, ClipboardCheck, Printer, ListOrdered, MoreVertical, ArrowUpDown, Users } from 'lucide-react';
import { generateCheckInSheet, generateResultsSheet, ReportClassInfo } from '../../services/reportService';
import { parseOrganizationData } from '../../utils/organizationUtils';
import { formatTrialDate } from '../../utils/dateUtils';
import { getScoresheetRoute } from '../../services/scoresheetRouter';
import { markInRing } from '../../services/entryService';
import { applyRunOrderPreset } from '../../services/runOrderService';
import { manuallyRecalculatePlacements } from '../../services/placementService';
import { preloadScoresheetByType } from '../../utils/scoresheetPreloader';
import { Entry } from '../../stores/entryStore';
import { useEntryListData, useEntryListActions, useEntryListFilters, useDragAndDropEntries } from './hooks';
import type { TabType } from './hooks';
import { logger } from '@/utils/logger';
import {
  DndContext,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
// CSS imported in index.css to prevent FOUC

export const EntryList: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { showContext, role } = useAuth();
  const { hasPermission } = usePermission();
  const { prefetch } = usePrefetch();
  const { settings } = useSettingsStore();

  // Drag state ref - declared early so it can be passed to hooks
  // Prevents sync-triggered refreshes during drag operations
  const isDraggingRef = useRef<boolean>(false);

  // Data management using shared hook
  const {
    entries,
    classInfo,
    isRefreshing,
    fetchError,
    refresh
  } = useEntryListData({
    classId,
    isDraggingRef  // Pass to hook to prevent sync during drag
  });

  // No forced refresh needed - LocalStateManager ensures we always have correct merged state

  // Actions using shared hook
  const {
    handleStatusChange: handleStatusChangeHook,
    handleResetScore: handleResetScoreHook,
    handleMarkInRing,
    handleMarkCompleted,
    isSyncing,
    hasError
  } = useEntryListActions(refresh);

  // Real-time subscriptions using shared hook
  const actualClassId = classInfo?.actualClassId;
  const classIds = useMemo(
    () => actualClassId ? [actualClassId] : [],
    [actualClassId]
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
        unsubscribe = manager.onCacheUpdate('entries', (_tableName: string) => {
          // Skip refresh during drag operations to prevent snap-back
          if (isDraggingRef.current) {
            return;
          }
          refresh();
        });

        logger.log('[EntryList] Subscribed to cache updates from ReplicationManager');
      } catch (error) {
        logger.error('[EntryList] Failed to subscribe to cache updates:', error);
      }
    };

    setupCacheListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
        logger.log('[EntryList] Unsubscribed from cache updates');
      }
    };
  }, [classIds, refresh]);

  // Local state for UI and features unique to EntryList
  const [localEntries, setLocalEntries] = useState<Entry[]>([]);
  const [manualOrder, setManualOrder] = useState<Entry[]>([]);
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  const [_popupPosition, _setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeResetMenu, setActiveResetMenu] = useState<number | null>(null);
  const [resetMenuPosition, setResetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{ show: boolean; entry: Entry | null }>({ show: false, entry: null });
  const [selfCheckinDisabledDialog, setSelfCheckinDisabledDialog] = useState<boolean>(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [runOrderDialogOpen, setRunOrderDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [isRecalculatingPlacements, setIsRecalculatingPlacements] = useState(false);

  // Filtering and sorting (extracted hook)
  const {
    activeTab,
    setActiveTab,
    sortBy: sortOrder,
    setSortBy: setSortOrder,
    searchTerm,
    setSearchTerm,
    filteredEntries,
    pendingEntries,
    completedEntries,
  } = useEntryListFilters({
    entries: localEntries,
    prioritizeInRing: true,
    deprioritizePulled: true,
    manualOrder: manualOrder,
    defaultSort: 'run'
  });

  // Current entries based on active tab (for drag-and-drop)
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

  // Sync local entries with fetched data - now simple since LocalStateManager handles merging
  // BUT skip sync while dragging to prevent snap-back
  useEffect(() => {
    if (entries.length > 0 && !isDraggingRef.current) {
      setLocalEntries(entries);
    }
  }, [entries]); // Depend on entries array to catch content changes (isScored, status, etc.)

  // Handle applying run order preset from dialog
  const handleApplyRunOrder = async (preset: RunOrderPreset) => {
    try {
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

} catch (error) {
      console.error('❌ Error applying run order:', error);
      setRunOrderDialogOpen(false);
      // TODO: Show error toast
    }
  };

  // Handle opening drag mode from dialog
  const handleOpenDragMode = () => {
    setManualOrder([...currentEntries]);
    setSortOrder('manual');
    setIsDragMode(true);
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

  const handleStatusChange = async (entryId: number, status: NonNullable<Entry['checkinStatus']> | 'in-ring' | 'completed') => {
    // Close the popup first to prevent multiple clicks
    setActiveStatusPopup(null);
    _setPopupPosition(null);

    // Handle special manual ring management statuses
    if (status === 'in-ring') {
      // Optimistic update for in-ring
      setLocalEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, inRing: true }
          : entry
      ));

      // Sync with server in background (silently fails if offline)
      try {
        await handleMarkInRing(entryId);
        // Real-time subscription will trigger automatic refresh
      } catch (error) {
        console.error('Failed to mark in-ring in background:', error);
        // Don't show error to user - offline-first means this is transparent
      }
      return;
    }

    if (status === 'completed') {
      // Optimistic update for completed
      setLocalEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, isScored: true, inRing: false }
          : entry
      ));

      // Sync with server in background (silently fails if offline)
      try {
        await handleMarkCompleted(entryId);
        // Real-time subscription will trigger automatic refresh
      } catch (error) {
        console.error('Failed to mark completed in background:', error);
        // Don't show error to user - offline-first means this is transparent
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
            checkedIn: status !== 'no-status',
            status: status,
            inRing: false,
            // Force new reference
            _timestamp: Date.now()
          }
        : entry
    ));

    // Sync with server in background (silently fails if offline)
    try {
      await handleStatusChangeHook(entryId, status);

      // Note: NO manual refresh needed here!
      // The real-time subscription will fire when database is updated,
      // which updates the replication cache and triggers an automatic refresh.
      // This is the local-first architecture working correctly.
    } catch (error) {
      console.error('Failed to update status in background:', error);
      // Don't show error to user - offline-first means this is transparent
      // The optimistic update already happened, sync will retry when online
    }
  };

  const handleStatusClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

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

  // Manual placement recalculation handler
  const handleRecalculatePlacements = async () => {
    if (!classId) return;

    setIsRecalculatingPlacements(true);
    try {
      await manuallyRecalculatePlacements(Number(classId));
      // Refresh to show updated placements
      await refresh();
} catch (error) {
      console.error('❌ Failed to recalculate placements:', error);
      alert('Failed to recalculate placements. Please try again.');
    } finally {
      setIsRecalculatingPlacements(false);
      setShowPrintMenu(false);
    }
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setShowPrintMenu(false);
      }
    };

    if (showPrintMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPrintMenu]);

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
        if (currentDog?.status !== 'in-ring') {
          const otherEntries = localEntries.filter(entry => entry.id !== dogId && entry.status === 'in-ring');
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
console.log('[EntryList] ShowContext:', showContext);
navigate(route);
  };

  const handleResetMenuClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

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

    // Update local state IMMEDIATELY (optimistic update - works offline)
    setLocalEntries(prev => prev.map(entry =>
      entry.id === resetConfirmDialog.entry!.id
        ? {
            ...entry,
            isScored: false,
            status: 'no-status', // Reset status badge to "No Status"
            checkinStatus: 'no-status',
            checkedIn: false,
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

    // Sync with server in background (silently fails if offline)
    try {
      await handleResetScoreHook(resetConfirmDialog.entry.id);

      // Note: NO manual refresh needed here!
      // The real-time subscription will fire when database is updated,
      // which updates the replication cache and triggers an automatic refresh.
      // This is the local-first architecture working correctly.
    } catch (error) {
      console.error('Failed to reset score in background:', error);
      // Don't show error to user - offline-first means this is transparent
      // The optimistic update already happened, sync will retry when online
    }

    setResetConfirmDialog({ show: false, entry: null });
  };

  const cancelResetScore = () => {
    setResetConfirmDialog({ show: false, entry: null });
  };

  // Prepare status tabs for TabBar component
  const statusTabs: Tab[] = useMemo(() => [
    {
      id: 'pending',
      label: 'Pending',
      icon: <Clock size={16} />,
      count: pendingEntries.length
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CheckCircle size={16} />,
      count: completedEntries.length
    }
  ], [pendingEntries.length, completedEntries.length]);

  // Prepare sort options for FilterPanel
  const sortOptions: SortOption[] = useMemo(() => {
    const options: SortOption[] = [
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
  const hasActiveFilters = searchTerm.length > 0 || sortOrder !== 'run';

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
            {statusBadge && (
              <>
                <span className="trial-separator">•</span>
                <span className={`class-status-badge ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
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

          {/* Filter button */}
          <FilterTriggerButton
            onClick={() => setIsFilterPanelOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Actions Menu (3-dot menu) */}
          <div className="actions-menu-container">
            <button
              className="icon-button actions-button"
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              aria-label="Actions menu"
              title="More Actions"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showPrintMenu && (
              <div className="actions-dropdown-menu">
                <button
                  onClick={() => {
                    setShowPrintMenu(false);
                    handleRefresh();
                  }}
                  className="action-menu-item"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'rotating' : ''}`} />
                  Refresh
                </button>
                {hasPermission('canChangeRunOrder') && (
                  <button
                    onClick={() => {
                      setShowPrintMenu(false);
                      setRunOrderDialogOpen(true);
                    }}
                    className="action-menu-item"
                  >
                    <ListOrdered className="h-4 w-4" />
                    Set Run Order
                  </button>
                )}
                {hasPermission('canManageClasses') && (
                  <button
                    onClick={handleRecalculatePlacements}
                    className="action-menu-item"
                    disabled={isRecalculatingPlacements}
                  >
                    <Trophy className={`h-4 w-4 ${isRecalculatingPlacements ? 'rotating' : ''}`} />
                    Recalculate Placements
                  </button>
                )}
                <div className="menu-divider" />
                <button onClick={handlePrintCheckIn} className="action-menu-item">
                  <Printer className="h-4 w-4" />
                  Check-In Sheet
                </button>
                <button
                  onClick={handlePrintResults}
                  className="action-menu-item"
                  disabled={completedEntries.length === 0}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Results Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <TabBar
        tabs={statusTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
      />

      {/* Pull to Refresh Wrapper - wraps only scrollable content */}
      <PullToRefresh
        onRefresh={handleRefresh}
        enabled={settings.pullToRefresh}
        threshold={80}
      >

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
      </div>

      </PullToRefresh>

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
          setSortOrder(order as 'run' | 'armband' | 'placement' | 'manual');
          setIsDragMode(false);
        }}
        resultsLabel={searchTerm ? `${filteredEntries.length} of ${localEntries.length} entries` : `${currentEntries.length} entries`}
      />

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
        showRingManagement={hasPermission('canScore')}
      />

      {/* Run Order Dialog */}
      <RunOrderDialog
        isOpen={runOrderDialogOpen}
        onClose={() => setRunOrderDialogOpen(false)}
        entries={localEntries}
        onApplyOrder={handleApplyRunOrder}
        onOpenDragMode={handleOpenDragMode}
      />

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="success-toast">
          <CheckCircle size={20}  style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span>Run order updated successfully</span>
        </div>
      )}

      {/* Reset Menu Popup - Rendered via Portal to avoid CSS transform issues */}
      {activeResetMenu !== null && resetMenuPosition && createPortal(
        <div
          className="reset-menu"
          style={{
            position: 'fixed',
            top: `${resetMenuPosition.top}px`,
            left: `${resetMenuPosition.left}px`,
            zIndex: 10000
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
        </div>,
        document.body
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmDialog.show && resetConfirmDialog.entry && (
        <div className="dialog-overlay">
          <div className="dialog-container reset-dialog-container">
            <div className="dialog-header">
              <h3 className="dialog-title">Reset Score</h3>
            </div>
            <div className="dialog-content">
              <p>
                Are you sure you want to reset the score for <strong>{resetConfirmDialog.entry.callName}</strong> ({resetConfirmDialog.entry.armband})?
              </p>
              <p className="reset-dialog-warning">
                This will remove their current score and move them back to the pending list.
              </p>
            </div>
            <div className="dialog-footer">
              <button
                className="dialog-button dialog-button-secondary"
                onClick={cancelResetScore}
              >
                Cancel
              </button>
              <button
                className="dialog-button dialog-button-primary reset-dialog-confirm"
                onClick={confirmResetScore}
              >
                Confirm
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

export default EntryList;
