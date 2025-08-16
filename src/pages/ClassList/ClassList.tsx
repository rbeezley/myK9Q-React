import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, Button } from '../../components/ui';
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
  Download
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
  const { showContext } = useAuth();
  const { hasPermission } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'favorites' | 'in_progress'>('all');
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());
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
    };

    if (activePopup !== null) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup]);

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
    setActivePopup(null);

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
    if (dog.is_scored) return '✅';
    if (dog.in_ring) return '🏃';
    if (dog.checkin_status === 4) return '🚪'; // At gate
    if (dog.checkin_status === 1) return '✅'; // Checked in
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

  const getVisibleDogs = (dogs: ClassEntry['dogs'], classId: number) => {
    const isExpanded = expandedClasses.has(classId);
    if (isExpanded) return dogs;
    
    // Show first 5 dogs, prioritizing in-ring and at-gate
    return dogs.slice(0, 5);
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
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#1a1d23]' : 'bg-background'}`}>
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
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#1a1d23]' : 'bg-background'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-foreground text-lg font-semibold mb-2">Trial not found</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#1a1d23]' : 'bg-background'}`}>
      {/* Header with outdoor-ready contrast */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/30">
        <div className="flex items-center justify-between h-16 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-11 w-11 rounded-xl transition-all duration-300 hover:bg-muted/20 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Select Class
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={loadClassList}
            className="h-11 w-11 rounded-xl transition-all duration-300 hover:bg-muted/20 active:scale-95"
          >
            <RefreshCw className="h-5 w-5 text-foreground" />
          </Button>
        </div>
      </header>

      {/* Trial Info Card */}
      <div className="p-4">
        <Card className="backdrop-blur-xl bg-card/80 border border-border/30 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {trialInfo.trial_date}
                </h2>
                <p className="text-base text-muted-foreground">
                  {trialInfo.trial_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {trialInfo.total_classes}
                </p>
                <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
                  Classes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs with Apple Design */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 rounded-xl p-1 grid grid-cols-2 gap-1">
          <button
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              statusFilter === 'pending'
                ? 'bg-gradient-to-r from-orange-500/10 to-orange-600/5 text-orange-600 shadow-sm border border-orange-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setStatusFilter('pending');
            }}
          >
            <Clock className="h-4 w-4" />
            <span>{trialInfo.pending_classes} Pending</span>
            {trialInfo.pending_classes > 0 && (
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              statusFilter === 'completed'
                ? 'bg-gradient-to-r from-green-500/10 to-green-600/5 text-green-600 shadow-sm border border-green-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setStatusFilter('completed');
            }}
          >
            <CheckCircle className="h-4 w-4" />
            <span>{trialInfo.completed_classes} Completed</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30 rounded-xl p-1 grid grid-cols-3 gap-1">
          <button
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              typeFilter === 'all'
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setTypeFilter('all');
            }}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              typeFilter === 'favorites'
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setTypeFilter('favorites');
            }}
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Favorites</span>
          </button>
          <button
            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              typeFilter === 'in_progress'
                ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
            }`}
            onClick={() => {
              hapticFeedback.impact('light');
              setTypeFilter('in_progress');
            }}
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Active</span>
          </button>
        </div>
      </div>

      {/* Classes List with Premium Cards */}
      <div className="px-4 pb-24 space-y-4">
        {filteredClasses.map((classEntry) => {
          const hasPendingEntries = classEntry.entry_count > classEntry.completed_count;
          const isInProgress = classEntry.class_status === 'in_progress';
          return (
            <Card 
              key={classEntry.id}
              className={`cursor-pointer group transition-all duration-500 backdrop-blur-xl border border-border/30 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 active:scale-98 ${
                hasPendingEntries || isInProgress
                  ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 shadow-orange-500/20' 
                  : 'bg-card/80'
              }`}
              onClick={() => handleViewEntries(classEntry)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {classEntry.class_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Judge: {classEntry.judge_name}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      {classEntry.completed_count} of {classEntry.entry_count} entries scored
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {(hasPendingEntries || isInProgress) && (
                      <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 animate-pulse" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(classEntry.id);
                      }}
                      className="h-11 w-11 rounded-xl hover:bg-muted/20 active:scale-95"
                    >
                      <Heart 
                        className={`h-5 w-5 transition-colors ${
                          classEntry.is_favorite 
                            ? 'text-red-500 fill-red-500' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`} 
                      />
                    </Button>
                  </div>
                </div>

                {/* Entry Preview */}
                <div className="space-y-3">
                  {classEntry.dogs.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {getVisibleDogs(classEntry.dogs, classEntry.id).map((dog) => {
                          const statusColor = getDogStatusColor(dog);
                          const statusIcon = getDogStatusIcon(dog);
                          return (
                            <div 
                              key={dog.id}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer group/dog ${
                                statusColor === 'completed' ? 'bg-green-500/10 border border-green-500/20' :
                                statusColor === 'in-ring' ? 'bg-orange-500/10 border border-orange-500/20' :
                                statusColor === 'at-gate' ? 'bg-blue-500/10 border border-blue-500/20' :
                                'bg-muted/20 border border-transparent hover:border-border/30'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                hapticFeedback.impact('light');
                                navigate(`/dog/${dog.armband}`);
                              }}
                            >
                              <span className="text-lg">{statusIcon}</span>
                              <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{dog.armband}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground group-hover/dog:text-primary transition-colors">
                                  {dog.call_name}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {!expandedClasses.has(classEntry.id) && classEntry.dogs.length > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleClassExpansion(classEntry.id);
                          }}
                          className="w-full justify-center gap-2 h-10 text-sm rounded-lg border-border/30 hover:border-primary/30 transition-all duration-200"
                        >
                          <ChevronDown className="h-4 w-4" />
                          Show all {classEntry.dogs.length} dogs
                        </Button>
                      )}
                      
                      {expandedClasses.has(classEntry.id) && classEntry.dogs.length > 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleClassExpansion(classEntry.id);
                          }}
                          className="w-full justify-center gap-2 h-10 text-sm rounded-lg border-border/30 hover:border-primary/30 transition-all duration-200"
                        >
                          <ChevronUp className="h-4 w-4" />
                          Show less
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No dogs entered yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Entries will appear when dogs are registered
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border/20">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    getStatusColor(classEntry.class_status) === 'in-progress' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                    getStatusColor(classEntry.class_status) === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                    'bg-muted/20 text-muted-foreground border-border/30'
                  }`}>
                    {getStatusLabel(classEntry.class_status)}
                  </div>
                  
                  {classEntry.entry_count > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEntries(classEntry);
                      }}
                      className="h-8 px-3 text-xs rounded-lg border-border/30 hover:border-primary/30 transition-all duration-200"
                    >
                      <Eye className="h-3 w-3 mr-1.5" />
                      View Entries
                    </Button>
                  )}
                  
                  {hasPermission('canScore') && classEntry.entry_count > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEntries(classEntry);
                      }}
                      className="h-8 px-3 text-xs rounded-lg border-orange-500/30 hover:border-orange-500/50 text-orange-600 hover:bg-orange-500/10 transition-all duration-200"
                    >
                      <Play className="h-3 w-3 mr-1.5" />
                      Score Class
                    </Button>
                  )}
                
                  
                  {hasPermission('canManageClasses') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopup(activePopup === classEntry.id ? null : classEntry.id);
                      }}
                      className="h-8 w-8 rounded-lg hover:bg-muted/20 active:scale-95"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Management Popup */}
      {activePopup !== null && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-background/80" onClick={() => setActivePopup(null)}>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw]">
            <Card className="backdrop-blur-xl bg-card/95 border border-border/30 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Class Status</h3>
                <div className="space-y-2">
                  {[
                    { status: 'none', label: 'None', icon: '⚪' },
                    { status: 'setup', label: 'Setup', icon: '🔧' },
                    { status: 'briefing', label: 'Briefing', icon: '📋' },
                    { status: 'break', label: 'Break', icon: '☕' },
                    { status: 'start_time', label: 'Start Time', icon: '⏰' },
                    { status: 'in_progress', label: 'In Progress', icon: '🏃' },
                    { status: 'completed', label: 'Completed', icon: '✅' }
                  ].map(({ status, label, icon }) => (
                    <Button
                      key={status}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 text-left rounded-lg hover:bg-muted/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassStatusChange(activePopup, status as any);
                      }}
                    >
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bottom Navigation with Outdoor-Ready Design */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-t border-border/30">
        <div className="flex items-center justify-around h-20 px-4">
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/20"
            onClick={() => navigate('/home')}
          >
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/20"
            onClick={() => navigate('/announcements')}
          >
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs font-medium">News</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/20"
            onClick={() => navigate('/calendar')}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs font-medium">Calendar</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-16 w-16 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/20"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs font-medium">Settings</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};