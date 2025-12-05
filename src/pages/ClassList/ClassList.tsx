import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { usePrefetch } from '@/hooks/usePrefetch';
import { supabase } from '../../lib/supabase';
import { ensureReplicationManager } from '@/utils/replicationHelper';
import type { Entry } from '@/services/replication';
import { logger } from '@/utils/logger';
import { useSettingsStore } from '@/stores/settingsStore';
import { HamburgerMenu, CompactOfflineIndicator, TrialDateBadge, RefreshIndicator, ErrorState, PullToRefresh, FilterPanel, FilterTriggerButton } from '../../components/ui';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ArrowLeft, RefreshCw, Target, ClipboardList, Clock, Settings, BarChart3, FileText, Award, X, List } from 'lucide-react';
// CSS imported in index.css to prevent FOUC
import { ClassRequirementsDialog } from '../../components/dialogs/ClassRequirementsDialog';
import { MaxTimeDialog } from '../../components/dialogs/MaxTimeDialog';
import { ClassStatusDialog } from '../../components/dialogs/ClassStatusDialog';
import { ClassSettingsDialog } from '../../components/dialogs/ClassSettingsDialog';
import { NoEntriesDialog } from '../../components/dialogs/NoEntriesDialog';
import { NoStatsDialog } from '../../components/dialogs/NoStatsDialog';
import { getClassDisplayStatus } from '../../utils/statusUtils';
import { getLevelSortOrder } from '../../lib/utils';
import { ClassCard } from './ClassCard';
import { ClassFilters } from './ClassFilters';
import { useClassListData, ClassEntry, TrialInfo } from './hooks/useClassListData';
import { useClassDialogs } from './hooks/useClassDialogs';
import { useClassStatus, type StatusDependencies } from './hooks/useClassStatus';
import { useClassRealtime } from './hooks/useClassRealtime';
import { usePrintReports, type ReportDependencies } from './hooks/usePrintReports';
import { useFavoriteClasses } from './hooks/useFavoriteClasses';
import { findPairedNoviceClass, groupNoviceClasses } from './utils/noviceClassGrouping';

