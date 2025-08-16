import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, Button } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trophy, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  CircleDot,
  Home as HomeIcon,
  MessageSquare,
  Calendar,
  Settings,
  Download
} from 'lucide-react';
import './DogDetails.css';

interface ClassEntry {
  id: number;
  class_name: string;
  class_type: string;
  trial_name: string;
  trial_date: string;
  search_time: string | null;
  fault_count: number | null;
  result_text: string | null;
  is_scored: boolean;
  checked_in: boolean;
  check_in_status?: 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate';
  position?: number;
}

interface DogInfo {
  armband: number;
  call_name: string;
  breed: string;
  handler: string;
}

export const DogDetails: React.FC = () => {
  const { armband } = useParams<{ armband: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  const { hasPermission, isExhibitor: _isExhibitor } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (armband && showContext) {
      loadDogDetails();
    }
  }, [armband, showContext]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.status-popup') && !target.closest('.status-button')) {
        setActivePopup(null);
      }
    };

    if (activePopup !== null) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup]);

  const loadDogDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_entry_class_join_distinct')
        .select('*')
        .eq('mobile_app_lic_key', showContext?.licenseKey)
        .eq('armband', parseInt(armband!));

      if (error) {
        console.error('Error loading dog details:', error);
        return;
      }

      if (data && data.length > 0) {
        // Set dog info from first record
        const firstEntry = data[0];
        setDogInfo({
          armband: firstEntry.armband,
          call_name: firstEntry.call_name,
          breed: firstEntry.breed,
          handler: firstEntry.handler
        });

        // Process all classes - map integer checkin_status to our types
        setClasses(data.map((entry, index) => {
          let check_in_status: ClassEntry['check_in_status'] = 'none';
          
          // Map integer checkin_status codes to our status types
          switch (entry.checkin_status) {
            case 1:
              check_in_status = 'checked-in';
              break;
            case 2:
              check_in_status = 'conflict';
              break;
            case 3:
              check_in_status = 'pulled';
              break;
            case 4:
              check_in_status = 'at-gate';
              break;
            default: // 0 or null
              check_in_status = 'none';
              break;
          }
          
          return {
            id: entry.id,
            class_name: entry.class_name,
            class_type: entry.class_type,
            trial_name: entry.trial_name,
            trial_date: entry.trial_date,
            search_time: entry.search_time,
            fault_count: entry.fault_count,
            result_text: entry.result_text,
            is_scored: entry.is_scored || false,
            checked_in: check_in_status !== 'none',
            check_in_status,
            position: index === 1 ? 2 : undefined // Mark second entry as "2nd" for demo
          };
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (classId: number, status: ClassEntry['check_in_status']) => {
    try {
      console.log('Updating status:', classId, status);
      hapticFeedback.impact('medium');
      
      // Update local state immediately for better UX
      setClasses(prev => prev.map(c => 
        c.id === classId 
          ? { 
              ...c, 
              checked_in: status !== 'none',
              check_in_status: status,
              // Keep result_text unchanged - it's for scoring results only
            } 
          : c
      ));
      
      // Close popup
      setActivePopup(null);
      setPopupPosition(null);

      // Update database - use checkin_status column (not result_text)
      const updateData: any = {};
      
      // Update only checkin_status - use integer codes matching schema
      // in_ring should only be set when scoresheet is opened
      if (status === 'none') {
        updateData.checkin_status = 0; // 0 = none (default)
      } else if (status === 'checked-in') {
        updateData.checkin_status = 1; // 1 = checked-in
      } else if (status === 'conflict') {
        updateData.checkin_status = 2; // 2 = conflict
      } else if (status === 'pulled') {
        updateData.checkin_status = 3; // 3 = pulled
      } else if (status === 'at-gate') {
        updateData.checkin_status = 4; // 4 = at-gate
        // Don't set in_ring = true here - that should only happen when scoresheet opens
      }

      console.log('Updating database with:', updateData);
      
      const { error } = await supabase
        .from('tbl_entry_queue')
        .update(updateData)
        .eq('id', classId);

      if (error) {
        console.error('Database update error:', error);
        console.error('Update data was:', updateData);
        console.error('Class ID was:', classId);
        
        // Revert local state if database update fails
        await loadDogDetails();
      } else {
        console.log('Database update successful');
      }
    } catch (error) {
      console.error('Error:', error);
      // Reload to get correct state
      await loadDogDetails();
    }
  };

  const _handleGoToGate = (classId: number) => {
    navigate(`/scoresheet/${classId}`);
  };

  const handleOpenPopup = (event: React.MouseEvent<HTMLButtonElement>, classId: number) => {
    event.stopPropagation();
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Calculate position to show popup below the button
    // Adjust if too close to screen edges
    let left = rect.left;
    let top = rect.bottom + 8;
    
    // Check if popup would go off right edge
    if (left + 180 > window.innerWidth) {
      left = window.innerWidth - 190;
    }
    
    // Check if popup would go off bottom edge
    if (top + 250 > window.innerHeight) {
      // Show above button instead
      top = rect.top - 250;
    }
    
    setPopupPosition({ top, left });
    setActivePopup(activePopup === classId ? null : classId);
  };

  const getStatusColor = (entry: ClassEntry) => {
    if (entry.check_in_status === 'checked-in') return 'checked-in';
    if (entry.check_in_status === 'conflict') return 'conflict';
    if (entry.check_in_status === 'pulled') return 'pulled';
    if (entry.check_in_status === 'at-gate') return 'at-gate';
    
    if (entry.is_scored) {
      if (entry.result_text === 'Q' || entry.result_text === 'Qualified') {
        return 'qualified';
      } else if (entry.result_text === 'NQ' || entry.result_text === 'Not Qualified') {
        return 'not-qualified';
      } else if (entry.result_text === 'EX' || entry.result_text === 'Excused') {
        return 'excused';
      }
    }
    return 'pending';
  };

  const getStatusLabel = (entry: ClassEntry) => {
    if (entry.check_in_status === 'checked-in') return 'Checked-in';
    if (entry.check_in_status === 'conflict') return 'Conflict';
    if (entry.check_in_status === 'pulled') return 'Pulled';
    if (entry.check_in_status === 'at-gate') return 'At Gate';
    
    if (entry.is_scored && entry.result_text) {
      switch (entry.result_text) {
        case 'Q':
        case 'Qualified':
          return 'Qualified';
        case 'NQ':
        case 'Not Qualified':
          return 'Failed';
        case 'EX':
        case 'Excused':
          return 'Conflict';
        default:
          return entry.result_text;
      }
    }
    
    return 'Not Checked In';
  };

  const formatTime = (time: string | null) => {
    return time || '00:00.00';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#1a1d23]' : 'bg-background'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading dog details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dogInfo) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#1a1d23]' : 'bg-background'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-foreground text-lg font-semibold mb-2">Dog not found</p>
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
            {dogInfo.call_name}
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={loadDogDetails}
            className="h-11 w-11 rounded-xl transition-all duration-300 hover:bg-muted/20 active:scale-95"
          >
            <RefreshCw className="h-5 w-5 text-foreground" />
          </Button>
        </div>
      </header>

      {/* Prominent Dog Info Card */}
      <div className="p-4">
        <Card className="backdrop-blur-xl bg-card/80 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              {/* Extra Prominent Armband for Outdoor Visibility */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-primary">
                    {dogInfo.armband}
                  </span>
                </div>
              </div>
              
              {/* Dog Information */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {dogInfo.call_name}
                </h2>
                <p className="text-base text-muted-foreground mb-1">
                  {dogInfo.breed}
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Handler: {dogInfo.handler}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground/60 bg-muted/20 px-4 py-2 rounded-lg inline-block">
            Results below are preliminary
          </p>
        </div>
      </div>

      {/* Class Entry Cards with Status Indicators */}
      <div className="px-4 pb-24 space-y-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Class Entries
        </h3>
        
        {classes.map((entry) => {
          const statusColor = getStatusColor(entry);
          const isScored = entry.is_scored;
          
          return (
            <Card 
              key={entry.id}
              className={`transition-all duration-500 backdrop-blur-xl border border-border/30 hover:shadow-lg ${
                statusColor === 'qualified' ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20' :
                statusColor === 'not-qualified' ? 'bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20' :
                statusColor === 'at-gate' ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20' :
                statusColor === 'checked-in' ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20' :
                'bg-card/80'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Position Badge */}
                  <div className="flex-shrink-0">
                    {entry.position ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <span className="absolute text-xs font-bold text-yellow-600 mt-1">{entry.position}</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-muted/20 border border-border/30 rounded-xl flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">--</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Class Information */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide mb-1">
                        {entry.trial_date} • {entry.trial_name}
                      </p>
                      <h4 className="text-base font-semibold text-foreground mb-2">
                        {entry.class_name}
                      </h4>
                    </div>
                    
                    {/* Performance Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {formatTime(entry.search_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {entry.fault_count || 0} faults
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant={isScored ? "outline" : "ghost"}
                      size="sm"
                      onClick={(e) => !isScored && handleOpenPopup(e, entry.id)}
                      disabled={isScored}
                      className={`min-w-[100px] h-10 rounded-lg border transition-all duration-200 ${
                        statusColor === 'qualified' ? 'border-green-500/30 text-green-600 bg-green-500/10 hover:bg-green-500/20' :
                        statusColor === 'not-qualified' ? 'border-red-500/30 text-red-600 bg-red-500/10 hover:bg-red-500/20' :
                        statusColor === 'at-gate' ? 'border-blue-500/30 text-blue-600 bg-blue-500/10 hover:bg-blue-500/20' :
                        statusColor === 'checked-in' ? 'border-orange-500/30 text-orange-600 bg-orange-500/10 hover:bg-orange-500/20' :
                        'border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {statusColor === 'qualified' && <CheckCircle className="h-4 w-4" />}
                        {statusColor === 'not-qualified' && <XCircle className="h-4 w-4" />}
                        {statusColor === 'at-gate' && <CircleDot className="h-4 w-4" />}
                        {statusColor === 'checked-in' && <CheckCircle className="h-4 w-4" />}
                        <span className="text-xs font-medium">
                          {getStatusLabel(entry)}
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Management Popup */}
      {activePopup !== null && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-background/80" onClick={() => {
          setActivePopup(null);
          setPopupPosition(null);
        }}>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw]">
            <Card className="backdrop-blur-xl bg-card/95 border border-border/30 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Check-in Status</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-left rounded-lg hover:bg-muted/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(activePopup, 'none');
                    }}
                  >
                    <span className="text-lg">⚪</span>
                    <span className="text-sm font-medium">Not Checked In</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-left rounded-lg hover:bg-orange-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(activePopup, 'checked-in');
                    }}
                  >
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Check-in</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-left rounded-lg hover:bg-yellow-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(activePopup, 'conflict');
                    }}
                  >
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">Conflict</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12 text-left rounded-lg hover:bg-red-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(activePopup, 'pulled');
                    }}
                  >
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Pulled</span>
                  </Button>
                  
                  {hasPermission('canAccessScoresheet') && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12 text-left rounded-lg hover:bg-blue-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(activePopup, 'at-gate');
                      }}
                    >
                      <CircleDot className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">At Gate</span>
                    </Button>
                  )}
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