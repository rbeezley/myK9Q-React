import React, { useMemo } from 'react';
import { Heart, MoreHorizontal, Clock, Users, UserCheck, Circle, Wrench, MessageSquare, Coffee, CalendarClock, PlayCircle, CheckCircle } from 'lucide-react';
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
  class_status: 'no-status' | 'setup' | 'briefing' | 'break' | 'start_time' | 'in_progress' | 'completed';
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
  getContextualPreview: (classEntry: ClassEntry) => string;
  onMenuClick?: (classId: number, position: { top: number; left: number }) => void;
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
  getContextualPreview,
  onMenuClick,
  onPrefetch,
}) => {
  const _hasPendingEntries = classEntry.entry_count > classEntry.completed_count;
  const _isInProgress = classEntry.class_status === 'in_progress';

  // Memoize computed values to prevent redundant function calls
  const statusColor = useMemo(
    () => getStatusColor(classEntry.class_status, classEntry),
    [classEntry, getStatusColor]
  );

  const formattedStatus = useMemo(
    () => getFormattedStatus(classEntry),
    [classEntry, getFormattedStatus]
  );

  const contextualPreview = useMemo(
    () => getContextualPreview(classEntry),
    [classEntry, getContextualPreview]
  );

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
        console.log('🔵 Class card clicked', e.target, e.currentTarget);
        handleViewEntries(classEntry);
      }}
    >
      <div className="class-content">
        <div className="class-header">
          {/* Action buttons - positioned absolutely in top-right */}
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
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  // Position dialog below button, centered on screen
                  // But use button's Y position so it follows scroll
                  onMenuClick?.(classEntry.id, {
                    top: Math.max(16, rect.bottom + 16), // Below button with padding, min 16px from top
                    left: 50 // Centered horizontally
                  });
                  setActivePopup(classEntry.id);
                }
              }}
            >
              <MoreHorizontal className="menu-icon" />
            </button>
          </div>

          {/* Class name and judge grouped together */}
          <div className="class-title-section">
            <h3 className="class-name">{classEntry.class_name}</h3>
            <p className="class-judge">
              <UserCheck />
              Judge: {classEntry.judge_name}
            </p>
            <div className="class-time-limits">
              <Clock size={14}  style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span className="time-limit-label">Max Time:</span>
              {(classEntry.time_limit_seconds || classEntry.time_limit_area2_seconds || classEntry.time_limit_area3_seconds) ? (
                classEntry.area_count && classEntry.area_count > 1 ? (
                  <>
                    {classEntry.time_limit_seconds && (
                      <span className="time-limit-badge">A1: {formatSecondsToMMSS(classEntry.time_limit_seconds)}</span>
                    )}
                    {classEntry.time_limit_area2_seconds && (
                      <span className="time-limit-badge">A2: {formatSecondsToMMSS(classEntry.time_limit_area2_seconds)}</span>
                    )}
                    {classEntry.time_limit_area3_seconds && (
                      <span className="time-limit-badge">A3: {formatSecondsToMMSS(classEntry.time_limit_area3_seconds)}</span>
                    )}
                  </>
                ) : (
                  classEntry.time_limit_seconds && (
                    <span className="time-limit-badge">{formatSecondsToMMSS(classEntry.time_limit_seconds)}</span>
                  )
                )
              ) : (
                <span className="time-limit-badge time-limit-tbd">TBD</span>
              )}
            </div>
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

          {/* Preview Text */}
          {classEntry.dogs.length > 0 ? (
            <div className="contextual-preview-condensed">
              {contextualPreview.replace(/\n/g, ' • ')}
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
};
