import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { updateEntryCheckinStatus } from '../../services/entryService';
import { Button, HamburgerMenu, ArmbandBadge } from '../../components/ui';
import { CheckinStatusDialog, CheckinStatus } from '../../components/dialogs/CheckinStatusDialog';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { formatTimeForDisplay } from '../../utils/timeUtils';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Clock,
  AlertTriangle,
  ThumbsUp,
  XCircle,
  Calendar,
  Target,
  User
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
  check_in_status?: CheckinStatus;
  position?: number;
  // Additional fields that might contain element/level/section info
  element?: string;
  level?: string;
  section?: string;
  trial_number?: number;
  judge_name?: string;
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
  const { showContext, role: _role } = useAuth();
  const { hasPermission: _hasPermission, isExhibitor: _isExhibitor } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [_popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (armband && showContext) {
      loadDogDetails();
    }
  }, [armband, showContext]);

  // Set loaded class after data loads to prevent CSS rehydration issues
  useEffect(() => {
    if (!isLoading && classes.length > 0) {
      // Small delay to ensure DOM is stable
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, classes.length]);

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
      // Query the view which now includes check_in_status_text field
      const { data, error } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', showContext?.licenseKey)
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

        // Process all classes - map check-in status from text field
        setClasses(data.map((entry, index) => {
          let check_in_status: ClassEntry['check_in_status'] = 'none';

          // Use text-based check-in status (matches what updateEntryCheckinStatus writes)
          const statusText = entry.check_in_status_text || 'none';

          switch (statusText) {
            case 'checked-in':
              check_in_status = 'checked-in';
              break;
            case 'conflict':
              check_in_status = 'conflict';
              break;
            case 'pulled':
              check_in_status = 'pulled';
              break;
            case 'at-gate':
              check_in_status = 'at-gate';
              break;
            default: // 'none' or null
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
            result_text: entry.result_status,
            is_scored: entry.is_scored || false,
            checked_in: check_in_status !== 'none',
            check_in_status,
            position: entry.placement || undefined, // Use actual placement from results
            // Map additional fields
            element: entry.element,
            level: entry.level,
            section: entry.section,
            trial_number: entry.trial_number,
            judge_name: entry.judge_name
          };
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (classId: number, status: CheckinStatus) => {
    try {
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

      // Update database using the proper service function
      await updateEntryCheckinStatus(classId, status);
    } catch (error) {
      console.error('Error:', error);
      // Reload to get correct state
      await loadDogDetails();
    }
  };

  const formatTrialDate = (dateString: string) => {
    try {
      // Parse date components manually to avoid timezone issues (matches Home page)
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const dayNumber = date.getDate();
      const yearNumber = date.getFullYear();

      return `${dayName}, ${monthName} ${dayNumber}, ${yearNumber}`;
    } catch {
      return dateString; // Fallback to original if parsing fails
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
      const resultLower = entry.result_text?.toLowerCase();
      if (resultLower === 'q' || resultLower === 'qualified') {
        return 'qualified';
      } else if (resultLower === 'nq' || resultLower === 'not qualified') {
        return 'not-qualified';
      } else if (resultLower === 'ex' || resultLower === 'excused') {
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
      const resultLower = entry.result_text.toLowerCase();
      switch (resultLower) {
        case 'q':
        case 'qualified':
          return 'Qualified';
        case 'nq':
        case 'not qualified':
          return 'Not Qualified';
        case 'ex':
        case 'excused':
          return 'Excused';
        default:
          // Capitalize first letter of any other status
          return entry.result_text.charAt(0).toUpperCase() + entry.result_text.slice(1);
      }
    }

    return 'Not Checked In';
  };

  const formatTime = (time: string | null) => {
    return formatTimeForDisplay(time);
  };

  if (isLoading) {
    return (
      <div className="dog-details-container">
        <div className="loading-container">
          <div className="loading-content">
            <RefreshCw className="loading-spinner" />
            <p className="loading-text">Loading dog details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dogInfo) {
    return (
      <div className="dog-details-container">
        <div className="error-container">
          <div className="error-content">
            <p className="error-message">Dog not found</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="error-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dog-details-container app-container ${isLoaded ? 'loaded' : ''}`}>
      
      {/* Header with outdoor-ready contrast */}
      <header className="dog-header">
        <HamburgerMenu 
          backNavigation={{
            label: "Back",
            action: () => navigate(-1)
          }}
        />
        
        <h1>{dogInfo.call_name}</h1>
        
        <div className="header-actions">
          <button className="refresh-button" onClick={loadDogDetails}>
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Prominent Dog Info Card */}
      <div className="dog-info-card">
        <div className="dog-info-content">
          {/* Extra Prominent Armband for Outdoor Visibility */}
          <ArmbandBadge number={dogInfo.armband} className="armband-display" />

          {/* Dog Information */}
          <div className="dog-details">
            <h2>{dogInfo.call_name}</h2>
            <p className="breed">{dogInfo.breed}</p>
            <p className="handler">Handler: {dogInfo.handler}</p>
          </div>
        </div>
      </div>
      
      <p className="results-notice">
        Results below are preliminary
      </p>

      {/* Class Entry Cards with Status Indicators */}
      <div className="classes-section">
        <h3 className="classes-header">Class Entries</h3>
        
        {classes.map((entry) => {
          const statusColor = getStatusColor(entry);
          const isScored = entry.is_scored;
          
          return (
            <div key={entry.id} className={`class-card ${statusColor}`}>
              <div className="class-content">
                {/* Position Badge */}
                <div className="class-position">
                  {entry.position ? (
                    <div className="position-badge">
                      <Trophy />
                      <span className="position-number">{entry.position}</span>
                    </div>
                  ) : (
                    <span className="position-placeholder">--</span>
                  )}
                </div>
                  
                {/* Class Information */}
                <div className="class-info">
                  <div className="class-meta">
                    <h4 className="class-name">
                      {[
                        entry.element,
                        entry.level,
                        entry.section && entry.section !== '-' ? entry.section : null
                      ].filter(Boolean).join(' • ')}
                    </h4>
                    <div className="class-meta-details">
                      <p className="class-date">
                        <Calendar size={14} />
                        {formatTrialDate(entry.trial_date)}
                      </p>
                      {entry.trial_number && (
                        <p className="class-trial">
                          <Target size={14} />
                          Trial {entry.trial_number}
                        </p>
                      )}
                      {entry.judge_name && (
                        <p className="class-judge">
                          <User size={14} />
                          {entry.judge_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Performance Stats - only show if dog has completed the class */}
                  {entry.is_scored && (
                    <div className="class-stats">
                      <div className="stat-item">
                        <Clock />
                        <span className="stat-value">
                          {formatTime(entry.search_time)}
                        </span>
                      </div>
                      <div className="stat-item">
                        <AlertTriangle />
                        <span className="stat-value">
                          {entry.fault_count || 0} faults
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Status Button */}
                <button
                  onClick={(e) => !isScored && handleOpenPopup(e, entry.id)}
                  disabled={isScored}
                  className={`status-button ${statusColor}`}
                >
                  {/* Check-in status icons */}
                  {entry.check_in_status === 'checked-in' && <span className="status-icon">✓</span>}
                  {entry.check_in_status === 'conflict' && <span className="status-icon">!</span>}
                  {entry.check_in_status === 'pulled' && <span className="status-icon">✕</span>}
                  {entry.check_in_status === 'at-gate' && <span className="status-icon">★</span>}
                  {entry.check_in_status === 'none' && !isScored && <span className="status-icon">●</span>}

                  {/* Result status icons */}
                  {statusColor === 'qualified' && <ThumbsUp />}
                  {statusColor === 'not-qualified' && <XCircle />}

                  {getStatusLabel(entry)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Management Dialog */}
      <CheckinStatusDialog
        isOpen={activePopup !== null}
        onClose={() => {
          setActivePopup(null);
          setPopupPosition(null);
        }}
        onStatusChange={(status) => {
          if (activePopup !== null) {
            handleStatusChange(activePopup, status);
          }
        }}
        dogInfo={{
          armband: dogInfo?.armband || 0,
          callName: dogInfo?.call_name || '',
          handler: dogInfo?.handler || ''
        }}
        showDescriptions={true}
      />

    </div>
  );
};