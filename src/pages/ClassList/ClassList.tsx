import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { HamburgerMenu, HeaderTicker } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import {
  ArrowLeft,
  RefreshCw,
  Heart,
  Eye as _Eye,
  MoreVertical,
  Clock,
  CheckCircle,
  Users,
  // ChevronDown,
  // ChevronUp,
  Award as _Award,
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  Calendar,
  Target
} from 'lucide-react';
import './ClassList.css';
import { ClassRequirementsDialog } from '../../components/dialogs/ClassRequirementsDialog';
import { MaxTimeDialog } from '../../components/dialogs/MaxTimeDialog';
import { ClassStatusDialog } from '../../components/dialogs/ClassStatusDialog';
import { NoviceClassDialog } from '../../components/dialogs/NoviceClassDialog';

// Helper function to convert seconds to MM:SS format
const _formatSecondsToMMSS = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface ClassEntry {
  id: number;
  element: string;
  level: string;
  section: string;
  class_name: string;
  class_order: number;
  judge_name: string;
  entry_count: number;
  completed_count: number;
  class_status: 'none' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed';
  is_completed?: boolean;
  is_favorite: boolean;
  time_limit_seconds?: number;
  time_limit_area2_seconds?: number;
  time_limit_area3_seconds?: number;
  area_count?: number;
  start_time?: string;
  briefing_time?: string;
  break_until?: string;
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
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedClassForStatus, setSelectedClassForStatus] = useState<ClassEntry | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
  const [dogStatusFilters, setDogStatusFilters] = useState<Map<number, string>>(new Map());
  const [favoriteClasses, setFavoriteClasses] = useState<Set<number>>(() => {
    console.log('🔄 Initializing favoriteClasses state');
    return new Set();
  });
  const [requirementsDialogOpen, setRequirementsDialogOpen] = useState(false);
  const [selectedClassForRequirements, setSelectedClassForRequirements] = useState<ClassEntry | null>(null);
  const [maxTimeDialogOpen, setMaxTimeDialogOpen] = useState(false);
  const [selectedClassForMaxTime, setSelectedClassForMaxTime] = useState<ClassEntry | null>(null);
  const [showMaxTimeWarning, setShowMaxTimeWarning] = useState(false);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [noviceDialogOpen, setNoviceDialogOpen] = useState(false);
  const [selectedNoviceClass, setSelectedNoviceClass] = useState<ClassEntry | null>(null);
  const [pairedNoviceClass, setPairedNoviceClass] = useState<ClassEntry | null>(null);

  // Search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'class_order' | 'element_level' | 'level_element'>('class_order');
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(true);

  // Time input states for status dialog

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
      setClasses(prevClasses => 
        prevClasses.map(classEntry => ({
          ...classEntry,
          is_favorite: favoriteClasses.has(classEntry.id)
        }))
      );
    }
  }, [favoriteClasses]);

  // Format date with abbreviated month and trial number
  const formatTrialDate = (dateStr: string, trialNumber: number) => {
    // Parse date components manually to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNumber = date.getDate();
    const yearNumber = date.getFullYear();

    return `${dayName}, ${monthName} ${dayNumber}, ${yearNumber} • Trial ${trialNumber}`;
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
    };

    if (activePopup !== null) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);

      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup]);

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.impact('medium');
    await loadClassList();
    setRefreshing(false);
  };

  const loadClassList = useCallback(async () => {
    console.log('🔄 Starting loadClassList function');
    console.log('🔍 Show context:', showContext);
    console.log('🔍 Trial ID:', trialId);
    setIsLoading(true);

    // Load favorites first to ensure they're available when processing classes
    let currentFavorites = new Set<number>();
    try {
      const favoritesKey = `favorites_${showContext?.licenseKey || 'default'}_${trialId}`;
      console.log('🔍 Loading favorites with key:', favoritesKey);
      const savedFavorites = localStorage.getItem(favoritesKey);
      console.log('💾 Raw localStorage value:', savedFavorites);
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites) as number[];
        currentFavorites = new Set(favoriteIds);
        setFavoriteClasses(currentFavorites);
        console.log('✅ Loaded favorites:', Array.from(currentFavorites));
      } else {
        console.log('📭 No favorites found in localStorage');
      }
      setFavoritesLoaded(true);
    } catch (error) {
      console.error('Error loading favorites from localStorage in loadClassList:', error);
    }
    
    try {
      // Load trial info using normalized table (legacy table structure doesn't match)
      const { data: trialData, error: trialError } = await supabase
        .from('trials')
        .select('*')
        .eq('show_id', showContext?.showId)
        .eq('id', parseInt(trialId!))
        .single();

      if (trialError) {
        console.error('Error loading trial:', trialError);
        return;
      }

      // Debug: log trial data to see available fields
      console.log('🔍 Trial data loaded:', trialData);

      // Load classes for this trial using normalized tables
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('trial_id', parseInt(trialId!))
        .order('class_order');

      if (classError) {
        console.error('Error loading classes:', classError);
        return;
      }

      // Debug: log class data to see what's loaded
      console.log('🔍 Class data loaded:', classData);
      console.log('🔍 Class data count:', classData?.length || 0);

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


        // Load ALL entries for this trial using normalized tables
        const { data: allTrialEntries, error: trialEntriesError } = await supabase
          .from('entries')
          .select(`
            *,
            classes!inner (
              element,
              level,
              section,
              trial_id
            ),
            results (
              is_in_ring,
              is_scored
            )
          `)
          .eq('classes.trial_id', parseInt(trialId!))
          .order('armband_number', { ascending: true });
          // Custom sorting will be applied after data retrieval

        if (trialEntriesError) {
          console.error('Error loading trial entries:', trialEntriesError);
        }


        // Process classes with entry data
        const processedClasses = classData.map((cls: any) => {
          // Filter entries for this specific class using class_id
          const entryData = (allTrialEntries || []).filter(entry =>
            entry.class_id === cls.id
          );
          

          // Process dog entries with custom status priority sorting
          const dogs = (entryData || []).map(entry => ({
            id: entry.id,
            armband: entry.armband_number,
            call_name: entry.dog_call_name,
            breed: entry.dog_breed,
            handler: entry.handler_name,
            in_ring: entry.results?.[0]?.is_in_ring || false,
            checkin_status: entry.check_in_status || 0,
            is_scored: entry.results?.[0]?.is_scored || false
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

          // Construct class name from element, level, and section (hide section if it's a dash)
          const sectionPart = cls.section && cls.section !== '-' ? ` ${cls.section}` : '';
          const className = `${cls.element} ${cls.level}${sectionPart}`.trim();
          
          return {
            id: cls.id,
            element: cls.element,
            level: cls.level,
            section: cls.section,
            class_name: className,
            class_order: cls.class_order || 999, // Default high value for classes without order
            class_type: cls.class_type,
            judge_name: cls.judge_name || 'TBA',
            entry_count: entryCount,
            completed_count: completedCount,
            class_status: cls.class_status || 'none',
            is_completed: cls.is_completed || false,
            is_favorite: currentFavorites.has(cls.id),
            time_limit: cls.time_limit || '',
            time_limit2: cls.time_limit2 || '',
            time_limit3: cls.time_limit3 || '',
            // Parse time values from class_status_comment based on current status
            briefing_time: cls.class_status === 'briefing' ? cls.class_status_comment : undefined,
            break_until: cls.class_status === 'break' ? cls.class_status_comment : undefined,
            start_time: cls.class_status === 'start_time' ? cls.class_status_comment : undefined,
            dogs: dogs
          };
        });

        // Sort classes by class_order first, then element, level, section
        const sortedClasses = processedClasses.sort((a, b) => {
          // Primary sort: class_order (ascending)
          if (a.class_order !== b.class_order) {
            return a.class_order - b.class_order;
          }
          
          // Secondary sort: element (alphabetical)
          if (a.element !== b.element) {
            return a.element.localeCompare(b.element);
          }
          
          // Tertiary sort: level (custom order for common levels)
          const levelOrder = { 'novice': 1, 'advanced': 2, 'excellent': 3, 'master': 4, 'masters': 4 };
          const aLevelOrder = levelOrder[a.level.toLowerCase() as keyof typeof levelOrder] || 999;
          const bLevelOrder = levelOrder[b.level.toLowerCase() as keyof typeof levelOrder] || 999;
          
          if (aLevelOrder !== bLevelOrder) {
            return aLevelOrder - bLevelOrder;
          }
          
          // If same level order, sort alphabetically
          if (a.level !== b.level) {
            return a.level.localeCompare(b.level);
          }
          
          // Quaternary sort: section (alphabetical)
          return a.section.localeCompare(b.section);
        });
        
        setClasses(sortedClasses);
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
            // For other changes (INSERT, DELETE), do full reload
            console.log('🔄 Real-time: Full reload needed for:', payload.eventType);
            loadClassList();
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [trialId, showContext?.licenseKey, loadClassList]);

  const parseOrganizationData = (orgString: string) => {
    
    if (!orgString || orgString.trim() === '') {
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
    
    return result;
  };

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
  const findPairedNoviceClass = (clickedClass: ClassEntry): ClassEntry | null => {
    // Only proceed if this is a Novice level class
    if (clickedClass.level !== 'Novice') {
      return null;
    }

    // Determine the paired section (A <-> B)
    const pairedSection = clickedClass.section === 'A' ? 'B' : 'A';

    // Find the matching class with same element, level, but different section
    const paired = classes.find(c =>
      c.element === clickedClass.element &&
      c.level === clickedClass.level &&
      c.section === pairedSection
    );

    return paired || null;
  };

  const handleViewEntries = (classEntry: ClassEntry) => {
    hapticFeedback.impact('medium');

    // Check if max time warning should be shown
    if (shouldShowMaxTimeWarning() && !isMaxTimeSet(classEntry)) {
      // Show MaxTimeDialog with warning instead of separate warning dialog
      setSelectedClassForMaxTime(classEntry);
      setMaxTimeDialogOpen(true);
      setShowMaxTimeWarning(true);
      return;
    }

    // Check if this is a Novice class and has a paired class
    if (classEntry.level === 'Novice') {
      const paired = findPairedNoviceClass(classEntry);
      if (paired) {
        // Show dialog to let user choose
        setSelectedNoviceClass(classEntry);
        setPairedNoviceClass(paired);
        setNoviceDialogOpen(true);
        return;
      }
    }

    // Proceed with navigation (single class or non-Novice)
    navigate(`/class/${classEntry.id}/entries`);
  };

  // Handle Novice dialog selection
  const handleNoviceDialogSelect = (option: 'A' | 'B' | 'combined') => {
    if (!selectedNoviceClass || !pairedNoviceClass) return;

    setNoviceDialogOpen(false);

    if (option === 'combined') {
      // Navigate to combined view with both class IDs
      navigate(`/class/${selectedNoviceClass.id}/${pairedNoviceClass.id}/entries/combined`);
    } else {
      // Navigate to the selected section
      const targetClass = option === selectedNoviceClass.section ? selectedNoviceClass : pairedNoviceClass;
      navigate(`/class/${targetClass.id}/entries`);
    }
  };


  // Function to set a dog's in-ring status
  const setDogInRingStatus = async (dogId: number, inRing: boolean) => {
    try {
      const { error } = await supabase
        .from('results')
        .update({ is_in_ring: inRing })
        .eq('entry_id', dogId);

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

  // Function to handle opening scoresheet for a specific dog
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // No longer need integer mapping - using text directly!

  // Helper function to get time input from user
  const _getTimeInput = (statusType: string): string | null => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    let promptMessage = '';
    let defaultValue = currentTime;

    switch (statusType) {
      case 'start_time':
        promptMessage = 'Enter the start time for this class (HH:MM):';
        break;
      case 'briefing':
        promptMessage = 'Enter the briefing time for this class (HH:MM):';
        break;
      case 'break':
        // For break, default to 15 minutes from now
        {
        const breakEnd = new Date(now.getTime() + 15 * 60000);
        defaultValue = breakEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        promptMessage = 'Enter when the break ends (HH:MM):';
        }
        break;
    }

    const timeInput = prompt(promptMessage, defaultValue);

    // Validate time format (HH:MM)
    if (timeInput && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeInput)) {
      return timeInput;
    } else if (timeInput !== null) {
      alert('Invalid time format. Please use HH:MM format.');
      return null;
    }

    return timeInput; // null if cancelled
  };

  // New function for handling status changes with inline time inputs
  const handleClassStatusChangeWithTime = async (classId: number, status: ClassEntry['class_status'], timeValue: string) => {
    console.log('🕐 Status change with time:', { classId, status, timeValue });

    // Use text status directly
    const updateData: any = {
      class_status: status
    };

    // Update local state with both status and time
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const updatedClass = { ...c, class_status: status };

        // Store the time in class_status_comment field
        switch (status) {
          case 'briefing':
            updatedClass.briefing_time = timeValue;
            updateData.class_status_comment = timeValue;
            break;
          case 'break':
            updatedClass.break_until = timeValue;
            updateData.class_status_comment = timeValue;
            break;
          case 'start_time':
            updatedClass.start_time = timeValue;
            updateData.class_status_comment = timeValue;
            break;
        }

        return updatedClass;
      }
      return c;
    }));

    // Close dialog
    setStatusDialogOpen(false);
    setSelectedClassForStatus(null);

    // Update database
    try {

      // Note: The normalized classes table should support time columns
      // for briefing_time, break_until, or start_time

      const { error } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', classId);

      if (error) {
        console.error('❌ Error updating class status with time:', error);
        console.error('❌ Update data:', updateData);
        console.error('❌ Class ID:', classId);
        // Revert on error
        loadClassList();
      } else {
        console.log('✅ Successfully updated class status with time');
      }
    } catch (error) {
      console.error('Exception updating class status:', error);
      loadClassList();
    }
  };

  // Simplified function for statuses without time input
  const handleClassStatusChange = async (classId: number, status: ClassEntry['class_status']) => {
    console.log('🔄 ClassList: Updating class status:', { classId, status });

    // Use text status directly
    const updateData = {
      class_status: status
    };

    console.log('✅ Using text status directly:', { status });

    console.log('🔄 ClassList: Update data:', updateData);

    // Update local state immediately for better UX
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, class_status: status } : c
    ));

    // Close dialog
    setStatusDialogOpen(false);
    setSelectedClassForStatus(null);

    // Update database
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', classId);

      if (error) {
        console.error('❌ Error updating class status:', error);
        console.error('❌ Update data:', updateData);
        console.error('❌ Class ID:', classId);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        // Revert on error
        loadClassList();
      } else {
        console.log('✅ Successfully updated class status');
        console.log('✅ Class ID:', classId);
        console.log('✅ New status:', status);
        console.log('✅ DB status value:', status);
        console.log('✅ Update data:', updateData);
        console.log('✅ Response data:', data);
      }
    } catch (error) {
      console.error('💥 Exception updating class status:', error);
      loadClassList();
    }
  };

  const toggleFavorite = async (classId: number) => {
    const classEntry = classes.find(c => c.id === classId);
    const isCurrentlyFavorite = classEntry?.is_favorite;
    console.log('💖 Toggling favorite for class:', classId, 'Currently favorite:', isCurrentlyFavorite);
    
    // Enhanced haptic feedback for outdoor/gloved use
    if (isCurrentlyFavorite) {
      // Removing favorite - softer feedback
      hapticFeedback.impact('light');
    } else {
      // Adding favorite - stronger feedback for confirmation
      hapticFeedback.impact('medium');
    }
    
    // Update favorites set for localStorage persistence
    setFavoriteClasses(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(classId)) {
        newFavorites.delete(classId);
        console.log('🗑️ Removing from favorites:', classId);
      } else {
        newFavorites.add(classId);
        console.log('⭐ Adding to favorites:', classId);
      }
      console.log('💾 New favorites set:', Array.from(newFavorites));
      return newFavorites;
    });
    
    // Update classes state to reflect the change immediately
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, is_favorite: !c.is_favorite } : c
    ));
  };

  const getStatusColor = (status: ClassEntry['class_status'], classEntry?: ClassEntry) => {
    // Check is_completed first for consistent coloring
    if (classEntry) {
      const displayStatus = getClassDisplayStatus(classEntry);
      if (displayStatus === 'completed') return 'completed';
      if (displayStatus === 'in-progress') return 'in-progress';
    }

    switch (status) {
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
          return 'none';
        }
        return 'none';
    }
  };

  // Helper function to format status with time in a structured way
  const getFormattedStatus = (classEntry: ClassEntry) => {
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
            time: classEntry.briefing_time
          };
        case 'break':
          return {
            label: 'Break Until',
            time: classEntry.break_until
          };
        case 'start_time':
          return {
            label: 'Start Time',
            time: classEntry.start_time
          };
        case 'setup':
          return { label: 'Setup', time: null };
        case 'in_progress':
          return { label: 'In Progress', time: null };
        case 'completed':
          return { label: 'Completed', time: null };
        default:
          return { label: 'no status', time: null };
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
  };

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDogStatusColor = (dog: ClassEntry['dogs'][0]) => {
    if (dog.is_scored) return 'completed';
    if (dog.in_ring) return 'in-ring';
    if (dog.checkin_status === 4) return 'at-gate';
    if (dog.checkin_status === 1) return 'checked-in';
    if (dog.checkin_status === 2) return 'conflict';
    if (dog.checkin_status === 3) return 'pulled';
    return 'not-checked-in';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Smart contextual preview helper functions - MANUAL STATUS WINS
  const getClassDisplayStatus = (classEntry: ClassEntry): 'not-started' | 'in-progress' | 'completed' => {
    // PRIORITY 1: Check is_completed field (set automatically when all entries scored)
    if (classEntry.is_completed === true) {
      return 'completed';
    }

    // PRIORITY 2: Manual class_status always wins (for run order only usage)
    if (classEntry.class_status === 'completed') {
      return 'completed';
    }
    if (classEntry.class_status === 'in_progress') {
      return 'in-progress';
    }

    // PRIORITY 3: Only use automatic detection if class_status is 'none' or other basic statuses
    if (classEntry.class_status === 'none' ||
        classEntry.class_status === 'setup' ||
        classEntry.class_status === 'briefing' ||
        classEntry.class_status === 'break' ||
        classEntry.class_status === 'start_time') {

      // A class is completed when all dogs are scored
      const isCompleted = classEntry.completed_count === classEntry.entry_count && classEntry.entry_count > 0;
      if (isCompleted) {
        return 'completed';
      }
      // A class is in progress if it has dogs in the ring or some scored
      if (classEntry.dogs.some(dog => dog.in_ring) || classEntry.completed_count > 0) {
        return 'in-progress';
      }
    }

    return 'not-started';
  };

  const getContextualPreview = (classEntry: ClassEntry): string => {
    const status = getClassDisplayStatus(classEntry);
    
    switch (status) {
      case 'not-started':
        return `${classEntry.entry_count} entries • Starts after current class`;
        
      case 'completed':
        return `Completed • ${classEntry.entry_count} ${classEntry.entry_count === 1 ? 'entry' : 'entries'} scored`;
        
      case 'in-progress': {
        const inRingDog = classEntry.dogs.find(dog => dog.in_ring);
        const nextDogs = classEntry.dogs
          .filter(dog => !dog.is_scored && !dog.in_ring)
          .slice(0, 3);

        let preview = '';
        if (inRingDog) {
          preview += `In Ring: ${inRingDog.armband} (${inRingDog.call_name})`;
        }
        
        if (nextDogs.length > 0) {
          const nextArmband = nextDogs.map(dog => dog.armband).join(', ');
          preview += inRingDog ? ` • Next: ${nextArmband}` : `Next: ${nextArmband}`;
        }
        
        const remaining = classEntry.entry_count - classEntry.completed_count;
        if (preview) {
          preview += `\n${remaining} of ${classEntry.entry_count} remaining`;
        } else {
          preview = `${remaining} of ${classEntry.entry_count} remaining`;
        }
        
        return preview;
      }
      default:
        return `${classEntry.completed_count} of ${classEntry.entry_count} entries scored`;
    }
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getVisibleDogs = (dogs: ClassEntry['dogs'], classId: number) => {
    const isExpanded = expandedClasses.has(classId);
    const statusFilter = dogStatusFilters.get(classId) || 'all';
    const filteredDogs = getFilteredDogs(dogs, statusFilter);
    
    if (isExpanded) return filteredDogs;
    
    // Show first 9 dogs in 3x3 grid for mobile-first compact design
    return filteredDogs.slice(0, 9);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDogStatusFilter = (classId: number, statusFilter: string) => {
    hapticFeedback.impact('light');
    setDogStatusFilters(prev => {
      const newMap = new Map(prev);
      newMap.set(classId, statusFilter);
      return newMap;
    });
  };

  // Search and sort functionality
  const getFilteredAndSortedClasses = () => {
    const filtered = classes.filter(classEntry => {
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
          // Sort by element first, then level
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

        case 'level_element':
          // Sort by level first, then element
          if (a.level !== b.level) {
            const levelOrder = { 'novice': 1, 'advanced': 2, 'excellent': 3, 'master': 4, 'masters': 4 };
            const aLevelOrder = levelOrder[a.level.toLowerCase() as keyof typeof levelOrder] || 999;
            const bLevelOrder = levelOrder[b.level.toLowerCase() as keyof typeof levelOrder] || 999;
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
  };

  const filteredClasses = getFilteredAndSortedClasses();

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
    <div className="class-list-container app-container">
      {/* Enhanced Header with Trial Info */}
      <header className="class-list-header">
        <HamburgerMenu
          currentPage="entries"
          backNavigation={{
            label: "Back to Home",
            action: () => navigate('/home')
          }}
        />

        <div className="trial-info">
          <h1>{trialInfo.trial_name}</h1>
          <div className="trial-subtitle">
            <div className="trial-info-row">
              <div className="trial-details-group">
                <span className="trial-detail">
                  <Calendar size={14} /> {formatTrialDate(trialInfo.trial_date, trialInfo.trial_number).split(' • ')[0]}
                </span>
                <span className="trial-detail">
                  <Target size={14} /> Trial {trialInfo.trial_number}
                </span>
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
          {searchTerm ? `Found ${filteredClasses.length} of ${classes.length} classes` : 'Search & Sort'}
        </span>
      </div>

      {/* Search Results Summary */}
      {searchTerm && (
        <div className="search-results-header">
          <div className="search-results-summary">
            {filteredClasses.length} of {classes.length} classes
          </div>
        </div>
      )}

      {/* Collapsible Search and Sort Container */}
      <div className={`search-sort-container ${isSearchCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search class name, element, level, judge..."
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
          <button
            className={`sort-btn ${sortOrder === 'class_order' ? 'active' : ''}`}
            onClick={() => setSortOrder('class_order')}
          >
            <ArrowUpDown size={16} />
            Class Order
          </button>
          <button
            className={`sort-btn ${sortOrder === 'element_level' ? 'active' : ''}`}
            onClick={() => setSortOrder('element_level')}
          >
            <ArrowUpDown size={16} />
            Element
          </button>
          <button
            className={`sort-btn ${sortOrder === 'level_element' ? 'active' : ''}`}
            onClick={() => setSortOrder('level_element')}
          >
            <ArrowUpDown size={16} />
            Level
          </button>
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
          <span className="tab-text">
            Pending ({classes.filter(c => getClassDisplayStatus(c) !== 'completed').length})
          </span>
        </button>
        <button
          className={`tab-button ${combinedFilter === 'favorites' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setCombinedFilter('favorites');
          }}
        >
          <Heart className="tab-icon" />
          <span className="tab-text">
            Favorites ({classes.filter(c => c.is_favorite).length})
          </span>
        </button>
        <button
          className={`tab-button ${combinedFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setCombinedFilter('completed');
          }}
        >
          <CheckCircle className="tab-icon" />
          <span className="tab-text">
            Completed ({classes.filter(c => getClassDisplayStatus(c) === 'completed').length})
          </span>
        </button>
      </div>

      {/* Enhanced Classes List Section */}
      <div className="class-list">
        {filteredClasses.map((classEntry) => {
          const _hasPendingEntries = classEntry.entry_count > classEntry.completed_count;
          const _isInProgress = classEntry.class_status === 'in_progress';
          return (
            <div
              key={classEntry.id}
              className={`class-card status-${classEntry.class_status.replace('_', '-')}`}
              onClick={(e) => {
                console.log('🔵 Class card clicked', e.target, e.currentTarget);
                handleViewEntries(classEntry);
              }}
            >
              <div className="class-content">
                <div className="class-header">
                  {/* Row 1: Class Title + Status Badge */}
                  <div className="class-header-row class-title-row">
                    <h3 className="class-name">{classEntry.class_name}</h3>

                    {/* Status Badge - Row 1 Right Side */}
                    {hasPermission('canManageClasses') ? (
                      <div
                        className={`status-badge class-status-badge mobile-touch-target ${getStatusColor(classEntry.class_status, classEntry)} clickable`}
                        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();

                          setSelectedClassForStatus(classEntry);
                          setStatusDialogOpen(true);
                        }}
                      >
                        {(() => {
                          const formattedStatus = getFormattedStatus(classEntry);
                          return (
                            <div className="status-badge-content">
                              <span className="status-text">{formattedStatus.label}</span>
                              {formattedStatus.time && (
                                <span className="status-time">{formattedStatus.time}</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className={`status-badge class-status-badge mobile-touch-target ${getStatusColor(classEntry.class_status, classEntry)}`}>
                        {(() => {
                          const formattedStatus = getFormattedStatus(classEntry);
                          return (
                            <div className="status-badge-content">
                              <span className="status-text">{formattedStatus.label}</span>
                              {formattedStatus.time && (
                                <span className="status-time">{formattedStatus.time}</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Row 2: Judge + Favorite Button + Menu Button */}
                  <div className="class-header-row class-actions-row">
                    <p className="class-judge">Judge: {classEntry.judge_name}</p>

                    <div className="class-actions">
                      <button
                        type="button"
                        className={`favorite-button ${classEntry.is_favorite ? 'favorited' : ''}`}
                        onClick={(e) => {
                          console.log('🚨 Heart button clicked! Class ID:', classEntry.id, 'Target:', e.target);
                          e.preventDefault();
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          toggleFavorite(classEntry.id);
                          return false;
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        style={{ zIndex: 15 }} // Inline style to ensure it's on top
                      >
                        <Heart className="favorite-icon" />
                      </button>

                      {/* 3-Dot Menu in Row 2 */}
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
                </div>

                {/* Condensed Preview - Single Line for Better Space Utilization */}
                <div className="class-preview-section">
                  {classEntry.dogs.length > 0 ? (
                    <div className="contextual-preview-condensed">
                      {(() => {
                        const preview = getContextualPreview(classEntry);
                        // Condense multiline preview to single line
                        return preview.replace(/\n/g, ' • ');
                      })()}
                    </div>
                  ) : (
                    <div className="no-entries">
                      <Users className="no-entries-icon" />
                      <p>No entries yet</p>
                      <p className="no-entries-subtitle">
                        Dogs will appear when registered
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>


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
                    // Find the class data for the requirements dialog
                    const classData = classes.find(c => c.id === activePopup);
                    if (classData) {
                      setSelectedClassForRequirements(classData);
                      setRequirementsDialogOpen(true);
                    }
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
                    // Find the class data for the max time dialog
                    const classData = classes.find(c => c.id === activePopup);
                    if (classData) {
                      setSelectedClassForMaxTime(classData);
                      setMaxTimeDialogOpen(true);
                      setShowMaxTimeWarning(false); // No warning for manual access
                    }
                    setActivePopup(null);
                  }}
                >
                  <span className="menu-icon">🕐</span>
                  <span className="menu-label">Set Max Time</span>
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
          loadClassList();
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

      {/* Novice Class Dialog */}
      {noviceDialogOpen && selectedNoviceClass && pairedNoviceClass && (
        <NoviceClassDialog
          clickedClass={{
            id: selectedNoviceClass.id,
            element: selectedNoviceClass.element,
            level: selectedNoviceClass.level,
            section: selectedNoviceClass.section,
            judge_name: selectedNoviceClass.judge_name
          }}
          pairedClass={{
            id: pairedNoviceClass.id,
            element: pairedNoviceClass.element,
            level: pairedNoviceClass.level,
            section: pairedNoviceClass.section,
            judge_name: pairedNoviceClass.judge_name
          }}
          onSelect={handleNoviceDialogSelect}
          onCancel={() => {
            setNoviceDialogOpen(false);
            setSelectedNoviceClass(null);
            setPairedNoviceClass(null);
          }}
        />
      )}

    </div>
  );
};