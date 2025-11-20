import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { usePrefetch } from '@/hooks/usePrefetch';
import { supabase } from '../../lib/supabase';
import { useSettingsStore } from '@/stores/settingsStore';
import { HamburgerMenu, HeaderTicker, TrialDateBadge, RefreshIndicator, ErrorState, PullToRefresh } from '../../components/ui';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ArrowLeft, RefreshCw, Target, MoreVertical, ClipboardList, Clock, Settings, BarChart3, FileText, Award, X, List } from 'lucide-react';
// CSS imported in index.css to prevent FOUC
import { ClassRequirementsDialog } from '../../components/dialogs/ClassRequirementsDialog';
import { MaxTimeDialog } from '../../components/dialogs/MaxTimeDialog';
import { ClassStatusDialog } from '../../components/dialogs/ClassStatusDialog';
import { ClassSettingsDialog } from '../../components/dialogs/ClassSettingsDialog';
import { generateCheckInSheet, generateResultsSheet, ReportClassInfo } from '../../services/reportService';
import { Entry } from '../../stores/entryStore';
import { getClassEntries } from '../../services/entryService';
import { parseOrganizationData } from '../../utils/organizationUtils';
import { getClassDisplayStatus } from '../../utils/statusUtils';
import { getLevelSortOrder } from '../../lib/utils';
import { ClassCard } from './ClassCard';
import { ClassFilters } from './ClassFilters';
import { useClassListData, ClassEntry, TrialInfo } from './hooks/useClassListData';
import { findPairedNoviceClass, groupNoviceClasses } from './utils/noviceClassGrouping';
import { getContextualPreview, getFormattedStatus, getStatusColor } from './utils/statusFormatting';

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

  // Local state for data (synced from React Query)
  const [favoriteClasses, setFavoriteClasses] = useState<Set<number>>(() => {
    console.log('🔄 Initializing favoriteClasses state');
    return new Set();
  });
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [combinedFilter, setCombinedFilter] = useState<'pending' | 'favorites' | 'completed'>('pending');
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedClassForStatus, setSelectedClassForStatus] = useState<ClassEntry | null>(null);
  const [requirementsDialogOpen, setRequirementsDialogOpen] = useState(false);
  const [selectedClassForRequirements, setSelectedClassForRequirements] = useState<ClassEntry | null>(null);
  const [maxTimeDialogOpen, setMaxTimeDialogOpen] = useState(false);
  const [selectedClassForMaxTime, setSelectedClassForMaxTime] = useState<ClassEntry | null>(null);
  const [showMaxTimeWarning, setShowMaxTimeWarning] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedClassForSettings, setSelectedClassForSettings] = useState<ClassEntry | null>(null);

  // Search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'class_order' | 'element_level' | 'level_element'>('class_order');
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(true);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Prevent FOUC by adding 'loaded' class after mount
  const [isLoaded, setIsLoaded] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowHeaderMenu(false);
      }
    };

    if (showHeaderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHeaderMenu]);

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

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const favoritesKey = `favorites_${showContext?.licenseKey || 'default'}_${trialId}`;
        console.log('🔍 Loading with key:', favoritesKey);
        console.log('🗄️ All localStorage keys:', Object.keys(localStorage));
        console.log('🗄️ All localStorage favorites keys:', Object.keys(localStorage).filter(k => k.startsWith('favorites_')));
        const savedFavorites = localStorage.getItem(favoritesKey);
        console.log('💾 Raw localStorage value for key:', savedFavorites);
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites) as number[];
          console.log('📥 Setting favoriteClasses from localStorage:', favoriteIds);
          setFavoriteClasses(new Set(favoriteIds));
        } else {
          console.log('❌ No saved favorites found, setting empty set');
          setFavoriteClasses(new Set());
        }
        setFavoritesLoaded(true);
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    };
    
    if (showContext?.licenseKey && trialId) {
      loadFavorites();
    }
  }, [showContext?.licenseKey, trialId]);

  // Save favorites to localStorage whenever favoriteClasses changes (but only after initial load)
  useEffect(() => {
    if (showContext?.licenseKey && trialId && favoritesLoaded) {
      try {
        const favoritesKey = `favorites_${showContext.licenseKey}_${trialId}`;
        const favoriteIds = Array.from(favoriteClasses);
        console.log('💾 Saving favorites to localStorage:', favoritesKey, favoriteIds);
        localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds));
        console.log('✅ Saved to localStorage successfully');
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    } else {
      console.log('⚠️ Not saving favorites - missing context, trialId, or not loaded yet:', { licenseKey: showContext?.licenseKey, trialId, favoritesLoaded, size: favoriteClasses.size });
    }
  }, [favoriteClasses, showContext?.licenseKey, trialId, favoritesLoaded]);

  // Update classes' is_favorite property when favoriteClasses changes
  useEffect(() => {
    if (classes.length > 0) {
      console.log('🔄 Updating classes is_favorite based on favoriteClasses:', Array.from(favoriteClasses));
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

  // Print report handlers
  const handleGenerateCheckIn = async (classId: number) => {
    try {
      const classData = classes.find(c => c.id === classId);
      if (!classData || !showContext?.licenseKey) return;

      const entries = await getClassEntries(classId, showContext.licenseKey);
      const orgData = parseOrganizationData(showContext?.org || '');

      const reportClassInfo: ReportClassInfo = {
        className: classData.class_name || '',
        element: classData.element || '',
        level: classData.level || '',
        section: classData.section || '',
        trialDate: trialInfo?.trial_date || '',
        trialNumber: trialInfo?.trial_number?.toString() || '',
        judgeName: classData.judge_name || 'TBD',
        organization: orgData.organization,
        activityType: orgData.activity_type
      };

      generateCheckInSheet(reportClassInfo, entries);
      setActivePopup(null);
    } catch (error) {
      console.error('Error generating check-in sheet:', error);
      alert('Error generating check-in sheet. Please try again.');
    }
  };

  const handleGenerateResults = async (classId: number) => {
    try {
      const classData = classes.find(c => c.id === classId);
      if (!classData || !showContext?.licenseKey) return;

      const entries = await getClassEntries(classId, showContext.licenseKey);
      const completedEntries = entries.filter((e: Entry) => e.isScored);

      if (completedEntries.length === 0) {
        alert('No scored entries to display in results sheet.');
        setActivePopup(null);
        return;
      }

      const orgData = parseOrganizationData(showContext?.org || '');
      const reportClassInfo: ReportClassInfo = {
        className: classData.class_name || '',
        element: classData.element || '',
        level: classData.level || '',
        section: classData.section || '',
        trialDate: trialInfo?.trial_date || '',
        trialNumber: trialInfo?.trial_number?.toString() || '',
        judgeName: classData.judge_name || 'TBD',
        organization: orgData.organization,
        activityType: orgData.activity_type
      };

      generateResultsSheet(reportClassInfo, entries);
      setActivePopup(null);
    } catch (error) {
      console.error('Error generating results sheet:', error);
      alert('Error generating results sheet. Please try again.');
    }
  };

  // Subscribe to real-time entry updates for all classes in this trial
  useEffect(() => {
    if (!trialId || !showContext?.licenseKey) return;

    // Subscribe to entry changes that affect classes in this trial
    const subscription = supabase
      .channel(`entries-trial-${trialId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes'
        },
        (payload) => {
          console.log('🔄 Real-time: Class update received');
          console.log('🔄 Real-time payload:', payload);
          console.log('🔄 Real-time timestamp:', new Date().toISOString());

          // For class updates, update local state directly instead of full reload
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            console.log('🔄 Real-time: Updating class locally:', payload.new.id);
            setClasses(prev => prev.map(c =>
              c.id === payload.new.id
                ? {
                    ...c,
                    class_status: payload.new.class_status || 'none',
                    is_completed: payload.new.is_completed || false
                  }
                : c
            ));
          } else {
            // For other changes (INSERT, DELETE), do full refresh
            console.log('🔄 Real-time: Full refresh needed for:', payload.eventType);
            refetch();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [trialId, showContext?.licenseKey, refetch]);

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
        // Fetch entries for this class
        const { data: entriesData } = await supabase
          .from('entries')
          .select(`
            *,
            classes!inner (element, level, section, trial_id)
          `)
          .eq('class_id', classId)
          .order('armband_number', { ascending: true });

        console.log('📡 Prefetched class entries:', classId, entriesData?.length || 0);
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



  // Function to set a dog's in-ring status
  const _setDogInRingStatus = async (dogId: number, inRing: boolean) => {
    try {
      const { error } = await supabase
        .from('entries')
        .update({ is_in_ring: inRing })
        .eq('id', dogId);

      if (error) {
        console.error('Error updating dog ring status:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error setting dog ring status:', error);
      return false;
    }
  };


  // Function for handling status changes with inline time inputs
  const handleClassStatusChangeWithTime = async (classId: number, status: ClassEntry['class_status'], timeValue: string) => {
    console.log('🕐 Status change with time:', { classId, status, timeValue });

    // Find the class entry to check if it has a paired class
    const classEntry = classes.find(c => c.id === classId);
    const pairedId = classEntry?.pairedClassId;
    const idsToUpdate = pairedId ? [classId, pairedId] : [classId];

    console.log('🕐 Updating class IDs with time:', idsToUpdate);

    // Convert 'no-status' to null for database
    const dbStatus = status === 'no-status' ? null : status;
    const updateData: any = {
      class_status: dbStatus
    };

    // Store the time in appropriate time column
    switch (status) {
      case 'briefing':
        updateData.briefing_time = timeValue;
        break;
      case 'break':
        updateData.break_until = timeValue;
        break;
      case 'start_time':
        updateData.start_time = timeValue;
        break;
    }

    // Update local state with both status and time
    setClasses(prev => prev.map(c => {
      if (idsToUpdate.includes(c.id)) {
        const updatedClass = { ...c, class_status: status };

        // Store the time values in local state
        switch (status) {
          case 'briefing':
            updatedClass.briefing_time = timeValue;
            break;
          case 'break':
            updatedClass.break_until = timeValue;
            break;
          case 'start_time':
            updatedClass.start_time = timeValue;
            break;
        }

        return updatedClass;
      }
      return c;
    }));

    // Close dialog
    setStatusDialogOpen(false);
    setSelectedClassForStatus(null);

    // Update database - update all IDs (both A and B for combined Novice classes)
    try {

      // Note: The normalized classes table should support time columns
      // for briefing_time, break_until, or start_time

      const { error } = await supabase
        .from('classes')
        .update(updateData)
        .in('id', idsToUpdate);

      if (error) {
        console.error('❌ Error updating class status with time:', error);
        console.error('❌ Update data:', updateData);
        console.error('❌ Class IDs:', idsToUpdate);
        // Revert on error
        await refetch();
      } else {
        console.log('✅ Successfully updated class status with time');
        console.log('✅ Class IDs:', idsToUpdate);
      }
    } catch (error) {
      console.error('Exception updating class status:', error);
      await refetch();
    }
  };

  // Simplified function for statuses without time input
  const handleClassStatusChange = async (classId: number, status: ClassEntry['class_status']) => {
    console.log('🔄 ClassList: Updating class status:', { classId, status });

    // Find the class entry to check if it has a paired class
    const classEntry = classes.find(c => c.id === classId);
    const pairedId = classEntry?.pairedClassId;
    const idsToUpdate = pairedId ? [classId, pairedId] : [classId];

    console.log('🔄 ClassList: Updating class IDs:', idsToUpdate);

    // Convert 'no-status' to null for database
    const dbStatus = status === 'no-status' ? null : status;
    const updateData = {
      class_status: dbStatus
    };

    console.log('✅ Converting status for DB:', { uiStatus: status, dbStatus });

    console.log('🔄 ClassList: Update data:', updateData);

    // Update local state immediately for better UX
    setClasses(prev => prev.map(c =>
      idsToUpdate.includes(c.id) ? { ...c, class_status: status } : c
    ));

    // Close dialog
    setStatusDialogOpen(false);
    setSelectedClassForStatus(null);

    // Update database - update all IDs (both A and B for combined Novice classes)
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(updateData)
        .in('id', idsToUpdate);

      if (error) {
        console.error('❌ Error updating class status:', error);
        console.error('❌ Update data:', updateData);
        console.error('❌ Class IDs:', idsToUpdate);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        // Revert on error
        await refetch();
      } else {
        console.log('✅ Successfully updated class status');
        console.log('✅ Class IDs:', idsToUpdate);
        console.log('✅ New status:', status);
        console.log('✅ DB status value:', status);
        console.log('✅ Update data:', updateData);
        console.log('✅ Response data:', data);
      }
    } catch (error) {
      console.error('💥 Exception updating class status:', error);
      await refetch();
    }
  };

  const toggleFavorite = async (classId: number) => {
    const classEntry = classes.find(c => c.id === classId);
    const isCurrentlyFavorite = classEntry?.is_favorite;
    console.log('💖 Toggling favorite for class:', classId, 'Currently favorite:', isCurrentlyFavorite);

    // Enhanced haptic feedback for outdoor/gloved use
    if (isCurrentlyFavorite) {
      // Removing favorite - softer feedback
      hapticFeedback.light();
    } else {
      // Adding favorite - stronger feedback for confirmation
      hapticFeedback.medium();
    }

    // For combined Novice A & B classes, we need to find the paired class
    const pairedId = classEntry?.pairedClassId;
    const idsToToggle = pairedId ? [classId, pairedId] : [classId];

    // Update favorites set for localStorage persistence
    setFavoriteClasses(prev => {
      const newFavorites = new Set(prev);
      const shouldAdd = !newFavorites.has(classId);

      idsToToggle.forEach(id => {
        if (shouldAdd) {
          newFavorites.add(id);
          console.log('⭐ Adding to favorites:', id);
        } else {
          newFavorites.delete(id);
          console.log('🗑️ Removing from favorites:', id);
        }
      });

      console.log('💾 New favorites set:', Array.from(newFavorites));
      return newFavorites;
    });

    // Update classes state to reflect the change immediately
    setClasses(prev => prev.map(c =>
      idsToToggle.includes(c.id) ? { ...c, is_favorite: !c.is_favorite } : c
    ));
  };

  const getStatusColor = useCallback((status: ClassEntry['class_status'], classEntry?: ClassEntry) => {
    // Check is_completed first for consistent coloring
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
    // Check is_completed first, then fall back to class_status
    const displayStatus = getClassDisplayStatus(classEntry);

    // If detected as completed via is_completed or entry counts, show Completed
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

    console.log('📊 getFormattedStatus:', {
      classId: classEntry.id,
      status,
      briefing_time: classEntry.briefing_time,
      break_until: classEntry.break_until,
      start_time: classEntry.start_time,
      result
    });

    return result;
  }, []);

  const _getStatusLabel = (status: ClassEntry['class_status'], classEntry?: ClassEntry) => {
    switch (status) {
      case 'setup': return 'Setup';
      case 'briefing': {
        if (classEntry?.briefing_time) {
          return `Briefing ${classEntry.briefing_time}`;
        }
        return 'Briefing';
      }
      case 'break': {
        if (classEntry?.break_until) {
          return `Break Until ${classEntry.break_until}`;
        }
        return 'Break Until';
      }
      case 'start_time': {
        if (classEntry?.start_time) {
          return `Start ${classEntry.start_time}`;
        }
        return 'Start Time';
      }
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default:
        // Show intelligent status when class_status is 'none'
        if (classEntry) {
          const isCompleted = classEntry.completed_count === classEntry.entry_count && classEntry.entry_count > 0;
          const hasDogsInRing = classEntry.dogs.some(dog => dog.in_ring);

          if (isCompleted) return 'Completed';
          if (hasDogsInRing || classEntry.completed_count > 0) return 'In Progress';
          return 'Ready';
        }
        return 'Ready';
    }
  };

  // Helper function to group Novice A/B classes into combined entries
  const groupNoviceClassesCached = useCallback((classList: ClassEntry[]): ClassEntry[] => {
    return groupNoviceClasses(classList, findPaired);
  }, [findPaired]);

  // Search and sort functionality
  // Memoized filtered and sorted classes for performance optimization
  const filteredClasses = useMemo(() => {
    // First, group Novice A/B classes together
    const groupedClasses = groupNoviceClassesCached(classes);

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
  }, [classes, combinedFilter, searchTerm, sortOrder, groupNoviceClasses]);

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

          <div className="dropdown-container">
            <button
              className="icon-button"
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              aria-label="More options"
              title="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showHeaderMenu && (
              <div className="dropdown-menu" style={{ right: 0, minWidth: '180px' }}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    handleRefresh();
                  }}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`dropdown-icon ${isRefreshing ? 'rotating' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION START ===== */}
      <HeaderTicker />
      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION END ===== */}

      {/* Search, Sort, and Filter Controls - STICKY */}
      <ClassFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        combinedFilter={combinedFilter}
        setCombinedFilter={setCombinedFilter}
        isSearchCollapsed={isSearchCollapsed}
        setIsSearchCollapsed={setIsSearchCollapsed}
        classes={classes}
        filteredClasses={filteredClasses}
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
              getContextualPreview={getContextualPreview}
              onMenuClick={(classId, position) => {
                setActivePopup(null); // Close any existing popup
                setPopupPosition(position);
                // Re-open with new position
                setTimeout(() => setActivePopup(classId), 0);
              }}
              onPrefetch={() => handleClassPrefetch(classEntry.id)}
            />
          ))}
        </div>
      </div>

      {/* Navigation Menu Popup */}
      {activePopup !== null && (
        <div
          className={`popup-overlay ${popupPosition ? 'popup-overlay--positioned' : ''}`}
          onClick={() => setActivePopup(null)}
        >
          <div
            className="popup-container"
            onClick={(e) => e.stopPropagation()}
            style={popupPosition ? {
              position: 'fixed',
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}%`,
              transform: 'translateX(-50%)',
              margin: 0
            } : {}}
          >
            <div className="popup-content">
              <h3>
                <div className="popup-header-content">
                  <div className="popup-title">Class Options</div>
                  <div className="popup-subtitle">
                    {classes.find(c => c.id === activePopup)?.class_name || ''}
                  </div>
                </div>
                <button
                  className="popup-close-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePopup(null);
                  }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </h3>
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
        </div>
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

      {/* Class Status Dialog */}
      <ClassStatusDialog
        isOpen={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          setSelectedClassForStatus(null);
        }}
        onStatusChange={(status: string, timeValue?: string) => {
          if (selectedClassForStatus) {
            if (timeValue) {
              handleClassStatusChangeWithTime(selectedClassForStatus.id, status as any, timeValue);
            } else {
              handleClassStatusChange(selectedClassForStatus.id, status as any);
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

      </PullToRefresh>
    </div>
  );
};