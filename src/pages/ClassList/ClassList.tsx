import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { HamburgerMenu } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { 
  ArrowLeft, 
  RefreshCw, 
  Heart, 
  Eye as _Eye, 
  Play as _Play, 
  MoreVertical, 
  Clock, 
  CheckCircle, 
  Users, 
  ChevronDown, 
  ChevronUp,
  Award as _Award
} from 'lucide-react';
import './ClassList.css';

interface ClassEntry {
  id: number;
  element: string;
  level: string;
  section: string;
  class_name: string;
  judge_name: string;
  entry_count: number;
  completed_count: number;
  class_status: 'none' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed';
  is_favorite: boolean;
  dogs: {
    id: number;
    armband: number;
    call_name: string;
    breed: string;
    handler: string;
    in_ring: boolean;
    checkin_status: number;
    is_scored: boolean;
  }[];
}

interface TrialInfo {
  trial_name: string;
  trial_date: string;
  trial_number: number;
  total_classes: number;
  pending_classes: number;
  completed_classes: number;
}

export const ClassList: React.FC = () => {
  const { trialId } = useParams<{ trialId: string }>();
  const navigate = useNavigate();
  const { showContext, role: _role, logout: _logout } = useAuth();
  const { hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [combinedFilter, setCombinedFilter] = useState<'pending' | 'favorites' | 'completed'>('pending');
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
  const [dogStatusFilters, setDogStatusFilters] = useState<Map<number, string>>(new Map());

  // Format date with abbreviated month and trial number
  const formatTrialDate = (dateStr: string, trialNumber: number) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${month} ${day}, ${year} - ${trialNumber}`;
  };

  useEffect(() => {
    if (trialId && showContext) {
      loadClassList();
    }
  }, [trialId, showContext]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.class-popup') && !target.closest('.class-menu-button')) {
        setActivePopup(null);
      }
      if (!target.closest('.status-popup') && !target.closest('.status-badge')) {
        setActiveStatusPopup(null);
      }
    };

    if (activePopup !== null || activeStatusPopup !== null) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup, activeStatusPopup]);

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.impact('medium');
    await loadClassList();
    setRefreshing(false);
  };

  const loadClassList = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load trial info
      const { data: trialData, error: trialError } = await supabase
        .from('tbl_trial_queue')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey)
        .eq('trialid', parseInt(trialId!))
        .single();

      if (trialError) {
        console.error('Error loading trial:', trialError);
        return;
      }

      // Debug: log trial data to see available fields
      console.log('Trial data loaded:', trialData);

      // Load classes for this trial
      const { data: classData, error: classError } = await supabase
        .from('tbl_class_queue')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey)
        .eq('trialid_fk', parseInt(trialId!));

      if (classError) {
        console.error('Error loading classes:', classError);
        return;
      }

      // Debug: log class data to see what's loaded
      console.log('Class data loaded:', classData?.length, 'classes');

      if (trialData && classData) {
        // Set trial info
        setTrialInfo({
          trial_name: trialData.trial_name,
          trial_date: trialData.trial_date,
          trial_number: trialData.trial_number || trialData.trialid,
          total_classes: classData.length,
          pending_classes: classData.filter(c => c.is_completed !== true).length,
          completed_classes: classData.filter(c => c.is_completed === true).length
        });


        // Load ALL entries for this trial using natural keys (not foreign keys)
        const { data: allTrialEntries, error: trialEntriesError } = await supabase
          .from('view_entry_class_join_distinct')
          .select('*')
          .eq('mobile_app_lic_key', showContext?.licenseKey)
          .eq('trial_date', trialData.trial_date)
          .eq('trial_number', trialData.trial_number)
          .order('in_ring', { ascending: false })
          .order('checkin_status', { ascending: false })
          .order('armband', { ascending: true });
          // Custom sorting will be applied after data retrieval

        if (trialEntriesError) {
          console.error('Error loading trial entries:', trialEntriesError);
        }

        console.log(`Found ${allTrialEntries?.length || 0} entries for trial ${trialData.trial_date} - ${trialData.trial_number}`);

        // Process classes with entry data
        const processedClasses = classData.map((cls: any) => {
          // Filter entries for this specific class using natural keys
          const entryData = (allTrialEntries || []).filter(entry => 
            entry.element === cls.element && 
            entry.level === cls.level && 
            entry.section === cls.section
          );
          
          console.log(`Class ${cls.id} (${cls.element} ${cls.level} ${cls.section}): ${entryData.length} entries`);

          // Process dog entries with custom status priority sorting
          const dogs = (entryData || []).map(entry => ({
            id: entry.id,
            armband: entry.armband,
            call_name: entry.call_name,
            breed: entry.breed,
            handler: entry.handler,
            in_ring: entry.in_ring || false,
            checkin_status: entry.checkin_status || 0,
            is_scored: entry.is_scored || false
          })).sort((a, b) => {
            // Custom sort order: in-ring, at gate, checked-in, conflict, not checked-in, pulled, completed
            const getStatusPriority = (dog: typeof a) => {
              if (dog.is_scored) return 7; // Completed (last)
              if (dog.in_ring) return 1; // In-ring (first)
              if (dog.checkin_status === 4) return 2; // At gate
              if (dog.checkin_status === 1) return 3; // Checked-in
              if (dog.checkin_status === 2) return 4; // Conflict
              if (dog.checkin_status === 0) return 5; // Not checked-in (pending)
              if (dog.checkin_status === 3) return 6; // Pulled
              return 8; // Unknown status
            };
            
            const priorityA = getStatusPriority(a);
            const priorityB = getStatusPriority(b);
            
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            
            // Secondary sort by armband number
            return a.armband - b.armband;
          });

          // Count totals
          const entryCount = dogs.length;
          const completedCount = dogs.filter(dog => dog.is_scored).length;

          // Construct class name from element, level, and section
          const className = `${cls.element} ${cls.level} ${cls.section}`.trim();
          
          return {
            id: cls.id,
            element: cls.element,
            level: cls.level,
            section: cls.section,
            class_name: className,
            class_type: cls.class_type,
            judge_name: cls.judge_name || 'TBA',
            entry_count: entryCount,
            completed_count: completedCount,
            class_status: cls.class_status || 'pending',
            is_favorite: false, // TODO: Load from user preferences
            dogs: dogs
          };
        });

        setClasses(processedClasses);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showContext?.licenseKey, trialId]);

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
          table: 'tbl_entry_queue',
          filter: `mobile_app_lic_key=eq.${showContext.licenseKey}`
        },
        (payload) => {
          console.log('Real-time entry update received in ClassList:', payload);
          // Reload class list when entries change (in-ring status, scoring, etc.)
          loadClassList();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [trialId, showContext?.licenseKey, loadClassList]);

  const parseOrganizationData = (orgString: string) => {
    console.log('🔍 parseOrganizationData DEBUG:');
    console.log('Input orgString:', JSON.stringify(orgString));
    console.log('orgString type:', typeof orgString);
    console.log('orgString length:', orgString?.length || 'undefined');
    
    if (!orgString || orgString.trim() === '') {
      console.log('⚠️ Empty orgString - defaulting to AKC Scent Work');
      // Default to AKC Scent Work for this show based on the user's report
      return {
        organization: 'AKC',
        activity_type: 'Scent Work'
      };
    }
    
    // Parse organization string like "UKC Obedience", "AKC Scent Work"
    const parts = orgString.split(' ');
    const result = {
      organization: parts[0], // "UKC", "AKC", "ASCA"
      activity_type: parts.slice(1).join(' '), // "Obedience", "Scent Work", "FastCat"
    };
    
    console.log('Parsed organization data:', result);
    return result;
  };

  const handleViewEntries = (classEntry: ClassEntry) => {
    hapticFeedback.impact('medium');
    navigate(`/class/${classEntry.id}/entries`);
  };

  // Function to set a dog's in-ring status
  const setDogInRingStatus = async (dogId: number, inRing: boolean) => {
    try {
      const { error } = await supabase
        .from('tbl_entry_queue')
        .update({ in_ring: inRing })
        .eq('id', dogId)
        .eq('mobile_app_lic_key', showContext?.licenseKey);

      if (error) {
        console.error('Error updating dog ring status:', error);
        return false;
      }
      
      console.log(`Dog ${dogId} ring status set to: ${inRing}`);
      return true;
    } catch (error) {
      console.error('Error setting dog ring status:', error);
      return false;
    }
  };

  // Function to handle opening scoresheet for a specific dog
  const handleDogScoresheet = async (dog: ClassEntry['dogs'][0], classEntry: ClassEntry) => {
    // First, set the dog to in-ring status
    console.log(`Setting dog ${dog.call_name} (ID: ${dog.id}) to in-ring status...`);
    const success = await setDogInRingStatus(dog.id, true);
    
    if (!success) {
      console.error('Failed to set dog in-ring status');
      // Continue anyway - don't block scoresheet opening
    } else {
      console.log(`Successfully set dog ${dog.call_name} to in-ring status`);
      // Refresh the class list to show updated status immediately
      await loadClassList();
    }

    // Navigate to the appropriate scoresheet with specific dog
    const orgData = parseOrganizationData(showContext?.org || '');
    const competition_type = showContext?.competition_type || 'Regular';
    const element = classEntry.element || '';
    
    console.log('Opening scoresheet for dog:', { 
      dogId: dog.id,
      armband: dog.armband,
      callName: dog.call_name,
      classId: classEntry.id,
      className: classEntry.class_name,
      orgString: showContext?.org || '',
      organization: orgData.organization,
      activity_type: orgData.activity_type,
      element,
      competition_type
    });
    
    // Organization-based routing with specific dog ID
    console.log('Route selection logic:', {
      orgMatches: orgData.organization === 'AKC',
      activityMatches: orgData.activity_type === 'Scent Work' || orgData.activity_type === 'ScentWork'
    });

    if (orgData.organization === 'AKC') {
      console.log('✅ AKC route selected');
      if (orgData.activity_type === 'Scent Work' || orgData.activity_type === 'ScentWork') {
        console.log('✅ AKC Scent Work route selected');
        const route = `/scoresheet/akc-scent-work/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else if (orgData.activity_type === 'FastCat' || orgData.activity_type === 'Fast Cat') {
        console.log('✅ AKC FastCat route selected');
        const route = `/scoresheet/akc-fastcat/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else {
        console.log('✅ AKC default (Scent Work) route selected');
        const route = `/scoresheet/akc-scent-work/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      }
    } else if (orgData.organization === 'UKC') {
      console.log('✅ UKC route selected');
      if (orgData.activity_type === 'Obedience' || element === 'Obedience') {
        const route = `/scoresheet/ukc-obedience/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else if (element === 'Rally' || orgData.activity_type === 'Rally') {
        const route = `/scoresheet/ukc-rally/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else if (orgData.activity_type === 'Nosework') {
        const route = `/scoresheet/asca-scent-detection/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else {
        if (element === 'Obedience') {
          const route = `/scoresheet/ukc-obedience/${classEntry.id}/${dog.id}`;
          console.log('Navigating to:', route);
          navigate(route);
        } else {
          const route = `/scoresheet/ukc-rally/${classEntry.id}/${dog.id}`;
          console.log('Navigating to:', route);
          navigate(route);
        }
      }
    } else if (orgData.organization === 'ASCA') {
      console.log('✅ ASCA route selected');
      if (orgData.activity_type === 'ScentDetection' || orgData.activity_type.includes('Scent')) {
        const route = `/scoresheet/asca-scent-detection/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else {
        const route = `/scoresheet/asca-scent-detection/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      }
    } else {
      console.log('⚠️ Fallback route selected (unknown organization)');
      // Default fallback
      if (element === 'Obedience') {
        const route = `/scoresheet/ukc-obedience/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else if (element === 'Rally') {
        const route = `/scoresheet/ukc-rally/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      } else {
        const route = `/scoresheet/ukc-obedience/${classEntry.id}/${dog.id}`;
        console.log('Navigating to:', route);
        navigate(route);
      }
    }
  };

  const _handleStartScoring = (classEntry: ClassEntry) => {
    // Implement improved 4-tier scoresheet selection hierarchy
    const orgData = parseOrganizationData(showContext?.org || '');
    const competition_type = showContext?.competition_type || 'Regular'; // Regular, Regional, National
    const _trial_type = ''; // Will come from tbl_trial_queue.trial_type when implemented
    const element = classEntry.element || '';
    const level = classEntry.level || '';
    
    console.log('Scoresheet selection:', { 
      organization: orgData.organization,
      activity_type: orgData.activity_type,
      competition_type,
      element,
      level
    });
    
    // Organization-based routing
    if (orgData.organization === 'AKC') {
      if (orgData.activity_type === 'Scent Work' || orgData.activity_type === 'ScentWork') {
        // AKC Scent Work - could have National variant in future
        navigate(`/scoresheet/akc-scent-work/${classEntry.id}/0`); // 0 means auto-select first entry
      } else if (orgData.activity_type === 'FastCat' || orgData.activity_type === 'Fast Cat') {
        navigate(`/scoresheet/akc-fastcat/${classEntry.id}/0`);
      } else {
        // Default AKC fallback
        navigate(`/scoresheet/akc-scent-work/${classEntry.id}/0`);
      }
    } else if (orgData.organization === 'UKC') {
      if (orgData.activity_type === 'Obedience' || element === 'Obedience') {
        navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
      } else if (element === 'Rally' || orgData.activity_type === 'Rally') {
        navigate(`/scoresheet/ukc-rally/${classEntry.id}/0`);
      } else if (orgData.activity_type === 'Nosework') {
        // UKC Nosework - using ASCA for now as placeholder
        navigate(`/scoresheet/asca-scent-detection/${classEntry.id}/0`);
      } else {
        // Default UKC fallback based on element
        if (element === 'Obedience') {
          navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
        } else {
          navigate(`/scoresheet/ukc-rally/${classEntry.id}/0`);
        }
      }
    } else if (orgData.organization === 'ASCA') {
      if (orgData.activity_type === 'ScentDetection' || orgData.activity_type.includes('Scent')) {
        navigate(`/scoresheet/asca-scent-detection/${classEntry.id}/0`);
      } else {
        navigate(`/scoresheet/asca-scent-detection/${classEntry.id}/0`);
      }
    } else {
      // Default fallback - try to infer from element
      if (element === 'Obedience') {
        navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
      } else if (element === 'Rally') {
        navigate(`/scoresheet/ukc-rally/${classEntry.id}/0`);
      } else {
        // Ultimate fallback
        navigate(`/scoresheet/ukc-obedience/${classEntry.id}/0`);
      }
    }
  };

  const handleClassStatusChange = async (classId: number, status: ClassEntry['class_status']) => {
    // Update local state
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, class_status: status } : c
    ));

    // Update database
    try {
      const { error } = await supabase
        .from('tbl_class_queue')
        .update({ class_status: status })
        .eq('id', classId);

      if (error) {
        console.error('Error updating class status:', error);
        // Revert on error
        loadClassList();
      } else {
        console.log('Class status updated successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      loadClassList();
    }
  };

  const toggleFavorite = async (classId: number) => {
    hapticFeedback.impact('light');
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, is_favorite: !c.is_favorite } : c
    ));
    
    // TODO: Update user preferences
  };

  const getStatusColor = (status: ClassEntry['class_status']) => {
    switch (status) {
      case 'setup': return 'setup';
      case 'briefing': return 'briefing';
      case 'break': return 'break';
      case 'start_time': return 'start-time';
      case 'in_progress': return 'in-progress';
      case 'completed': return 'completed';
      default: return 'none';
    }
  };

  const getStatusLabel = (status: ClassEntry['class_status']) => {
    switch (status) {
      case 'setup': return 'Setup';
      case 'briefing': return 'Briefing';
      case 'break': return 'Break';
      case 'start_time': return 'Start Time';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'None';
    }
  };

  const getDogStatusIcon = (dog: ClassEntry['dogs'][0]) => {
    if (dog.is_scored) return '♦'; // Diamond for DONE (scored)
    if (dog.in_ring) return '▶'; // Play icon for IN RING
    if (dog.checkin_status === 4) return '★'; // Star for AT GATE
    if (dog.checkin_status === 1) return '✓'; // Checkmark for READY (checked in)
    if (dog.checkin_status === 2) return '!'; // Exclamation for CONFLICT
    if (dog.checkin_status === 3) return '✕'; // X mark for PULLED
    return '●'; // Circle for NOT CHECKED IN
  };

  const _getDogStatusText = (dog: ClassEntry['dogs'][0]) => {
    if (dog.is_scored) return 'Completed';
    if (dog.in_ring) return 'In Ring';
    if (dog.checkin_status === 4) return 'At Gate';
    if (dog.checkin_status === 1) return 'Checked-in';
    if (dog.checkin_status === 2) return 'Conflict';
    if (dog.checkin_status === 3) return 'Pulled';
    return 'Not Checked-in';
  };

  const getDogStatusColor = (dog: ClassEntry['dogs'][0]) => {
    if (dog.is_scored) return 'completed';
    if (dog.in_ring) return 'in-ring';
    if (dog.checkin_status === 4) return 'at-gate';
    if (dog.checkin_status === 1) return 'checked-in';
    if (dog.checkin_status === 2) return 'conflict';
    if (dog.checkin_status === 3) return 'pulled';
    return 'not-checked-in';
  };

  const getDogStatusCounts = (dogs: ClassEntry['dogs']) => {
    const counts = {
      all: dogs.length,
      pending: dogs.filter(dog => !dog.is_scored && dog.checkin_status === 0).length,
      checkedin: dogs.filter(dog => !dog.is_scored && dog.checkin_status === 1).length,
      active: dogs.filter(dog => dog.in_ring || dog.checkin_status === 4).length,
      completed: dogs.filter(dog => dog.is_scored).length,
    };
    return counts;
  };

  const getFilteredDogs = (dogs: ClassEntry['dogs'], statusFilter: string) => {
    switch (statusFilter) {
      case 'pending':
        return dogs.filter(dog => !dog.is_scored && dog.checkin_status === 0);
      case 'checkedin':
        return dogs.filter(dog => !dog.is_scored && dog.checkin_status === 1);
      case 'active':
        return dogs.filter(dog => dog.in_ring || dog.checkin_status === 4);
      case 'completed':
        return dogs.filter(dog => dog.is_scored);
      default:
        return dogs;
    }
  };

  const getVisibleDogs = (dogs: ClassEntry['dogs'], classId: number) => {
    const isExpanded = expandedClasses.has(classId);
    const statusFilter = dogStatusFilters.get(classId) || 'all';
    const filteredDogs = getFilteredDogs(dogs, statusFilter);
    
    if (isExpanded) return filteredDogs;
    
    // Show first 9 dogs in 3x3 grid for mobile-first compact design
    return filteredDogs.slice(0, 9);
  };

  const toggleClassExpansion = (classId: number) => {
    hapticFeedback.impact('light');
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const handleDogStatusFilter = (classId: number, statusFilter: string) => {
    hapticFeedback.impact('light');
    setDogStatusFilters(prev => {
      const newMap = new Map(prev);
      newMap.set(classId, statusFilter);
      return newMap;
    });
  };

  const filteredClasses = classes.filter(classEntry => {
    // Combined filter logic
    if (combinedFilter === 'pending' && classEntry.class_status === 'completed') return false;
    if (combinedFilter === 'completed' && classEntry.class_status !== 'completed') return false;
    if (combinedFilter === 'favorites' && !classEntry.is_favorite) return false;
    
    return true;
  });

  if (isLoading) {
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
    <div className="class-list-container">
      {/* Enhanced Header with Glass Morphism */}
      <header className="class-list-header">
        <HamburgerMenu 
          currentPage="entries" 
          backNavigation={{
            label: "Back to Home",
            action: () => navigate('/home')
          }}
        />
        
        <div className="header-center">
          <h1>Select Class</h1>
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

      {/* Trial Info Card with Glass Morphism */}
      <div className="trial-info-section">
        <div className="trial-info-card">
          <div className="trial-info-content">
            <div>
              <h2>{trialInfo.trial_name}</h2>
              <p className="trial-date">{formatTrialDate(trialInfo.trial_date, trialInfo.trial_number)}</p>
            </div>
            <div className="trial-stats">
              <div className="stat-value">{trialInfo.total_classes}</div>
              <div className="stat-label">Classes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Class Filter Tabs */}
      <div className="status-tabs">
        <button
          className={`tab-button ${combinedFilter === 'pending' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setCombinedFilter('pending');
          }}
        >
          <Clock className="tab-icon" />
          <span className="tab-text">Pending</span>
        </button>
        <button
          className={`tab-button ${combinedFilter === 'favorites' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setCombinedFilter('favorites');
          }}
        >
          <Heart className="tab-icon" />
          <span className="tab-text">Favorites</span>
        </button>
        <button
          className={`tab-button ${combinedFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setCombinedFilter('completed');
          }}
        >
          <CheckCircle className="tab-icon" />
          <span className="tab-text">Completed</span>
        </button>
      </div>

      {/* Enhanced Classes List Section */}
      <div className="class-list">
        {filteredClasses.map((classEntry) => {
          const hasPendingEntries = classEntry.entry_count > classEntry.completed_count;
          const isInProgress = classEntry.class_status === 'in_progress';
          return (
            <div 
              key={classEntry.id}
              className={`class-card ${
                hasPendingEntries || isInProgress
                  ? 'pending' 
                  : ''
              }`}
              onClick={() => handleViewEntries(classEntry)}
            >
              <div className="class-content">
                <div className="class-header">
                  <div className="class-details">
                    <h3 className="class-name">{classEntry.class_name}</h3>
                    <p className="class-judge">Judge: {classEntry.judge_name}</p>
                    <p className="class-progress">
                      {classEntry.completed_count} of {classEntry.entry_count} entries scored
                    </p>
                  </div>
                  
                  <div className="class-actions">
                    <button
                      className={`favorite-button ${classEntry.is_favorite ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(classEntry.id);
                      }}
                    >
                      <Heart className="favorite-icon" />
                    </button>
                    
                    {/* Status Badge in Header */}
                    <div className="status-container">
                      {hasPermission('canManageClasses') ? (
                        <button
                          className={`status-badge ${getStatusColor(classEntry.class_status)} clickable`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStatusPopup(activeStatusPopup === classEntry.id ? null : classEntry.id);
                          }}
                        >
                          {getStatusLabel(classEntry.class_status)}
                        </button>
                      ) : (
                        <div className={`status-badge ${getStatusColor(classEntry.class_status)}`}>
                          {getStatusLabel(classEntry.class_status)}
                        </div>
                      )}
                    </div>
                    
                    {/* 3-Dot Menu in Header */}
                    <button
                      className="menu-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopup(activePopup === classEntry.id ? null : classEntry.id);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Entry Preview with Status Filter */}
                <div className="dog-preview-section">
                  {classEntry.dogs.length > 0 ? (
                    <>
                      {/* Dog Status Filter Tabs with Legend Dots */}
                      <div className="dog-status-filter">
                        {[
                          { key: 'all', label: 'All', shortLabel: 'All', count: getDogStatusCounts(classEntry.dogs).all },
                          { key: 'pending', label: 'None', shortLabel: 'None', count: getDogStatusCounts(classEntry.dogs).pending },
                          { key: 'checkedin', label: 'Checked-in', shortLabel: 'Ready', count: getDogStatusCounts(classEntry.dogs).checkedin },
                          { key: 'active', label: 'At Ring', shortLabel: 'Ring', count: getDogStatusCounts(classEntry.dogs).active },
                          { key: 'completed', label: 'Completed', shortLabel: 'Done', count: getDogStatusCounts(classEntry.dogs).completed },
                        ].filter(status => status.count > 0).map((status) => (
                          <button
                            key={status.key}
                            className={`dog-status-tab ${
                              (dogStatusFilters.get(classEntry.id) || 'all') === status.key ? 'active' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDogStatusFilter(classEntry.id, status.key);
                            }}
                          >
                            <span className="tab-label-full">{status.label}</span>
                            <span className="tab-label-short">{status.shortLabel}</span>
                            <span 
                              className="status-count"
                              style={{
                                backgroundColor: 
                                  status.key === 'all' ? 'var(--text-secondary)' :
                                  status.key === 'pending' ? 'var(--status-not-checked-in)' :
                                  status.key === 'checkedin' ? 'var(--status-checked-in)' :
                                  status.key === 'active' ? 'var(--status-in-ring)' :
                                  status.key === 'completed' ? 'var(--status-done)' :
                                  'var(--text-secondary)',
                                color: 'white',
                                fontWeight: '600'
                              }}
                            >
                              {status.count}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Compact Grid Layout */}
                      <div className="dog-list">
                        {getVisibleDogs(classEntry.dogs, classEntry.id).map((dog) => {
                          const statusColor = getDogStatusColor(dog);
                          return (
                            <div 
                              key={dog.id}
                              className={`dog-entry ${statusColor}`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                hapticFeedback.impact('light');
                                // Open scoresheet and automatically set dog to in-ring status
                                await handleDogScoresheet(dog, classEntry);
                              }}
                            >
                              <div className="dog-status">
                                <span className="dog-status-icon">
                                  {getDogStatusIcon(dog)}
                                </span>
                              </div>
                              <div className="dog-armband">
                                {dog.armband}
                              </div>
                              <div className="dog-info">
                                <div className="dog-name">{dog.call_name}</div>
                                <div className="dog-handler">{dog.handler}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Smart Expand/Collapse with Summary */}
                      {(() => {
                        const statusFilter = dogStatusFilters.get(classEntry.id) || 'all';
                        const filteredDogs = getFilteredDogs(classEntry.dogs, statusFilter);
                        const _visibleCount = getVisibleDogs(classEntry.dogs, classEntry.id).length;
                        const totalCount = filteredDogs.length;
                        
                        if (!expandedClasses.has(classEntry.id) && totalCount > 9) {
                          const hiddenDogs = filteredDogs.slice(9);
                          const hiddenCounts = getDogStatusCounts(hiddenDogs);
                          
                          return (
                            <button
                              className="dog-grid-summary"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleClassExpansion(classEntry.id);
                              }}
                            >
                              <ChevronDown className="h-4 w-4" />
                              <span>+{totalCount - 9} more dogs</span>
                              <div className="grid-summary-stats">
                                {hiddenCounts.pending > 0 && (
                                  <div className="summary-stat">
                                    <div className="summary-dot" style={{color: '#6b7280'}}></div>
                                    {hiddenCounts.pending}
                                  </div>
                                )}
                                {hiddenCounts.checkedin > 0 && (
                                  <div className="summary-stat">
                                    <div className="summary-dot" style={{color: '#047857'}}></div>
                                    {hiddenCounts.checkedin}
                                  </div>
                                )}
                                {hiddenCounts.active > 0 && (
                                  <div className="summary-stat">
                                    <div className="summary-dot" style={{color: '#c2410c'}}></div>
                                    {hiddenCounts.active}
                                  </div>
                                )}
                                {hiddenCounts.completed > 0 && (
                                  <div className="summary-stat">
                                    <div className="summary-dot" style={{color: '#047857'}}></div>
                                    {hiddenCounts.completed}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        }
                        
                        if (expandedClasses.has(classEntry.id) && totalCount > 9) {
                          return (
                            <button
                              className="expand-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleClassExpansion(classEntry.id);
                              }}
                            >
                              <ChevronUp className="h-4 w-4" />
                              Show less
                            </button>
                          );
                        }
                        
                        return null;
                      })()}
                    </>
                  ) : (
                    <div className="no-dogs">
                      <Users className="no-dogs-icon" />
                      <p>No dogs entered yet</p>
                      <p className="no-dogs-subtitle">
                        Entries will appear when dogs are registered
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Status Selection Popup */}
      {activeStatusPopup !== null && (
        <div className="popup-overlay" onClick={() => setActiveStatusPopup(null)}>
          <div className="popup-container">
            <div className="popup-content">
              <h3>Class Status</h3>
              <div className="status-options">
                {[
                  { status: 'none', label: 'None', icon: '⚪' },
                  { status: 'setup', label: 'Setup', icon: '🔧' },
                  { status: 'briefing', label: 'Briefing', icon: '📋' },
                  { status: 'break', label: 'Break', icon: '☕' },
                  { status: 'start_time', label: 'Start Time', icon: '⏰' },
                  { status: 'in_progress', label: 'In Progress', icon: '🏃' },
                  { status: 'completed', label: 'Completed', icon: '✅' }
                ].map(({ status, label, icon }) => (
                  <button
                    key={status}
                    className="status-option"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClassStatusChange(activeStatusPopup, status as any);
                      setActiveStatusPopup(null);
                    }}
                  >
                    <span className="status-icon">{icon}</span>
                    <span className="status-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu Popup */}
      {activePopup !== null && (
        <div className="popup-overlay" onClick={() => setActivePopup(null)}>
          <div className="popup-container">
            <div className="popup-content">
              <h3>Class Options</h3>
              <div className="menu-options">
                <button
                  className="menu-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to class requirements
                    console.log('Navigate to class requirements for class', activePopup);
                    setActivePopup(null);
                  }}
                >
                  <span className="menu-icon">📋</span>
                  <span className="menu-label">Requirements</span>
                </button>
                <button
                  className="menu-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to class settings
                    console.log('Navigate to class settings for class', activePopup);
                    setActivePopup(null);
                  }}
                >
                  <span className="menu-icon">⚙️</span>
                  <span className="menu-label">Settings</span>
                </button>
                <button
                  className="menu-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to class statistics
                    console.log('Navigate to class statistics for class', activePopup);
                    setActivePopup(null);
                  }}
                >
                  <span className="menu-icon">📈</span>
                  <span className="menu-label">Statistics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};