export const ClassList: React.FC = () => {
  const { trialId } = useParams<{ trialId: string }>();
  const navigate = useNavigate();
  const { showContext, role: _role, logout: _logout } = useAuth();
  const { hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const { prefetch } = usePrefetch();
  const { settings } = useSettingsStore();

  // Use React Query for data fetching
  const {
    trialInfo: trialInfoData,
    classes: classesData,
    isLoading,
    isRefreshing,
    error: fetchError,
    refetch
  } = useClassListData(trialId, showContext?.showId, showContext?.licenseKey);

  // Favorites management (extracted hook)
  const {
    favoriteClasses,
    toggleFavorite: toggleFavoriteHook,
  } = useFavoriteClasses(showContext?.licenseKey, trialId);

  // Local state for data (synced from React Query)
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [combinedFilter, setCombinedFilter] = useState<'pending' | 'favorites' | 'completed'>('pending');

  // Dialog state management (extracted hook) - excludes status dialog (managed by useClassStatus)
  const {
    activePopup,
    setActivePopup,
    requirementsDialogOpen,
    selectedClassForRequirements,
    setRequirementsDialogOpen,
    setSelectedClassForRequirements,
    maxTimeDialogOpen,
    selectedClassForMaxTime,
    setMaxTimeDialogOpen,
    setSelectedClassForMaxTime,
    settingsDialogOpen,
    selectedClassForSettings,
    setSettingsDialogOpen,
    setSelectedClassForSettings,
  } = useClassDialogs();

  // Class status management (extracted hook)
  const {
    statusDialogOpen,
    selectedClassForStatus,
    setStatusDialogOpen,
    setSelectedClassForStatus,
    handleStatusChange: handleStatusChangeHook,
    handleStatusChangeWithTime: handleStatusChangeWithTimeHook,
  } = useClassStatus();

  // Real-time subscription for class/entry updates (extracted hook)
  useClassRealtime(
    trialId ? Number(trialId) : undefined,
    showContext?.licenseKey,
    setClasses,
    refetch,
    supabase
  );

  // Print report generation (extracted hook)
  const {
    handleGenerateCheckIn: handleCheckInHook,
    handleGenerateResults: handleResultsHook,
  } = usePrintReports();

  // Max time warning is local-only (not in shared hook)
  const [showMaxTimeWarning, setShowMaxTimeWarning] = useState(false);

  // No entries dialog state - shown when clicking a class with 0 entries
  const [noEntriesDialogOpen, setNoEntriesDialogOpen] = useState(false);
  const [noEntriesClassName, setNoEntriesClassName] = useState<string | undefined>(undefined);

  // No stats dialog state - shown when clicking Statistics for a class with no scored entries
  const [noStatsDialogOpen, setNoStatsDialogOpen] = useState(false);
  const [noStatsClassName, setNoStatsClassName] = useState<string | undefined>(undefined);

  // Search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'class_order' | 'element_level' | 'level_element'>('class_order');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Sort options for FilterPanel
  const sortOptions = [
    { value: 'class_order', label: 'Run Order' },
    { value: 'element_level', label: 'Element → Level' },
    { value: 'level_element', label: 'Level → Element' }
  ];

  // Prevent FOUC by adding 'loaded' class after mount
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger loaded animation after initial render
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Time input states for status dialog

  // Sync React Query data with local state
  useEffect(() => {
    if (trialInfoData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid use: syncing immutable cache data to mutable local state for real-time updates
      setTrialInfo(trialInfoData);
    }
    if (classesData) {
      setClasses(classesData);
    }
  }, [trialInfoData, classesData]);

  // Update classes' is_favorite property when favoriteClasses changes (hook handles localStorage)
  useEffect(() => {
    if (classes.length > 0) {
// eslint-disable-next-line react-hooks/set-state-in-effect -- Valid use: syncing favorite state from localStorage to class data
      setClasses(prevClasses =>
        prevClasses.map(classEntry => ({
          ...classEntry,
          is_favorite: favoriteClasses.has(classEntry.id)
        }))
      );
    }
  }, [favoriteClasses]);

  // Data is loaded via useStaleWhileRevalidate hook - no manual loading needed


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.class-popup') && !target.closest('.class-menu-button')) {
        setActivePopup(null);
      }
    };

    if (activePopup !== null) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);

      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup]);

  const handleRefresh = useCallback(async () => {
    hapticFeedback.medium();
    await refetch();
  }, [refetch, hapticFeedback]);

  // Report dependencies - grouped for cleaner function signatures
  const reportDeps: ReportDependencies = useMemo(() => ({
    classes,
    trialInfo,
    licenseKey: showContext?.licenseKey || '',
    organization: showContext?.org || '',
    onComplete: () => setActivePopup(null)
  }), [classes, trialInfo, showContext, setActivePopup]);

  // Print report wrappers (delegates to usePrintReports hook)
  const handleGenerateCheckIn = useCallback(async (classId: number) => {
    if (!showContext?.licenseKey) return;
    const result = await handleCheckInHook(classId, reportDeps);
    if (!result.success && result.error) {
      alert(result.error);
    }
  }, [handleCheckInHook, showContext?.licenseKey, reportDeps]);

  const handleGenerateResults = useCallback(async (classId: number) => {
    if (!showContext?.licenseKey) return;
    const result = await handleResultsHook(classId, reportDeps);
    if (!result.success && result.error) {
      alert(result.error);
    }
  }, [handleResultsHook, showContext?.licenseKey, reportDeps]);

  // Helper function to check if max times are set for a class
  const isMaxTimeSet = (classEntry: ClassEntry): boolean => {
    const { time_limit_seconds, time_limit_area2_seconds, time_limit_area3_seconds } = classEntry;

    // Check if any time limit is set (greater than 0)
    const hasTime1 = Boolean(time_limit_seconds && time_limit_seconds > 0);
    const hasTime2 = Boolean(time_limit_area2_seconds && time_limit_area2_seconds > 0);
    const hasTime3 = Boolean(time_limit_area3_seconds && time_limit_area3_seconds > 0);

    return hasTime1 || hasTime2 || hasTime3;
  };

  // Helper function to check if user role should see max time warning
  const shouldShowMaxTimeWarning = () => {
    // For now, disable max time warnings to allow navigation
    return false;
  };

  // Helper function to find the paired Novice class (A pairs with B, and vice versa)
  const findPaired = useCallback((clickedClass: ClassEntry): ClassEntry | null => {
    return findPairedNoviceClass(clickedClass, classes);
  }, [classes]);

  // Prefetch class entry data when hovering/touching class card
  const handleClassPrefetch = useCallback(async (classId: number) => {
    if (!showContext?.licenseKey) return;

    await prefetch(
      `class-entries-${classId}`,
      async () => {
        // Try replicated cache first (offline-first)
        try {
          const manager = await ensureReplicationManager();
          const entriesTable = manager.getTable('entries');
          if (entriesTable) {
            const allEntries = await entriesTable.getAll() as Entry[];
            const classEntries = allEntries
              .filter(e => String(e.class_id) === String(classId))
              .sort((a, b) => a.armband_number - b.armband_number);

            if (classEntries.length > 0) {
              logger.log('📡 Prefetched class entries from cache:', classId, classEntries.length);
              return classEntries;
            }
          }
        } catch (error) {
          logger.error('❌ Error prefetching entries from cache:', error);
        }

        // Fall back to Supabase if cache miss
        const { data: entriesData } = await supabase
          .from('entries')
          .select(`
            *,
            classes!inner (element, level, section, trial_id)
          `)
          .eq('class_id', classId)
          .order('armband_number', { ascending: true });

        logger.log('📡 Prefetched class entries from Supabase:', classId, entriesData?.length || 0);
        return entriesData || [];
      },
      {
        ttl: 60, // 1 minute cache
        priority: 3 // High priority - likely next action
      }
    );
  }, [showContext?.licenseKey, prefetch]);

  const handleViewEntries = (classEntry: ClassEntry) => {
    hapticFeedback.medium();

    // Check if class has no entries - show popup instead of navigating to empty page
    if (classEntry.entry_count === 0) {
      setNoEntriesClassName(classEntry.class_name);
      setNoEntriesDialogOpen(true);
      return;
    }

    // Check if max time warning should be shown
    if (shouldShowMaxTimeWarning() && !isMaxTimeSet(classEntry)) {
      // Show MaxTimeDialog with warning instead of separate warning dialog
      setSelectedClassForMaxTime(classEntry);
      setMaxTimeDialogOpen(true);
      setShowMaxTimeWarning(true);
      return;
    }

    // Check if this is a combined Novice A & B class (has pairedClassId)
    if (classEntry.pairedClassId) {
      // Navigate directly to combined view with both class IDs
      navigate(`/class/${classEntry.id}/${classEntry.pairedClassId}/entries/combined`);
      return;
    }

    // Fallback: Check if this is a Novice class and has a paired class
    if (classEntry.level === 'Novice' && (classEntry.section === 'A' || classEntry.section === 'B')) {
      const paired = findPaired(classEntry);
      if (paired) {
        // Navigate directly to combined view with both class IDs (no dialog)
        navigate(`/class/${classEntry.id}/${paired.id}/entries/combined`);
        return;
      }
    }

    // Proceed with navigation (single class or non-Novice)
    navigate(`/class/${classEntry.id}/entries`);
  };

  // Status dependencies - grouped for cleaner function signatures
  const statusDeps: StatusDependencies = useMemo(() => ({
    classes,
    setClasses,
    supabaseClient: supabase,
    refetch
  }), [classes, refetch]);

  // Wrapper for status changes with time (delegates to useClassStatus hook)
  const handleClassStatusChangeWithTime = useCallback(async (
    classId: number,
    status: ClassEntry['class_status'],
    timeValue: string
  ) => {
    await handleStatusChangeWithTimeHook(classId, status, timeValue, statusDeps);
  }, [handleStatusChangeWithTimeHook, statusDeps]);

  // Wrapper for status changes without time (delegates to useClassStatus hook)
  const handleClassStatusChange = useCallback(async (
    classId: number,
    status: ClassEntry['class_status']
  ) => {
    await handleStatusChangeHook(classId, status, statusDeps);
  }, [handleStatusChangeHook, statusDeps]);

  // Wrapper for favorite toggle (delegates to useFavoriteClasses hook, adds haptic feedback)
  const toggleFavorite = useCallback((classId: number) => {
    const classEntry = classes.find(c => c.id === classId);
    const isCurrentlyFavorite = classEntry?.is_favorite;

    // Enhanced haptic feedback for outdoor/gloved use
    if (isCurrentlyFavorite) {
      hapticFeedback.light();  // Removing favorite - softer feedback
    } else {
      hapticFeedback.medium(); // Adding favorite - stronger feedback for confirmation
    }

    // Delegate to hook (handles localStorage, paired classes via useEffect syncs to classes)
    toggleFavoriteHook(classId, classEntry?.pairedClassId);

    // Update classes state immediately for responsive UI
    const pairedId = classEntry?.pairedClassId;
    const idsToToggle = pairedId ? [classId, pairedId] : [classId];
    setClasses(prev => prev.map(c =>
      idsToToggle.includes(c.id) ? { ...c, is_favorite: !c.is_favorite } : c
    ));
  }, [classes, hapticFeedback, toggleFavoriteHook]);

  const getStatusColor = useCallback((status: ClassEntry['class_status'], classEntry?: ClassEntry) => {
    // Check is_scoring_finalized first for consistent coloring
    if (classEntry) {
      const displayStatus = getClassDisplayStatus(classEntry);
      if (displayStatus === 'completed') return 'completed';
      if (displayStatus === 'in-progress') return 'in-progress';
    }

    switch (status) {
      case 'no-status': return 'no-status';
      case 'setup': return 'setup';
      case 'briefing': return 'briefing';
      case 'break': return 'break';
      case 'start_time': return 'start-time';
      case 'in_progress': return 'in-progress';
      case 'completed': return 'completed';
      default:
        // Intelligent color based on actual class progress
        if (classEntry) {
          const isCompleted = classEntry.completed_count === classEntry.entry_count && classEntry.entry_count > 0;
          const hasDogsInRing = classEntry.dogs.some(dog => dog.in_ring);

          if (isCompleted) return 'completed';
          if (hasDogsInRing) return 'in-progress';
          if (classEntry.completed_count > 0) return 'in-progress';
          return 'no-status';
        }
        return 'no-status';
    }
  }, []);

  // Helper function to format status with time in a structured way
  const getFormattedStatus = useCallback((classEntry: ClassEntry) => {
    // Check is_scoring_finalized first, then fall back to class_status
    const displayStatus = getClassDisplayStatus(classEntry);

    // If detected as completed via is_scoring_finalized or entry counts, show Completed
    if (displayStatus === 'completed') {
      return { label: 'Completed', time: null };
    }

    const status = classEntry.class_status;
    const result = (() => {
      switch (status) {
        case 'briefing':
          return {
            label: 'Briefing',
            time: classEntry.briefing_time ?? null
          };
        case 'break':
          return {
            label: 'Break Until',
            time: classEntry.break_until ?? null
          };
        case 'start_time':
          return {
            label: 'Start Time',
            time: classEntry.start_time ?? null
          };
        case 'setup':
          return { label: 'Setup', time: null };
        case 'in_progress':
          return { label: 'In Progress', time: null };
        case 'completed':
          return { label: 'Completed', time: null };
        case 'no-status':
          return { label: 'No Status', time: null };
        default:
          return { label: 'No Status', time: null };
      }
    })();

    return result;
  }, []);

  // Helper function to group Novice A/B classes into combined entries
  const groupNoviceClassesCached = useCallback((classList: ClassEntry[]): ClassEntry[] => {
    return groupNoviceClasses(classList, findPaired);
  }, [findPaired]);

  // Memoized grouped classes - used for consistent counts across tabs and panel
  const groupedClasses = useMemo(() => {
    return groupNoviceClassesCached(classes);
  }, [groupNoviceClassesCached, classes]);

  // Search and sort functionality
  // Memoized filtered and sorted classes for performance optimization
  const filteredClasses = useMemo(() => {
    const filtered = groupedClasses.filter(classEntry => {
      // Use the same logic as getClassDisplayStatus to respect manual status
      const displayStatus = getClassDisplayStatus(classEntry);
      const isCompleted = displayStatus === 'completed';

      // Combined filter logic (existing)
      if (combinedFilter === 'pending' && isCompleted) return false;
      if (combinedFilter === 'completed' && !isCompleted) return false;
      if (combinedFilter === 'favorites' && !classEntry.is_favorite) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesClassName = classEntry.class_name.toLowerCase().includes(searchLower);
        const matchesElement = classEntry.element.toLowerCase().includes(searchLower);
        const matchesLevel = classEntry.level.toLowerCase().includes(searchLower);
        const matchesJudge = classEntry.judge_name.toLowerCase().includes(searchLower);
        const matchesSection = classEntry.section && classEntry.section !== '-'
          ? classEntry.section.toLowerCase().includes(searchLower)
          : false;

        if (!matchesClassName && !matchesElement && !matchesLevel && !matchesJudge && !matchesSection) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'class_order':
          // Default: class_order, then element, then level, then section
          if (a.class_order !== b.class_order) {
            return a.class_order - b.class_order;
          }
          if (a.element !== b.element) {
            return a.element.localeCompare(b.element);
          }
          if (a.level !== b.level) {
            const levelOrder = { 'novice': 1, 'advanced': 2, 'excellent': 3, 'master': 4, 'masters': 4 };
            const aLevelOrder = levelOrder[a.level.toLowerCase() as keyof typeof levelOrder] || 999;
            const bLevelOrder = levelOrder[b.level.toLowerCase() as keyof typeof levelOrder] || 999;
            if (aLevelOrder !== bLevelOrder) {
              return aLevelOrder - bLevelOrder;
            }
            return a.level.localeCompare(b.level);
          }
          return a.section.localeCompare(b.section);

        case 'element_level':
          // Sort by element first, then level (standard progression)
          if (a.element !== b.element) {
            return a.element.localeCompare(b.element);
          }
          if (a.level !== b.level) {
            const aLevelOrder = getLevelSortOrder(a.level);
            const bLevelOrder = getLevelSortOrder(b.level);
            if (aLevelOrder !== bLevelOrder) {
              return aLevelOrder - bLevelOrder;
            }
            return a.level.localeCompare(b.level);
          }
          return a.section.localeCompare(b.section);

        case 'level_element':
          // Sort by level first (standard progression), then element
          if (a.level !== b.level) {
            const aLevelOrder = getLevelSortOrder(a.level);
            const bLevelOrder = getLevelSortOrder(b.level);
            if (aLevelOrder !== bLevelOrder) {
              return aLevelOrder - bLevelOrder;
            }
            return a.level.localeCompare(b.level);
          }
          if (a.element !== b.element) {
            return a.element.localeCompare(b.element);
          }
          return a.section.localeCompare(b.section);

        default:
          return 0;
      }
    });

    return filtered;
  }, [groupedClasses, combinedFilter, searchTerm, sortOrder]);

  // Show loading skeleton only if actively loading and no data exists
  if (isLoading && !trialInfo && classes.length === 0) {
    return (
      <div className="class-list-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading classes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry button if fetch failed
  if (fetchError) {
    return (
      <div className="class-list-container">
        <ErrorState
          message={`Failed to load classes: ${fetchError.message || 'Please check your connection and try again.'}`}
          onRetry={handleRefresh}
          isRetrying={isRefreshing}
        />
      </div>
    );
  }

  if (!trialInfo) {
    return (
      <div className="class-list-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-foreground text-lg font-semibold mb-2">Trial not found</p>
            <button
              onClick={() => navigate(-1)}
              className="icon-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`class-list-container ${isLoaded ? 'loaded' : ''}`} data-loaded={isLoaded}>
      {/* Enhanced Header with Trial Info */}
      <header className="page-header class-list-header">
        <HamburgerMenu
          currentPage="entries"
          backNavigation={{
            label: "Back to Home",
            action: () => navigate('/home')
          }}
        />
        <CompactOfflineIndicator />

        <div className="trial-info">
          <h1>
            <List className="title-icon" />
            {trialInfo.trial_name}
          </h1>
          <div className="trial-subtitle">
            <div className="trial-info-row">
              <div className="trial-details-group">
                <TrialDateBadge
                  date={trialInfo.trial_date}
                  trialNumber={trialInfo.trial_number}
                  dateOnly={true}
                />
                <span className="trial-detail">
                  <Target size={14}  style={{ width: '14px', height: '14px', flexShrink: 0 }} /> Trial {trialInfo.trial_number}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-buttons">
          {/* Background refresh indicator */}
          {isRefreshing && <RefreshIndicator isRefreshing={isRefreshing} />}

          {/* Filter button */}
          <FilterTriggerButton
            onClick={() => setIsFilterPanelOpen(true)}
            hasActiveFilters={searchTerm.length > 0 || sortOrder !== 'class_order'}
          />

          <button
            className="icon-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'rotating' : ''}`} />
          </button>
        </div>
      </header>

      {/* Tab Bar for filtering classes */}
      <ClassFilters
        combinedFilter={combinedFilter}
        setCombinedFilter={setCombinedFilter}
        classes={groupedClasses}
        hapticFeedback={hapticFeedback}
      />

      {/* Pull to Refresh Wrapper - wraps only scrollable content */}
      <PullToRefresh
        onRefresh={handleRefresh}
        enabled={settings.pullToRefresh}
        threshold={80}
      >

      {/* Scrollable Content Area - only the grid scrolls */}
      <div className="class-list-scrollable">
        {/* Enhanced Classes List Section */}
        <div className="grid-responsive">
          {filteredClasses.map((classEntry) => (
            <ClassCard
              key={classEntry.id}
              classEntry={classEntry}
              hasPermission={hasPermission}
              toggleFavorite={toggleFavorite}
              handleViewEntries={handleViewEntries}
              setActivePopup={setActivePopup}
              setSelectedClassForStatus={setSelectedClassForStatus}
              setStatusDialogOpen={setStatusDialogOpen}
              activePopup={activePopup}
              getStatusColor={getStatusColor}
              getFormattedStatus={getFormattedStatus}
              onMenuClick={(classId) => {
                setActivePopup(classId);
              }}
              onPrefetch={() => handleClassPrefetch(classEntry.id)}
            />
          ))}
        </div>
      </div>

      {/* Navigation Menu Popup */}
      {activePopup !== null && createPortal(
        <div
          className="dialog-overlay"
          onClick={() => setActivePopup(null)}
        >
          <div
            className="dialog-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header">
              <div className="dialog-title">
                <List className="title-icon" />
                <span>Class Options</span>
              </div>
              <button
                className="close-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePopup(null);
                }}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="dialog-content">
              {/* Class Info Header */}
              <div className="class-info-header">
                <h3 className="class-title">
                  {classes.find(c => c.id === activePopup)?.class_name || ''}
                </h3>
              </div>
              <div className="class-options-grid">
                <button
                  className="class-option-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    const classData = classes.find(c => c.id === activePopup);
                    if (classData) {
                      setSelectedClassForRequirements(classData);
                      setRequirementsDialogOpen(true);
                    }
                    setActivePopup(null);
                  }}
                >
                  <div className="class-option-icon icon-primary">
                    <ClipboardList size={20} />
                  </div>
                  <div className="class-option-label">Requirements</div>
                  <div className="class-option-description">View class rules and requirements</div>
                </button>

                <button
                  className="class-option-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    const classData = classes.find(c => c.id === activePopup);
                    if (classData) {
                      setSelectedClassForMaxTime(classData);
                      setMaxTimeDialogOpen(true);
                      setShowMaxTimeWarning(false);
                    }
                    setActivePopup(null);
                  }}
                >
                  <div className="class-option-icon icon-accent">
                    <Clock size={20} />
                  </div>
                  <div className="class-option-label">Set Max Time</div>
                  <div className="class-option-description">Configure maximum time limits</div>
                </button>

                <button
                  className="class-option-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    const classData = classes.find(c => c.id === activePopup);
                    if (classData) {
                      setSelectedClassForSettings(classData);
                      setSettingsDialogOpen(true);
                    }
                    setActivePopup(null);
                  }}
                >
                  <div className="class-option-icon icon-muted">
                    <Settings size={20} />
                  </div>
                  <div className="class-option-label">Settings</div>
                  <div className="class-option-description">Configure class settings</div>
                </button>

                <button
                  className="class-option-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (trialId && activePopup !== null) {
                      // Check if class has any scored entries before navigating
                      const classEntry = classes.find(c => c.id === activePopup);
                      if (classEntry && classEntry.completed_count === 0) {
                        // No scored entries - show dialog instead of navigating
                        setNoStatsClassName(classEntry.class_name);
                        setNoStatsDialogOpen(true);
                        setActivePopup(null);
                        return;
                      }
                      navigate(`/stats/trial/${trialId}?classId=${activePopup}`);
                    }
                    setActivePopup(null);
                  }}
                >
                  <div className="class-option-icon icon-success">
                    <BarChart3 size={20} />
                  </div>
                  <div className="class-option-label">Statistics</div>
                  <div className="class-option-description">View class performance data</div>
                </button>

                <button
                  className="class-option-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activePopup !== null) {
                      handleGenerateCheckIn(activePopup);
                    }
                  }}
                >
                  <div className="class-option-icon icon-warning">
                    <FileText size={20} />
                  </div>
                  <div className="class-option-label">Check-In Sheet</div>
                  <div className="class-option-description">Print check-in roster</div>
                </button>

                <button
                  className="class-option-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activePopup !== null) {
                      handleGenerateResults(activePopup);
                    }
                  }}
                >
                  <div className="class-option-icon icon-secondary">
                    <Award size={20} />
                  </div>
                  <div className="class-option-label">Results Sheet</div>
                  <div className="class-option-description">Print results report</div>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Class Requirements Dialog */}
      <ClassRequirementsDialog
        isOpen={requirementsDialogOpen}
        onClose={() => {
          setRequirementsDialogOpen(false);
          setSelectedClassForRequirements(null);
        }}
        onSetMaxTime={() => {
          // Close requirements dialog and open max time dialog with same class
          setRequirementsDialogOpen(false);
          setSelectedClassForMaxTime(selectedClassForRequirements);
          setMaxTimeDialogOpen(true);
          setShowMaxTimeWarning(false); // No warning for manual access
        }}
        classData={selectedClassForRequirements || {
          id: 0,
          element: '',
          level: '',
          class_name: '',
          entry_count: 0
        }}
      />

      {/* Max Time Dialog */}
      <MaxTimeDialog
        isOpen={maxTimeDialogOpen}
        showWarning={showMaxTimeWarning}
        onClose={() => {
          setMaxTimeDialogOpen(false);
          setSelectedClassForMaxTime(null);
          setShowMaxTimeWarning(false);
        }}
        classData={selectedClassForMaxTime || {
          id: 0,
          element: '',
          level: '',
          class_name: ''
        }}
        onTimeUpdate={() => {
          // Refresh class data after time update
          refetch();
        }}
      />

      </PullToRefresh>

      {/* Class Status Dialog */}
      <ClassStatusDialog
        isOpen={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setSelectedClassForStatus(null);
        }}
        onStatusChange={(status: string, timeValue?: string) => {
          if (selectedClassForStatus) {
            const typedStatus = status as ClassEntry['class_status'];
            if (timeValue) {
              handleClassStatusChangeWithTime(selectedClassForStatus.id, typedStatus, timeValue);
            } else {
              handleClassStatusChange(selectedClassForStatus.id, typedStatus);
            }
          }
        }}
        classData={selectedClassForStatus || {
          id: 0,
          element: '',
          level: '',
          class_name: '',
          class_status: '',
          entry_count: 0,
          briefing_time: undefined,
          break_until_time: undefined,
          start_time: undefined
        }}
        currentStatus={selectedClassForStatus?.class_status || ''}
      />

      {/* Class Settings Dialog */}
      <ClassSettingsDialog
        isOpen={settingsDialogOpen}
        onClose={() => {
          setSettingsDialogOpen(false);
          setSelectedClassForSettings(null);
        }}
        classData={selectedClassForSettings || {
          id: 0,
          element: '',
          level: '',
          class_name: '',
          self_checkin_enabled: true
        }}
        onSettingsUpdate={() => {
          // Refresh class data after settings update
          refetch();
        }}
      />

      {/* No Entries Dialog - shown when clicking a class with 0 entries */}
      <NoEntriesDialog
        isOpen={noEntriesDialogOpen}
        onClose={() => {
          setNoEntriesDialogOpen(false);
          setNoEntriesClassName(undefined);
        }}
        className={noEntriesClassName}
      />

      {/* No Stats Dialog - shown when clicking Statistics for a class with no scored entries */}
      <NoStatsDialog
        isOpen={noStatsDialogOpen}
        onClose={() => {
          setNoStatsDialogOpen(false);
          setNoStatsClassName(undefined);
        }}
        className={noStatsClassName}
      />

      {/* Filter Panel Slide-out */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search classes..."
        sortOptions={sortOptions}
        sortOrder={sortOrder}
        onSortChange={(order) => setSortOrder(order as typeof sortOrder)}
        resultsLabel={`${filteredClasses.length} of ${groupedClasses.length} classes`}
        title="Search & Sort Classes"
      />
    </div>
  );
};