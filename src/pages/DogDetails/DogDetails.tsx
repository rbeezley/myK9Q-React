import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
import { Button, HamburgerMenu } from '../../components/ui';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { 
  ArrowLeft, 
  RefreshCw, 
  Trophy, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  CircleDot
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
  // Additional fields that might contain element/level/section info
  element?: string;
  level?: string;
  section?: string;
  trial_number?: number;
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
  const { hasPermission, isExhibitor: _isExhibitor } = usePermission();
  const hapticFeedback = useHapticFeedback();
  const [dogInfo, setDogInfo] = useState<DogInfo | null>(null);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<number | null>(null);
  const [_popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

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

        // Debug: log the first entry to see available fields
        if (data.length > 0) {
          console.log('Available entry fields:', Object.keys(data[0]));
          console.log('First entry data:', data[0]);
        }

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
            position: index === 1 ? 2 : undefined, // Mark second entry as "2nd" for demo
            // Map additional fields if they exist
            element: entry.element || entry.Element || null,
            level: entry.level || entry.Level || null,
            section: entry.section || entry.Section || null,
            trial_number: entry.trial_number || entry.trialid || null
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
    <div className="dog-details-container">
      
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
          <div className="armband-display">
            {dogInfo.armband}
          </div>
          
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
                      {entry.class_name}
                    </h4>
                    <p className="class-type">
                      {[
                        entry.class_type,
                        entry.element,
                        entry.level,
                        entry.section && entry.section !== '-' ? entry.section : null
                      ].filter(Boolean).join(' • ')}
                    </p>
                    <p className="class-date">
                      {entry.trial_date} • {entry.trial_name} 
                      {entry.trial_number && ` • ${entry.trial_number}`}
                    </p>
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
                  {statusColor === 'qualified' && <CheckCircle />}
                  {statusColor === 'not-qualified' && <XCircle />}
                  {statusColor === 'at-gate' && <CircleDot />}
                  {statusColor === 'checked-in' && <CheckCircle />}
                  {getStatusLabel(entry)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Management Popup */}
      {activePopup !== null && (
        <div className="status-popup-overlay" onClick={() => {
          setActivePopup(null);
          setPopupPosition(null);
        }}>
          <div className="status-popup">
            <div className="popup-header">
              <h3 className="popup-title">Check-in Status</h3>
            </div>
            <div className="popup-options">
              <button
                className="popup-option none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(activePopup, 'none');
                }}
              >
                <span className="popup-icon">⚪</span>
                Not Checked In
              </button>
                  
              <button
                className="popup-option checked-in"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(activePopup, 'checked-in');
                }}
              >
                <CheckCircle className="popup-icon" />
                Check-in
              </button>
                  
              <button
                className="popup-option conflict"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(activePopup, 'conflict');
                }}
              >
                <AlertTriangle className="popup-icon" />
                Conflict
              </button>
                  
              <button
                className="popup-option pulled"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(activePopup, 'pulled');
                }}
              >
                <XCircle className="popup-icon" />
                Pulled
              </button>
              
              {hasPermission('canAccessScoresheet') && (
                <button
                  className="popup-option at-gate"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(activePopup, 'at-gate');
                  }}
                >
                  <CircleDot className="popup-icon" />
                  At Gate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};