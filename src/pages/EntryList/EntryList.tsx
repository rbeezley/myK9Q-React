import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { getClassEntries, updateEntryCheckinStatus, subscribeToEntryUpdates, resetEntryScore, updateExhibitorOrder, markInRing } from '../../services/entryService';
import { Entry } from '../../stores/entryStore';
import { HamburgerMenu, HeaderTicker, TrialDateBadge } from '../../components/ui';
import { CheckinStatusDialog } from '../../components/dialogs/CheckinStatusDialog';
import { SortableEntryCard } from './SortableEntryCard';
import { Search, X, Clock, CheckCircle, ArrowUpDown, GripVertical, Target, User, ChevronDown, Trophy, RefreshCw, ClipboardCheck, Printer } from 'lucide-react';
import { parseOrganizationData } from '../../utils/organizationUtils';
import { generateCheckInSheet, generateResultsSheet, ReportClassInfo } from '../../services/reportService';
import { getScoresheetRoute } from '../../services/scoresheetRouter';
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
import { supabase } from '../../lib/supabase';
import './EntryList.css';

type TabType = 'pending' | 'completed';

export const EntryList: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { showContext, role } = useAuth();
  const { hasPermission } = usePermission();
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [classInfo, setClassInfo] = useState<{
    className: string;
    element: string;
    level: string;
    section: string;
    trialDate?: string;
    trialNumber?: string;
    judgeName?: string;
    actualClassId?: number; // The real classid for real-time subscriptions
    selfCheckin?: boolean; // Controls if exhibitors can check themselves in
    classStatus?: string; // Class status: in_progress, briefing, start_time, setup, etc.
    totalEntries?: number;
    completedEntries?: number;
    timeLimit?: string; // Max time for area 1
    timeLimit2?: string; // Max time for area 2
    timeLimit3?: string; // Max time for area 3
    areas?: number; // Number of areas
  } | null>(null);
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
  const [refreshing, setRefreshing] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  // Removed showSearch state - using persistent search instead

  // Helper function to validate and normalize text-based status
  const normalizeStatusText = (statusText: string | null | undefined): 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' => {
    if (!statusText) return 'none';

    const status = statusText.toLowerCase().trim();
    switch (status) {
      case 'none': return 'none';
      case 'checked-in': return 'checked-in';
      case 'at-gate': return 'at-gate';
      case 'conflict': return 'conflict';
      case 'pulled': return 'pulled';
      default: return 'none';
    }
  };

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
        const otherEntries = entries.filter(entry => !currentEntries.find(ce => ce.id === entry.id));
        const newAllEntries = [...otherEntries, ...reorderedCurrentEntries];
        setEntries(newAllEntries);
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
          setEntries(updatedEntries);
          
          console.log('✅ Successfully updated run order in database');
        } catch (error) {
          console.error('❌ Failed to update run order in database:', error);
          // TODO: Show user error message and optionally revert local changes
        } finally {
          setIsUpdatingOrder(false);
        }
      }
    }
  };

  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, showContext]);

  // Subscribe to real-time entry updates
  useEffect(() => {
    if (!classId || !showContext?.licenseKey || !classInfo?.actualClassId) {
      console.log('⚠️ Not setting up real-time subscription yet:', {
        classId: !!classId,
        licenseKey: !!showContext?.licenseKey,
        actualClassId: !!classInfo?.actualClassId
      });
      return;
    }

    console.log('🔌 Setting up real-time subscription for ACTUAL classId:', classInfo.actualClassId, '(URL classId was:', classId, ')');
    console.log('🔑 License key:', showContext.licenseKey);

    const unsubscribeEntries = subscribeToEntryUpdates(
      classInfo.actualClassId, // Use the ACTUAL classid (275) instead of URL parameter (340)
      showContext.licenseKey,
      (payload) => {
        console.log('🔄 Real-time entry update received:', payload);
        console.log('🔄 Event type:', payload.eventType);
        console.log('🔄 Old data:', payload.old);
        console.log('🔄 New data:', payload.new);

        const newData = payload.new as any;
        const oldData = payload.old as any;

        // Check if this is an in_ring status change
        if (newData?.in_ring !== oldData?.in_ring) {
          console.log('📍 In-ring status changed:', {
            entryId: newData?.id,
            oldInRing: oldData?.in_ring,
            newInRing: newData?.in_ring,
            armband: newData?.armband
          });
        }

        // Check if this is a check-in status change (text field)
        if (newData?.check_in_status_text !== oldData?.check_in_status_text) {
          console.log('🏁 Check-in status changed:', {
            entryId: newData?.id,
            oldCheckIn: oldData?.check_in_status_text,
            newCheckIn: newData?.check_in_status_text,
            armband: newData?.armband,
            statusText: normalizeStatusText(newData?.check_in_status_text)
          });
        }

        // Instead of reloading all entries, update only the specific entry that changed
        if (newData?.id) {
          console.log('🎯 Updating specific entry ID:', newData.id, 'without full page reload');

          setEntries(prev => prev.map(entry => {
            if (entry.id === newData.id) {
              const updatedEntry = {
                ...entry,
                inRing: newData.in_ring || false,
                // Note: isScored comes from results table, not entries table
                // So we only update it if it's actually present in the payload
                isScored: newData.is_scored !== undefined ? newData.is_scored : entry.isScored,
                resultText: newData.result_text || entry.resultText,
                searchTime: newData.search_time || entry.searchTime,
                faultCount: newData.fault_count || entry.faultCount,
                placement: newData.placement || entry.placement,
                checkinStatus: normalizeStatusText(newData.check_in_status_text) || entry.checkinStatus
              };

              console.log('✅ Updated entry:', {
                id: updatedEntry.id,
                armband: updatedEntry.armband,
                callName: updatedEntry.callName,
                inRing: updatedEntry.inRing,
                isScored: updatedEntry.isScored
              });

              return updatedEntry;
            }
            return entry;
          }));
        }
      }
    );

    // Also subscribe to results table changes for scoring updates
    const unsubscribeResults = supabase
      .channel(`results:${classInfo.actualClassId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'results'
        },
        (payload) => {
          console.log('🎯 Results table update received:', payload);
          const newData = payload.new as any;

          if (newData?.entry_id) {
            console.log('📊 Updating entry scoring status for entry_id:', newData.entry_id);

            setEntries(prev => prev.map(entry => {
              if (entry.id === newData.entry_id) {
                const updatedEntry = {
                  ...entry,
                  isScored: newData.is_scored || false,
                  inRing: newData.is_in_ring || false,
                  resultText: newData.result_status || entry.resultText,
                  searchTime: newData.search_time_seconds?.toString() || entry.searchTime,
                  faultCount: newData.total_faults ?? entry.faultCount,
                  placement: newData.final_placement ?? entry.placement
                };

                console.log('✅ Updated entry from results:', {
                  id: updatedEntry.id,
                  armband: updatedEntry.armband,
                  callName: updatedEntry.callName,
                  isScored: updatedEntry.isScored,
                  resultText: updatedEntry.resultText
                });

                return updatedEntry;
              }
              return entry;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribeEntries();
      unsubscribeResults.unsubscribe();
    };
  }, [classId, showContext?.licenseKey, classInfo?.actualClassId]);

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
    }, 250); // Increased delay to ensure CSS is fully loaded and applied

    return () => clearTimeout(timer);
  }, []);

  const handleStatusChange = async (entryId: number, status: NonNullable<Entry['checkinStatus']>) => {
    console.log('🔄 EntryList: handleStatusChange called with:', { entryId, status });
    // Store original state for potential rollback
    const originalEntries = entries;

    try {
      // Close the popup first to prevent multiple clicks
      setActiveStatusPopup(null);
      _setPopupPosition(null);

      // Update local state immediately for better UX
      setEntries(prev => {
        const newEntries = prev.map(entry =>
          entry.id === entryId
            ? {
                ...entry,
                checkedIn: status !== 'none',
                checkinStatus: status,
                inRing: false, // Clear in-ring status when manually changing status
              }
            : entry
        );
        return newEntries;
      });

      // Make API call to update database - always update, including 'none' status
      await updateEntryCheckinStatus(entryId, status);
      
    } catch (error) {
      console.error('❌ EntryList: Failed to update check-in status:', error);
      
      // Revert local state changes on error
      setEntries(originalEntries);
      
      // Show error message to user
      alert(`Failed to update check-in status: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleStatusClick = (e: React.MouseEvent, entryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    // Check if exhibitor can check themselves in
    const canCheckIn = hasPermission('canCheckInDogs');
    const isSelfCheckinEnabled = classInfo?.selfCheckin ?? true;
    const userRole = role;

    console.log('🔐 Permission check:', { canCheckIn, isSelfCheckinEnabled, userRole, isExhibitor: userRole === 'exhibitor' });

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

  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;
    
    console.log('🔄 LoadEntries called - refreshing entry data...');
    setIsLoading(true);
    setError(null);
    
    try {
      const classEntries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      
      // Debug: Show in-ring status for all entries
      const inRingEntries = classEntries.filter(entry => entry.inRing);
      if (inRingEntries.length > 0) {
        console.log('📍 In-ring entries found:', inRingEntries.map(e => ({
          id: e.id,
          armband: e.armband,
          callName: e.callName,
          inRing: e.inRing
        })));
      } else {
        console.log('📍 No entries currently in ring');
      }

      // Debug: Show scoring status for all entries
      const scoredEntries = classEntries.filter(entry => entry.isScored);
      console.log('🐛 SCORED ENTRIES DEBUG:', {
        totalEntries: classEntries.length,
        scoredCount: scoredEntries.length,
        scoredEntries: scoredEntries.map(e => ({
          id: e.id,
          armband: e.armband,
          callName: e.callName,
          isScored: e.isScored,
          resultText: e.resultText
        })),
        allEntriesScoring: classEntries.map(e => ({
          id: e.id,
          armband: e.armband,
          callName: e.callName,
          isScored: e.isScored
        }))
      });

      setEntries(classEntries);
      
      // Get class info from first entry and fetch additional class data
      if (classEntries.length > 0) {
        const firstEntry = classEntries[0];
        
        // Fetch additional class data (judge, self check-in setting, status, entry counts)
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('judge_name, self_checkin_enabled, class_status, total_entry_count, completed_entry_count')
          .eq('id', parseInt(classId))
          .single();

        console.log('🔍 Class data fetched:', classData);
        console.log('🔍 Class error:', classError);
        
        // SCHEMA DISCOVERY: Get a complete sample record to see all available fields
        try {
          const { data: sampleClass, error: sampleError } = await supabase
            .from('classes')
            .select('*')
            .limit(1)
            .single();
          console.log('🔍 COMPLETE classes record with ALL fields:');
          console.log('🔍 STRUCTURE:', Object.keys(sampleClass || {}).sort());
          console.log('🔍 SAMPLE DATA:', sampleClass);
          console.log('🔍 Sample error:', sampleError);
        } catch (schemaError) {
          console.log('🔍 Schema discovery failed:', schemaError);
        }
          
        // Get judge name from class data
        const judgeName = classData?.judge_name || 'No Judge Assigned';
        
        const classInfoData = {
          className: firstEntry.className,
          element: firstEntry.element || '',
          level: firstEntry.level || '',
          section: firstEntry.section || '',
          trialDate: firstEntry.trialDate || '',
          trialNumber: firstEntry.trialNumber ? String(firstEntry.trialNumber) : '',
          judgeName: judgeName || 'No Judge Assigned',
          actualClassId: firstEntry.actualClassId, // Store the actual classid for real-time subscriptions
          selfCheckin: classData?.self_checkin_enabled ?? true, // Default to true if not set
          classStatus: classData?.class_status,
          totalEntries: classData?.total_entry_count,
          completedEntries: classData?.completed_entry_count,
          timeLimit: firstEntry.timeLimit,
          timeLimit2: firstEntry.timeLimit2,
          timeLimit3: firstEntry.timeLimit3,
          areas: firstEntry.areas
        };
        
        console.log('🔍 Setting class info:', classInfoData);
        setClassInfo(classInfoData);
      }
    } catch (err) {
      console.error('Error loading entries:', err);
      console.error('Error details:', err);
      setError(`Failed to load entries: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  // Print report handlers
  const handlePrintCheckIn = () => {
    if (!classInfo) return;

    const orgData = parseOrganizationData(showContext?.org || '');
    const reportClassInfo: ReportClassInfo = {
      className: classInfo.className,
      element: classInfo.element,
      level: classInfo.level,
      section: classInfo.section,
      trialDate: classInfo.trialDate || '',
      trialNumber: classInfo.trialNumber || '',
      judgeName: classInfo.judgeName || 'TBD',
      organization: orgData.organization,
      activityType: orgData.activity_type
    };

    generateCheckInSheet(reportClassInfo, entries);
    setShowPrintMenu(false);
  };

  const handlePrintResults = () => {
    if (!classInfo) return;

    const orgData = parseOrganizationData(showContext?.org || '');
    const reportClassInfo: ReportClassInfo = {
      className: classInfo.className,
      element: classInfo.element,
      level: classInfo.level,
      section: classInfo.section,
      trialDate: classInfo.trialDate || '',
      trialNumber: classInfo.trialNumber || '',
      judgeName: classInfo.judgeName || 'TBD',
      organization: orgData.organization,
      activityType: orgData.activity_type
    };

    generateResultsSheet(reportClassInfo, entries);
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
        // Only clear other dogs if this dog is not already in ring
        // This prevents clearing the dog that's currently being scored
        const currentDog = entries.find(entry => entry.id === dogId);
        if (!currentDog?.inRing) {
          // First clear all other dogs in this class (but not the target dog)
          const otherEntries = entries.filter(entry => entry.id !== dogId && entry.inRing);
          if (otherEntries.length > 0) {
            await Promise.all(
              otherEntries.map(entry => markInRing(entry.id, false))
            );
          }
        }
      }
      
      // Now set the specific dog's status (only if it's different)
      const currentDog = entries.find(entry => entry.id === dogId);
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
    // Don't navigate if the entry is already scored
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
        // Update local state to reflect the change immediately
        setEntries(prev => prev.map(e => 
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
      left: rect.left - 100 // Offset left since menu is wider
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

  // Filter and sort entries (memoized for performance) - MUST be before early returns
  const filteredEntries = useMemo(() => {
    return entries
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
        // When in manual mode (drag mode or after dragging), use the manual order
        if (sortOrder === 'manual') {
          const aIndex = manualOrder.findIndex(entry => entry.id === a.id);
          const bIndex = manualOrder.findIndex(entry => entry.id === b.id);
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          // Fall back to armband if not in manual order
          return a.armband - b.armband;
        }

        if (sortOrder === 'run') {
          // Sort by exhibitor_order (when available), then by armband
          const aOrder = a.exhibitorOrder || a.armband;
          const bOrder = b.exhibitorOrder || b.armband;
          return aOrder - bOrder;
        } else if (sortOrder === 'placement') {
          // Sort by placement (1st, 2nd, 3rd, etc.)
          // Dogs with placements come first, sorted by placement
          // Dogs without placements come after, sorted by armband
          const aPlacement = a.placement || 999;
          const bPlacement = b.placement || 999;
          if (aPlacement !== bPlacement) {
            return aPlacement - bPlacement;
          }
          // If both have same placement (or both have none), sort by armband
          return a.armband - b.armband;
        } else {
          // Sort by armband number
          return a.armband - b.armband;
        }
      });
  }, [entries, searchTerm, sortOrder, manualOrder]);

  const pendingEntries = useMemo(() => filteredEntries.filter(e => !e.isScored), [filteredEntries]);
  const completedEntries = useMemo(() => filteredEntries.filter(e => e.isScored), [filteredEntries]);

  const currentEntries = activeTab === 'pending' ? pendingEntries : completedEntries;

  // Early returns AFTER all hooks
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
            className={`icon-button ${refreshing ? 'rotating' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION START ===== */}
      <HeaderTicker />
      {/* ===== HEADER TICKER - EASILY REMOVABLE SECTION END ===== */}

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

      {/* Search Results Summary */}
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
              setIsDragMode(false); // Exit drag mode when switching sorts
            }}
          >
            <ArrowUpDown size={16} />
            Run Order
          </button>
          <button
            className={`sort-btn ${sortOrder === 'armband' ? 'active' : ''}`}
            onClick={() => {
              setSortOrder('armband');
              setIsDragMode(false); // Exit drag mode when switching sorts
            }}
          >
            <ArrowUpDown size={16} />
            Armband
          </button>
          <button
            className={`sort-btn ${sortOrder === 'placement' ? 'active' : ''}`}
            onClick={() => {
              setSortOrder('placement');
              setIsDragMode(false); // Exit drag mode when switching sorts
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
                  // Entering drag mode - preserve current visible order
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
            {filteredEntries.length} of {entries.length}
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
                const entry = entries.find(e => e.id === activeResetMenu);
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