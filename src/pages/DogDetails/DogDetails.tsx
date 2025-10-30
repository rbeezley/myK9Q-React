import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { supabase } from '../../lib/supabase';
// Updated field mappings for unified view
import { updateEntryCheckinStatus } from '../../services/entryService';
import { Button, HamburgerMenu, ArmbandBadge, TrialDateBadge } from '../../components/ui';
import { CheckinStatusDialog, CheckinStatus } from '../../components/dialogs/CheckinStatusDialog';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { formatTimeForDisplay } from '../../utils/timeUtils';
import { getEntryStatusColor, getEntryStatusLabel } from '../../utils/statusUtils';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Clock,
  AlertTriangle,
  ThumbsUp,
  XCircle,
  Target,
  User,
  Check,
  Circle,
  Star
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
      // Query the view which now includes entry_status field
      const { data, error } = await supabase
        .from('view_entry_class_join_normalized')
        .select('*')
        .eq('license_key', showContext?.licenseKey)
        .eq('armband_number', parseInt(armband!));

      if (error) {
        console.error('Error loading dog details:', error);
        return;
      }

      if (data && data.length > 0) {
        // Set dog info from first record
        const firstEntry = data[0];
        setDogInfo({
          armband: firstEntry.armband_number,
          call_name: firstEntry.dog_call_name,
          breed: firstEntry.dog_breed,
          handler: firstEntry.handler_name
        });

        // Process all classes - map entry status from unified status field
        setClasses(data.map((entry) => {
          // Use unified entry_status field
          const statusText = entry.entry_status || 'none';
          const check_in_status: ClassEntry['check_in_status'] = statusText === 'in-ring' ? 'none' : statusText as CheckinStatus;

          return {
            id: entry.id,
            class_name: entry.element && entry.level ? `${entry.element} ${entry.level}` : 'Unknown Class',
            class_type: entry.element || 'Unknown',
            trial_name: `Trial ${entry.trial_number || ''}`,
            trial_date: entry.trial_date,
            search_time: entry.search_time_seconds ? `${entry.search_time_seconds}s` : null,
            fault_count: entry.total_faults || null,
            result_text: entry.result_status,
            is_scored: entry.is_scored || false,
            checked_in: check_in_status !== 'none',
            check_in_status,
            position: entry.final_placement || undefined,
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

      // Exhibitors should only be able to use standard check-in statuses
      // 'in-ring' and 'completed' are filtered out by showRingManagement={false}
      if (status === 'in-ring' || status === 'completed') {
        console.warn('Ring management statuses not available for exhibitors');
        return;
      }

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

      // Update database using the proper service function
      await updateEntryCheckinStatus(classId, status);
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

    setActivePopup(activePopup === classId ? null : classId);
  };

  // Use centralized status utilities
  const getStatusColor = getEntryStatusColor;
  const getStatusLabel = getEntryStatusLabel;

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
      <header className="page-header dog-header">
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
            <div key={entry.id} className={`class-card ${statusColor}`} style={{ position: 'relative' }}>
              {/* Status Button - positioned absolute, aligned with position badge */}
              <button
                onClick={(e) => !isScored && handleOpenPopup(e, entry.id)}
                disabled={isScored}
                className={`status-button ${statusColor}`}
                style={{
                  position: 'absolute',
                  top: '0.875rem',  // Aligned with position badge
                  right: '1rem',
                  zIndex: 1,
                  minWidth: '100px',
                  height: '36px'
                }}
              >
                {/* Check-in status icons - matching dialog */}
                {entry.check_in_status === 'checked-in' && <Check className="status-icon h-4 w-4" />}
                {entry.check_in_status === 'conflict' && <AlertTriangle className="status-icon h-4 w-4" />}
                {entry.check_in_status === 'pulled' && <XCircle className="status-icon h-4 w-4" />}
                {entry.check_in_status === 'at-gate' && <Star className="status-icon h-4 w-4" />}
                {entry.check_in_status === 'none' && !isScored && <Circle className="status-icon h-4 w-4" />}

                {/* Result status icons */}
                {statusColor === 'qualified' && <ThumbsUp />}
                {statusColor === 'not-qualified' && <XCircle />}

                {getStatusLabel(entry)}
              </button>

              <div className="class-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Top row: Position Badge + Class Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingRight: '120px'
                }}>
                  {/* Position Badge */}
                  <div className="class-position" style={{ flexShrink: 0 }}>
                    {entry.position ? (
                      <div className="position-badge">
                        <Trophy />
                        <span className="position-number">{entry.position}</span>
                      </div>
                    ) : (
                      <span className="position-placeholder">--</span>
                    )}
                  </div>

                  {/* Class Name - vertically centered with badge */}
                  <h4 className="class-name" style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    flex: 1
                  }}>
                    {[
                      entry.element,
                      entry.level,
                      entry.section && entry.section !== '-' ? entry.section : null
                    ].filter(Boolean).join(' • ')}
                  </h4>
                </div>

                {/* Second row: Metadata */}
                <div className="class-meta-details" style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  paddingLeft: '60px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <TrialDateBadge date={entry.trial_date} />
                  </span>
                  {entry.trial_number && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Target size={14}  style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                      Trial {entry.trial_number}
                    </span>
                  )}
                  {entry.judge_name && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <User size={14}  style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                      {entry.judge_name}
                    </span>
                  )}
                </div>

                {/* Performance Stats - only show if dog has completed the class */}
                {entry.is_scored && (
                  <div className="class-stats" style={{
                    marginTop: '0.25rem',
                    paddingLeft: '60px'
                  }}>
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
            </div>
          );
        })}
      </div>

      {/* Status Management Dialog */}
      <CheckinStatusDialog
        isOpen={activePopup !== null}
        onClose={() => {
          setActivePopup(null);
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