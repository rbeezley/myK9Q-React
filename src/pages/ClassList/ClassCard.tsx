import React, { useMemo, useState } from 'react';
import { Heart, MoreHorizontal, Clock, Users, UserCheck, Circle, Wrench, MessageSquare, Coffee, CalendarClock, PlayCircle, CheckCircle, Calendar, WifiOff, AlertTriangle, Info, Eye, Smartphone } from 'lucide-react';
import { getStaleDataStatus, formatStaleTime } from '../../utils/staleDataUtils';
import { formatSecondsToMMSS } from '../../utils/timeUtils';
import { UserPermissions } from '../../utils/auth';

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
  class_status: 'no-status' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'offline-scoring' | 'completed';
  is_scoring_finalized?: boolean;
  is_favorite: boolean;
  time_limit_seconds?: number;
  time_limit_area2_seconds?: number;
  time_limit_area3_seconds?: number;
  area_count?: number;
  start_time?: string;
  briefing_time?: string;
  break_until?: string;
  planned_start_time?: string;
  last_result_at?: string;
  self_checkin_enabled?: boolean;
  visibility_preset?: 'open' | 'standard' | 'review';
  dogs: {
    id: number;
    armband: number;
    call_name: string;
    breed: string;
    handler: string;
    in_ring: boolean;
    checkin_status: number;
    is_scored: boolean;
    exhibitor_order: number;
  }[];
}

