import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { updateEntryCheckinStatus } from '../../services/entryService';
import { getAvailabilityMessage } from '../../services/resultVisibilityService';
import { Button, HamburgerMenu, ArmbandBadge, TrialDateBadge } from '../../components/ui';
import { CheckinStatusDialog, CheckinStatus } from '../../components/dialogs/CheckinStatusDialog';
import { useHapticFeedback } from '../../utils/hapticFeedback';
import { formatTimeForDisplay } from '../../utils/timeUtils';
import { getEntryStatusColor, getEntryStatusLabel } from '../../utils/statusUtils';
import { useDogDetailsData, ClassEntry } from './hooks/useDogDetailsData';
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

export const DogDetails: React.FC = () => {
  const { armband } = useParams<{ armband: string }>();
  const navigate = useNavigate();
  const { showContext, role: _role } = useAuth();
  const { hasPermission: _hasPermission, isExhibitor: _isExhibitor, currentRole } = usePermission();
  const hapticFeedback = useHapticFeedback();

  // Use React Query for data fetching
  const {
    data,
    isLoading,
    error: _fetchError,
    refetch
  } = useDogDetailsData(armband, showContext?.licenseKey, currentRole);

  // Derive state from React Query data instead of syncing
  const dogInfo = data?.dogInfo ?? null;
  const classes = data?.classes ?? [];

  // Local state for UI management only
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePopup, setActivePopup] = useState<number | null>(null);

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

  const handleStatusChange = async (classId: number, status: CheckinStatus) => {
    try {
      hapticFeedback.impact('medium');

      // Exhibitors should only be able to use standard check-in statuses
      // 'in-ring' and 'completed' are filtered out by showRingManagement={false}
      if (status === 'in-ring' || status === 'completed') {
        console.warn('Ring management statuses not available for exhibitors');
        return;
      }

      // Close popup
      setActivePopup(null);

      // Update database using the proper service function
      await updateEntryCheckinStatus(classId, status);

      // Refetch data to get updated state
      await refetch();
    } catch (error) {
      console.error('Error:', error);
      // Reload to get correct state
      await refetch();
    }
  };

  const handleClassCardClick = (entry: ClassEntry) => {
    hapticFeedback.impact('medium');

    // Navigate to the entry list for this class using class_id
    // Note: We don't need to check for combined Novice A/B classes here
    // since we're navigating from a specific dog's perspective
    navigate(`/class/${entry.class_id}/entries`);
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
    <div className={`dog-details-container ${isLoaded ? 'loaded' : ''}`}>
      
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
          <button className="refresh-button" onClick={() => refetch()}>
            <RefreshCw size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          </button>
        </div>
      </header>

      {/* Prominent Dog Info Card */}
      <div className="dog-info-card">
        <div className="dog-info-content">
          {/* Extra Prominent Armband for Outdoor Visibility */}
          <ArmbandBadge number={dogInfo.armband} />

          {/* Dog Information */}
          <div className="dog-details">
            <h2>{dogInfo.call_name}</h2>
            <p className="breed">{dogInfo.breed}</p>
            <p className="handler">Handler: {dogInfo.handler}</p>
          </div>
        </div>
      </div>
      
      <p className="results-notice">
        All Results are preliminary
      </p>

      {/* Class Entry Cards with Status Indicators */}
      <div className="classes-section">
        <h3 className="classes-header">Class Entries</h3>

        <div className="classes-grid">
        {classes.map((entry) => {
          const statusColor = getStatusColor(entry);
          const isScored = entry.is_scored;
          const isQualified = statusColor === 'qualified';
          const isNQ = statusColor === 'not-qualified';

          return (
            <div
              key={entry.id}
              className={`class-card ${statusColor} clickable`}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => handleClassCardClick(entry)}
            >
              {/* Corner Badge - Match EntryList design */}
              <div className="class-card-action">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when clicking status button
                    if (!isScored) {
                      handleOpenPopup(e, entry.id);
                    }
                  }}
                  disabled={isScored}
                  className={`status-badge ${statusColor}`}
                >
                  {/* Show actual result status for scored dogs - respect visibility */}
                  {isScored ? (
                    <>
                      {/* Only show qualification status if visible */}
                      {entry.visibleFields?.showQualification ? (
                        <>
                          {isQualified ? (
                            <>
                              <ThumbsUp size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                              <span className="status-text">Qualified</span>
                            </>
                          ) : isNQ ? (
                            <>
                              <XCircle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                              <span className="status-text">Not Qualified</span>
                            </>
                          ) : (
                            <>
                              <Check size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                              <span className="status-text">{getStatusLabel(entry)}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Circle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                          <span className="status-text">Results Pending</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Check-in status icons */}
                      {entry.check_in_status === 'checked-in' && <Check size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
                      {entry.check_in_status === 'conflict' && <AlertTriangle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
                      {entry.check_in_status === 'pulled' && <XCircle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
                      {entry.check_in_status === 'at-gate' && <Star size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
                      {entry.check_in_status === 'no-status' && <Circle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
                      <span className="status-text">{getStatusLabel(entry)}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="class-content">
                {/* Top row: Position Badge + Class Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingRight: '120px'
                }}>
                  {/* Position Badge - only show if placement visible and dog qualified with valid placement */}
                  <div className="class-position" style={{ flexShrink: 0 }}>
                    {entry.visibleFields?.showPlacement &&
                     entry.position &&
                     entry.position !== 9996 &&
                     isQualified ? (
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
                <div className="class-meta-details">
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

                {/* Performance Stats - respect visibility settings */}
                {entry.is_scored && (
                  <div className="class-stats">
                    {/* Time - show if visible, otherwise show availability message */}
                    {entry.visibleFields?.showTime ? (
                      <div className="stat-item">
                        <Clock />
                        <span className="stat-value">
                          {formatTime(entry.search_time)}
                        </span>
                      </div>
                    ) : (
                      <div className="stat-item dimmed">
                        <Clock />
                        <span className="stat-value">
                          ⏳ {getAvailabilityMessage(entry.is_completed || false, entry.timeTiming || 'class_complete')}
                        </span>
                      </div>
                    )}

                    {/* Faults - show if visible, otherwise show availability message */}
                    {entry.visibleFields?.showFaults ? (
                      <div className="stat-item">
                        <AlertTriangle />
                        <span className="stat-value">
                          {entry.fault_count || 0} faults
                        </span>
                      </div>
                    ) : (
                      <div className="stat-item dimmed">
                        <AlertTriangle />
                        <span className="stat-value">
                          ⏳ {getAvailabilityMessage(entry.is_completed || false, entry.faultsTiming || 'class_complete')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
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