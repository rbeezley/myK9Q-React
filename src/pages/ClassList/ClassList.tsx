import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { 
  ArrowLeft, 
  RefreshCw, 
  Heart, 
  Eye, 
  Play, 
  MoreVertical, 
  Clock, 
  CheckCircle, 
  Users, 
  ChevronDown, 
  ChevronUp,
  Home as HomeIcon,
  MessageSquare,
  Calendar,
  Settings,
  Menu,
  X,
  Award
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
  total_classes: number;
  pending_classes: number;
  completed_classes: number;
}

export const ClassList: React.FC = () => {
  const { trialId } = useParams<{ trialId: string }>();
  const navigate = useNavigate();
  const { showContext, role, logout } = useAuth();
  const { hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'favorites' | 'in_progress'>('all');
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [activeStatusPopup, setActiveStatusPopup] = useState<number | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
  const [dogStatusFilters, setDogStatusFilters] = useState<Map<number, string>>(new Map()); // classId -> status filter
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

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

      if (trialData && classData) {
        // Set trial info
        setTrialInfo({
          trial_name: trialData.trial_name,
          trial_date: trialData.trial_date,
          total_classes: classData.length,
          pending_classes: classData.filter(c => c.class_status !== 'completed').length,
          completed_classes: classData.filter(c => c.class_status === 'completed').length
        });


        // Load ALL entries for this trial using natural keys (not foreign keys)
        const { data: allTrialEntries, error: trialEntriesError } = await supabase
          .from('view_entry_class_join_distinct')
          .select('*')
          .eq('mobile_app_lic_key', showContext?.licenseKey)
          .eq('trial_date', trialData.trial_date)
          .eq('trial_number', trialData.trial_number)
          .order('in_ring', { ascending: false }) // In ring first
          .order('checkin_status', { ascending: false }) // Then by checkin status
          .order('armband', { ascending: true }); // Then by armband

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

          // Process dog entries with status priorities
          const dogs = (entryData || []).map(entry => ({
            id: entry.id,
            armband: entry.armband,
            call_name: entry.call_name,
            breed: entry.breed,
            handler: entry.handler,
            in_ring: entry.in_ring || false,
            checkin_status: entry.checkin_status || 0,
            is_scored: entry.is_scored || false
          }));

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


  const parseOrganizationData = (orgString: string) => {
    // Parse organization string like "UKC Obedience", "AKC Scent Work"
    const parts = orgString.split(' ');
    return {
      organization: parts[0], // "UKC", "AKC", "ASCA"
      activity_type: parts.slice(1).join(' '), // "Obedience", "Scent Work", "FastCat"
    };
  };

  const handleViewEntries = (classEntry: ClassEntry) => {
    hapticFeedback.impact('medium');
    navigate(`/class/${classEntry.id}/entries`);
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
    if (dog.is_scored) return '🟣'; // Purple circle for DONE (scored)
    if (dog.in_ring) return '🏃';
    if (dog.checkin_status === 4) return '🚪'; // At gate
    if (dog.checkin_status === 1) return '🔵'; // Blue circle for READY (checked in)
    if (dog.checkin_status === 2) return '⚠️'; // Conflict
    if (dog.checkin_status === 3) return '❌'; // Pulled
    return '⏳'; // Not checked in
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
      ready: dogs.filter(dog => !dog.is_scored && dog.checkin_status === 1).length,
      active: dogs.filter(dog => dog.in_ring || dog.checkin_status === 4).length,
      completed: dogs.filter(dog => dog.is_scored).length,
    };
    return counts;
  };

  const getFilteredDogs = (dogs: ClassEntry['dogs'], statusFilter: string) => {
    switch (statusFilter) {
      case 'pending':
        return dogs.filter(dog => !dog.is_scored && dog.checkin_status === 0);
      case 'ready':
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
    // Status filter
    if (statusFilter === 'pending' && classEntry.class_status === 'completed') return false;
    if (statusFilter === 'completed' && classEntry.class_status !== 'completed') return false;
    
    // Type filter
    if (typeFilter === 'favorites' && !classEntry.is_favorite) return false;
    if (typeFilter === 'in_progress' && classEntry.class_status !== 'in_progress') return false;
    
    return true;
  });

  if (isLoading) {
    return (
      <div className={`class-list-container ${darkMode ? '' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
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
      <div className={`class-list-container ${darkMode ? '' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
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
    <div className={`class-list-container ${darkMode ? '' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
        {darkMode ? '☀️' : '🌙'}
      </button>
      
      {/* Enhanced Header with Glass Morphism */}
      <header className="class-list-header">
        <button
          className="icon-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
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
              <p className="trial-date">{trialInfo.trial_date}</p>
            </div>
            <div className="trial-stats">
              <div className="stat-value">{trialInfo.total_classes}</div>
              <div className="stat-label">Classes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Status Tabs with Apple Design */}
      <div className="status-tabs">
        <button
          className={`tab-button ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setStatusFilter('pending');
          }}
        >
          <Clock className="tab-icon" />
          <span className="tab-text">{trialInfo.pending_classes} Pending</span>
          {trialInfo.pending_classes > 0 && (
            <div className="status-indicator" />
          )}
        </button>
        <button
          className={`tab-button ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setStatusFilter('completed');
          }}
        >
          <CheckCircle className="tab-icon" />
          <span className="tab-text">{trialInfo.completed_classes} Completed</span>
        </button>
      </div>

      {/* Enhanced Filter Tabs with Apple Design */}
      <div className="filter-tabs">
        <button
          className={`tab-button ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setTypeFilter('all');
          }}
        >
          <Users className="tab-icon" />
          <span className="tab-text">All</span>
        </button>
        <button
          className={`tab-button ${typeFilter === 'favorites' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setTypeFilter('favorites');
          }}
        >
          <Heart className="tab-icon" />
          <span className="tab-text">Favorites</span>
        </button>
        <button
          className={`tab-button ${typeFilter === 'in_progress' ? 'active' : ''}`}
          onClick={() => {
            hapticFeedback.impact('light');
            setTypeFilter('in_progress');
          }}
        >
          <Play className="tab-icon" />
          <span className="tab-text">Active</span>
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
                    {(hasPendingEntries || isInProgress) && (
                      <div className="status-dot" />
                    )}
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
                      {/* Dog Status Filter Tabs */}
                      <div className="dog-status-filter">
                        {[
                          { key: 'all', label: 'All', count: getDogStatusCounts(classEntry.dogs).all },
                          { key: 'pending', label: 'Pending', count: getDogStatusCounts(classEntry.dogs).pending },
                          { key: 'ready', label: 'Ready', count: getDogStatusCounts(classEntry.dogs).ready },
                          { key: 'active', label: 'Active', count: getDogStatusCounts(classEntry.dogs).active },
                          { key: 'completed', label: 'Done', count: getDogStatusCounts(classEntry.dogs).completed },
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
                            {status.label}
                            <span className="status-count">{status.count}</span>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                hapticFeedback.impact('light');
                                navigate(`/dog/${dog.armband}`);
                              }}
                            >
                              <div className="dog-status"></div>
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
                        const visibleCount = getVisibleDogs(classEntry.dogs, classEntry.id).length;
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
                                {hiddenCounts.ready > 0 && (
                                  <div className="summary-stat">
                                    <div className="summary-dot" style={{color: '#047857'}}></div>
                                    {hiddenCounts.ready}
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

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <nav className="hamburger-menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <div className="menu-header-info">
                <h3>{showContext?.clubName}</h3>
                <p className="show-info-detail">{showContext?.showName}</p>
                <p className="user-info">Logged in as: <span>{role}</span></p>
              </div>
              <button 
                className="menu-close"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="menu-items">
              <button
                className="menu-item"
                onClick={() => {
                  navigate('/home');
                  setIsMenuOpen(false);
                }}
              >
                <HomeIcon className="menu-icon" />
                <span>Home</span>
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  navigate('/announcements');
                  setIsMenuOpen(false);
                }}
              >
                <MessageSquare className="menu-icon" />
                <span>News</span>
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  navigate('/calendar');
                  setIsMenuOpen(false);
                }}
              >
                <Calendar className="menu-icon" />
                <span>Calendar</span>
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  navigate('/settings');
                  setIsMenuOpen(false);
                }}
              >
                <Settings className="menu-icon" />
                <span>Settings</span>
              </button>
              
              <div className="menu-divider" />
              
              <button
                className="menu-item logout"
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
              >
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};