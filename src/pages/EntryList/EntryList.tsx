import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { getClassEntries, updateEntryCheckinStatus, subscribeToEntryUpdates, resetEntryScore, updateExhibitorOrder, markInRing } from '../../services/entryService';
import { Entry } from '../../stores/entryStore';
import { Card, CardContent, ArmbandBadge, HamburgerMenu } from '../../components/ui';
import { DogCard } from '../../components/DogCard';
import { CheckinStatusDialog, CheckinStatus } from '../../components/dialogs/CheckinStatusDialog';
import { Search, X, Clock, CheckCircle, ArrowUpDown, GripVertical, Calendar, Target, User, Circle, Check, AlertTriangle, XCircle, Star } from 'lucide-react';
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
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  } | null>(null);
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeResetMenu, setActiveResetMenu] = useState<number | null>(null);
  const [resetMenuPosition, setResetMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [resetConfirmDialog, setResetConfirmDialog] = useState<{ show: boolean; entry: Entry | null }>({ show: false, entry: null });
  const [selfCheckinDisabledDialog, setSelfCheckinDisabledDialog] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'run' | 'armband' | 'manual'>('run');
  const [isDragMode, setIsDragMode] = useState(false);
  const [manualOrder, setManualOrder] = useState<Entry[]>([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  // Removed showSearch state - using persistent search instead

  // Helper function to convert database status codes to strings
  const convertStatusCodeToString = (statusCode: number | null | undefined): 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' => {
    switch (statusCode) {
      case 0: return 'none';
      case 1: return 'checked-in';
      case 2: return 'conflict';
      case 3: return 'pulled';
      case 4: return 'at-gate';
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
    if (!classId || !showContext?.licenseKey || !classInfo?.actualClassId) return;
    
    console.log('🔌 Setting up real-time subscription for ACTUAL classId:', classInfo.actualClassId, '(URL classId was:', classId, ')');
    
    const unsubscribe = subscribeToEntryUpdates(
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
        
        // Instead of reloading all entries, update only the specific entry that changed
        if (newData?.id) {
          console.log('🎯 Updating specific entry ID:', newData.id, 'without full page reload');
          
          setEntries(prev => prev.map(entry => {
            if (entry.id === newData.id) {
              const updatedEntry = {
                ...entry,
                inRing: newData.in_ring || false,
                isScored: newData.is_scored || false,
                resultText: newData.result_text || entry.resultText,
                searchTime: newData.search_time || entry.searchTime,
                faultCount: newData.fault_count || entry.faultCount,
                placement: newData.placement || entry.placement,
                checkinStatus: convertStatusCodeToString(newData.checkin_status) || entry.checkinStatus
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
    
    return unsubscribe;
  }, [classId, showContext?.licenseKey, classInfo?.actualClassId]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-popup') && !target.closest('.checkin-status') && !target.closest('.reset-menu') && !target.closest('.reset-menu-button')) {
        setActiveStatusPopup(null);
        setPopupPosition(null);
        setActiveResetMenu(null);
        setResetMenuPosition(null);
      }
    };

    if (activeStatusPopup !== null || activeResetMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeStatusPopup, activeResetMenu]);


  const handleStatusChange = async (entryId: number, status: NonNullable<Entry['checkinStatus']>) => {
    console.log('🔄 EntryList: handleStatusChange called with:', { entryId, status });
    // Store original state for potential rollback
    const originalEntries = entries;

    try {
      // Close the popup first to prevent multiple clicks
      setActiveStatusPopup(null);
      setPopupPosition(null);

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
    setPopupPosition({
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
      
      setEntries(classEntries);
      
      // Get class info from first entry and fetch additional class data
      if (classEntries.length > 0) {
        const firstEntry = classEntries[0];
        
        // Fetch additional class data (judge and self check-in setting)
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('judge_name, self_checkin_enabled')
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
          
          // Also try to find judge-related tables by trying common names
          const judgeTableTests = ['tbl_judge', 'tbl_judges', 'judges', 'judge_info', 'judge_list'];
          for (const tableName of judgeTableTests) {
            try {
              const { data: judgeTest, error: judgeError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1)
                .single();
              if (!judgeError && judgeTest) {
                console.log(`🔍 FOUND JUDGE TABLE "${tableName}" with sample record:`, judgeTest);
              }
            } catch (_e) {
              // Table doesn't exist, continue
            }
          }
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
          selfCheckin: classData?.self_checkin_enabled ?? true // Default to true if not set
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

  const parseOrganizationData = (orgString: string) => {
    if (!orgString || orgString.trim() === '') {
      // Default to AKC Scent Work for this show based on the user's report
      return {
        organization: 'AKC',
        activity_type: 'Scent Work'
      };
    }
    
    const parts = orgString.split(' ');
    const result = {
      organization: parts[0], // "AKC"
      activity_type: parts.slice(1).join(' ') // "Scent Work" (keep spaces)
    };
    return result;
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
  
  // Filter and sort entries (but don't sort when in drag mode)
  const filteredEntries = entries
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
      } else {
        // Sort by armband number
        return a.armband - b.armband;
      }
    });
  
  const pendingEntries = filteredEntries.filter(e => !e.isScored);
  const completedEntries = filteredEntries.filter(e => e.isScored);
  
  const currentEntries = activeTab === 'pending' ? pendingEntries : completedEntries;

  // Sortable Entry Card Component
  const SortableEntryCard = ({ entry }: { entry: Entry }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: entry.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style} className={isDragMode ? 'sortable-item' : ''}>
        {isDragMode && (
          <div {...attributes} {...listeners} className="drag-handle">
            <GripVertical size={20} />
          </div>
        )}
        <DogCard
          key={entry.id}
          armband={entry.armband}
          callName={entry.callName}
          breed={entry.breed}
          handler={entry.handler}
          onClick={() => {
            if (isDragMode) return; // Disable navigation in drag mode
            if (hasPermission('canScore')) handleEntryClick(entry); // Entry click handler
          }}
          className={`${
            hasPermission('canScore') && !entry.isScored ? 'clickable' : ''
          }`}
          statusBorder={
            entry.isScored ?
              (entry.placement === 1 ? 'placement-1' :
               entry.placement === 2 ? 'placement-2' :
               entry.placement === 3 ? 'placement-3' : 'scored') :
            entry.inRing ? 'none' : // In-ring will be shown in status badge
            (entry.checkinStatus === 'checked-in' ? 'checked-in' :
             entry.checkinStatus === 'conflict' ? 'conflict' :
             entry.checkinStatus === 'pulled' ? 'pulled' :
             entry.checkinStatus === 'at-gate' ? 'at-gate' : 'none')
          }
          resultBadges={
            entry.isScored && entry.searchTime ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
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
                <span className="time-badge">{entry.searchTime}</span>
                {entry.placement && (
                  <span className="placement-badge">{entry.placement === 1 ? '1st' : entry.placement === 2 ? '2nd' : entry.placement === 3 ? '3rd' : `${entry.placement}th`}</span>
                )}
              </div>
            ) : undefined
          }
          actionButton={
            !entry.isScored ? (
              <div
                className={`status-badge ${
                  entry.inRing ? 'in-ring' :
                  (entry.checkinStatus || 'none').toLowerCase().replace(' ', '-')
                } ${
                  (!hasPermission('canCheckInDogs') && !(classInfo?.selfCheckin ?? true)) ? 'disabled' : ''
                }`}
                onClick={(e) => {
                  const canCheckIn = hasPermission('canCheckInDogs');
                  const isSelfCheckinEnabled = classInfo?.selfCheckin ?? true;

                  if (canCheckIn || isSelfCheckinEnabled) {
                    handleStatusClick(e, entry.id);
                  } else {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelfCheckinDisabledDialog(true);
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
                    case 'none': return <><span className="status-icon">●</span> Not Checked-in</>;
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
      </div>
    );
  };

  return (
    <div className="entry-list-container app-container-wide">
      <header className="entry-list-header">
        <HamburgerMenu
          backNavigation={{
            label: "Back to Classes",
            action: () => navigate(-1)
          }}
          currentPage="entries"
        />
        <div className="class-info">
          <h1>{classInfo?.className?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</h1>
          <div className="class-subtitle">
            <div className="trial-info">
              {classInfo?.trialDate && classInfo.trialDate !== '' && (
                <span className="trial-detail">
                  <Calendar size={14} /> {new Date(classInfo.trialDate).toLocaleDateString()}
                </span>
              )}
              {classInfo?.trialNumber && classInfo.trialNumber !== '' && classInfo.trialNumber !== '0' && (
                <span className="trial-detail"><Target size={14} /> {classInfo.trialNumber}</span>
              )}
              {classInfo?.judgeName && classInfo.judgeName !== 'No Judge Assigned' && classInfo.judgeName !== '' && (
                <span className="trial-detail"><User size={14} /> {classInfo.judgeName}</span>
              )}
            </div>
            <span className="progress">{scoredCount}/{totalCount} Scored</span>
          </div>
        </div>
      </header>

      {/* Search and Sort Controls */}
      <div className="search-sort-container">
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
        
        {searchTerm && (
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
                  <SortableEntryCard key={entry.id} entry={entry} />
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
          setPopupPosition(null);
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
                className="reset-dialog-confirm"
                onClick={() => setSelfCheckinDisabledDialog(false)}
                  style={{ width: '100%' }}
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