interface ClassCardProps {
  classEntry: ClassEntry;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  toggleFavorite: (classId: number) => void;
  handleViewEntries: (classEntry: ClassEntry) => void;
  setActivePopup: (id: number | null) => void;
  setSelectedClassForStatus: (classEntry: ClassEntry) => void;
  setStatusDialogOpen: (open: boolean) => void;
  activePopup: number | null;
  getStatusColor: (status: ClassEntry['class_status'], classEntry?: ClassEntry) => string;
  getFormattedStatus: (classEntry: ClassEntry) => { label: string; time: string | null };
  onMenuClick?: (classId: number) => void;
  onPrefetch?: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  classEntry,
  hasPermission,
  toggleFavorite,
  handleViewEntries,
  setActivePopup,
  setSelectedClassForStatus,
  setStatusDialogOpen,
  activePopup,
  getStatusColor,
  getFormattedStatus,
  onMenuClick,
  onPrefetch,
}) => {
  // Memoize computed values to prevent redundant function calls
  const statusColor = useMemo(
    () => getStatusColor(classEntry.class_status, classEntry),
    [classEntry, getStatusColor]
  );

  const formattedStatus = useMemo(
    () => getFormattedStatus(classEntry),
    [classEntry, getFormattedStatus]
  );

  // Check if run order data may be stale (for automatic offline detection)
  // Uses class_status === 'in_progress' which is automatically set when first dog is scored
  const staleStatus = useMemo(
    () => getStaleDataStatus({
      class_status: classEntry.class_status,
      last_result_at: classEntry.last_result_at,
    }),
    [classEntry.class_status, classEntry.last_result_at]
  );

  // State for class details popup
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);

  // Format planned start time for display
  const formatPlannedStartTime = (timestamp: string | undefined) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to get the appropriate icon for each status
  const getStatusIcon = (status: ClassEntry['class_status']) => {
    switch (status) {
      case 'no-status':
        return <Circle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      case 'setup':
        return <Wrench size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      case 'briefing':
        return <MessageSquare size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      case 'break':
        return <Coffee size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      case 'start_time':
        return <CalendarClock size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      case 'in_progress':
        return <PlayCircle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      case 'offline-scoring':
        return <WifiOff size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      case 'completed':
        return <CheckCircle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
      default:
        return <Circle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />;
    }
  };

  return (
    <div
      key={classEntry.id}
      className={`class-card touchable status-${classEntry.class_status.replace('_', '-')}`}
      onMouseEnter={() => onPrefetch?.()}
      onTouchStart={() => onPrefetch?.()}
      onClick={(e) => {
        // Don't navigate if clicking on interactive elements (buttons) or status badge
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('.class-card-status-action') ||
          target.closest('.status-badge')
        ) {
          return;
        }
        handleViewEntries(classEntry);
      }}
    >
      <div className="class-content">
        <div className="class-header">
          {/* Action buttons - positioned absolutely in top-right, horizontal layout */}
          <div className="class-actions">
            <button
              type="button"
              className={`favorite-button ${classEntry.is_favorite ? 'favorited' : ''}`}
              onClick={(e) => {
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
              style={{ zIndex: 15 }}
            >
              <Heart className="favorite-icon" />
            </button>

            <button
              className="class-menu-button"
              onClick={(e) => {
                e.stopPropagation();
                if (activePopup === classEntry.id) {
                  setActivePopup(null);
                } else {
                  onMenuClick?.(classEntry.id);
                }
              }}
            >
              <MoreHorizontal className="menu-icon" />
            </button>
          </div>

          {/* Class name and metadata section */}
          <div className="class-title-section">
            {/* Class name with info indicator for popup */}
            <div
              className="class-name-wrapper"
              onMouseEnter={() => setShowDetailsPopup(true)}
              onMouseLeave={() => setShowDetailsPopup(false)}
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailsPopup(!showDetailsPopup);
              }}
            >
              <h3 className="class-name">{classEntry.class_name}</h3>
              <span className="info-indicator" aria-hidden="true">
                <Info size={12} />
              </span>

              {/* Class Details Popup */}
              {showDetailsPopup && (
                <div className="class-details-popup">
                  <div className="popup-header">
                    <span className="popup-title">Class Settings</span>
                    <button
                      className="popup-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetailsPopup(false);
                      }}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div className="popup-content">
                    {/* Max Time */}
                    <div className="popup-row">
                      <Clock className="popup-icon" size={14} />
                      <span className="popup-label">Max Time:</span>
                      <span className="popup-value time-value">
                        {(classEntry.time_limit_seconds || classEntry.time_limit_area2_seconds || classEntry.time_limit_area3_seconds) ? (
                          classEntry.area_count && classEntry.area_count > 1 ? (
                            <>
                              {classEntry.time_limit_seconds && <span className="area-time"><span className="area-label">(1)</span> {formatSecondsToMMSS(classEntry.time_limit_seconds)}</span>}
                              {classEntry.time_limit_area2_seconds && <span className="area-time"><span className="area-label">(2)</span> {formatSecondsToMMSS(classEntry.time_limit_area2_seconds)}</span>}
                              {classEntry.time_limit_area3_seconds && <span className="area-time"><span className="area-label">(3)</span> {formatSecondsToMMSS(classEntry.time_limit_area3_seconds)}</span>}
                            </>
                          ) : (
                            classEntry.time_limit_seconds ? formatSecondsToMMSS(classEntry.time_limit_seconds) : 'TBD'
                          )
                        ) : (
                          'TBD'
                        )}
                      </span>
                    </div>

                    {/* Results Visibility */}
                    <div className="popup-row">
                      <Eye className="popup-icon" size={14} />
                      <span className="popup-label">Results:</span>
                      <span
                        className={`release-badge visibility-badge visibility-${classEntry.visibility_preset || 'standard'}`}
                      >
                        {classEntry.visibility_preset === 'open'
                          ? 'Immediately'
                          : classEntry.visibility_preset === 'review'
                          ? 'After Review'
                          : 'After Class'}
                      </span>
                    </div>

                    {/* Check-in Mode */}
                    <div className="popup-row">
                      <Smartphone className="popup-icon" size={14} />
                      <span className="popup-label">Check-in:</span>
                      <span
                        className={`release-badge checkin-badge ${classEntry.self_checkin_enabled ? 'self-checkin' : 'table-checkin'}`}
                      >
                        {classEntry.self_checkin_enabled ? 'App (Self)' : 'At Table'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Section - Judge only (other details in popup) */}
            <div className="metadata-section">
              {/* Judge */}
              <div className="meta-row">
                <UserCheck size={14} />
                Judge: {classEntry.judge_name}
              </div>
            </div>

            {classEntry.planned_start_time && (
              <div className="class-planned-time">
                <Calendar size={14} style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                <span className="planned-time-label">Planned:</span>
                <span className="planned-time-value">{formatPlannedStartTime(classEntry.planned_start_time)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Status Badge + Preview (grouped together) */}
        <div className="class-status-preview-section">
          {/* Status Badge - Corner badge design like entry list */}
          <div className="class-card-status-action">
            {hasPermission('canManageClasses') ? (
              <button
                className={`status-badge class-status-badge ${statusColor}`}
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
                {getStatusIcon(classEntry.class_status)}
                <span className="status-text">
                  {formattedStatus.label}
                  {formattedStatus.time && (
                    <>
                      {' '}
                      <span className="status-time">{formattedStatus.time}</span>
                    </>
                  )}
                </span>
              </button>
            ) : (
              <div className={`status-badge class-status-badge ${statusColor}`}>
                {getStatusIcon(classEntry.class_status)}
                <span className="status-text">
                  {formattedStatus.label}
                  {formattedStatus.time && (
                    <>
                      {' '}
                      <span className="status-time">{formattedStatus.time}</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar - Visual separator showing class completion */}
          {classEntry.entry_count > 0 && (
            <div className="class-progress-bar">
              <div
                className="class-progress-fill"
                style={{
                  width: `${(classEntry.completed_count / classEntry.entry_count) * 100}%`
                }}
              />
            </div>
          )}

          {/* Contextual Preview - Display actual dog armband numbers */}
          {classEntry.dogs.length > 0 ? (
            <div className="contextual-preview-condensed">
              {/* Display actual armband numbers from dogs array (not parsed from string) */}
              {(() => {
                const inRingDog = classEntry.dogs.find(dog => dog.in_ring);
                const nextDogs = classEntry.dogs
                  .filter(dog =>
                    !dog.is_scored &&
                    !dog.in_ring &&
                    dog.checkin_status !== 3 // Exclude pulled dogs (checkin_status 3 = pulled)
                  )
                  .slice(0, 3);

                return (
                  <>
                    {/* In-ring dog with visual indicator */}
                    {inRingDog && (
                      <span key={inRingDog.id} className="armband-number in-ring">
                        <Circle size={8} fill="#f59e0b" stroke="#f59e0b" style={{ marginRight: '2px' }} />
                        #{inRingDog.armband}
                      </span>
                    )}
                    {/* Next dogs waiting */}
                    {nextDogs.map((dog) => (
                      <span key={dog.id} className="armband-number">
                        #{dog.armband}
                      </span>
                    ))}
                  </>
                );
              })()}
              {/* Show remaining count */}
              {classEntry.entry_count - classEntry.completed_count > 0 && (
                <span className="remaining-count">
                  {classEntry.entry_count - classEntry.completed_count} of {classEntry.entry_count} remaining
                </span>
              )}
              {classEntry.class_status === 'completed' && (
                <span className="remaining-count">
                  All complete
                </span>
              )}
            </div>
          ) : (
            <>
              {/* Empty progress bar track for visual consistency */}
              <div className="class-progress-bar" />
              <div className="no-entries">
                <Users className="no-entries-icon" />
                <span>No entries yet</span>
              </div>
            </>
          )}

          {/* Warning Banners - At bottom of card, compact single-line */}
          {classEntry.class_status === 'offline-scoring' && (
            <div className="offline-warning-banner">
              <WifiOff size={10} />
              <span>Offline - updates when reconnected</span>
            </div>
          )}
          {staleStatus.shouldShowWarning && (
            <div className="stale-warning-banner">
              <AlertTriangle size={10} />
              <span>May be outdated ({formatStaleTime(staleStatus.minutesSinceLastResult!)})</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
