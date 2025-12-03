/**
 * DogDetails Class Card Component
 *
 * Extracted from DogDetails.tsx to reduce complexity.
 * Displays a single class entry with status, results, and visibility controls.
 */

import React from 'react';
import {
  Clock,
  AlertTriangle,
  ThumbsUp,
  XCircle,
  Check,
  Circle,
  Star,
  User,
  Target
} from 'lucide-react';
import { TrialDateBadge } from '../../../components/ui';
import { PlacementBadge } from '../../EntryList/SortableEntryCardComponents';
import { getAvailabilityMessage } from '../../../services/resultVisibilityService';
import { formatTimeForDisplay } from '../../../utils/timeUtils';
import { getEntryStatusColor, getEntryStatusLabel } from '../../../utils/statusUtils';
import { isNonQualifyingResult } from '../../EntryList/sortableEntryCardUtils';
import type { ClassEntry } from '../hooks/useDogDetailsData';

interface DogDetailsClassCardProps {
  entry: ClassEntry;
  onCardClick: (entry: ClassEntry) => void;
  onStatusClick: (e: React.MouseEvent<HTMLButtonElement>, classId: number) => void;
}

/**
 * Format time for display, handling non-qualifying results
 */
function formatTime(time: string | null, resultText?: string | null): string {
  if (isNonQualifyingResult(resultText)) {
    return '00:00.00';
  }
  return formatTimeForDisplay(time);
}

/**
 * Render status icon based on check-in status
 */
function renderCheckInStatusIcon(status: string | undefined) {
  const iconStyle = { width: '18px', height: '18px', flexShrink: 0 };

  switch (status) {
    case 'checked-in':
      return <Check size={18} className="status-icon" style={iconStyle} />;
    case 'conflict':
      return <AlertTriangle size={18} className="status-icon" style={iconStyle} />;
    case 'pulled':
      return <XCircle size={18} className="status-icon" style={iconStyle} />;
    case 'at-gate':
      return <Star size={18} className="status-icon" style={iconStyle} />;
    default:
      return <Circle size={18} className="status-icon" style={iconStyle} />;
  }
}

export const DogDetailsClassCard: React.FC<DogDetailsClassCardProps> = ({
  entry,
  onCardClick,
  onStatusClick
}) => {
  const statusColor = getEntryStatusColor(entry);
  const isScored = entry.is_scored;
  const isQualified = statusColor === 'qualified';
  const isNQ = statusColor === 'not-qualified';
  const iconStyle = { width: '18px', height: '18px', flexShrink: 0 };

  return (
    <div
      className={`class-card ${statusColor} clickable`}
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={() => onCardClick(entry)}
    >
      {/* Corner Badge - Match EntryList design */}
      <div className="class-card-action">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isScored) {
              onStatusClick(e, entry.id);
            }
          }}
          disabled={isScored}
          className={`status-badge ${statusColor}`}
        >
          {isScored ? (
            <>
              {entry.visibleFields?.showQualification ? (
                <>
                  {isQualified ? (
                    <>
                      <ThumbsUp size={18} className="status-icon" style={iconStyle} />
                      <span className="status-text">Qualified</span>
                    </>
                  ) : isNQ ? (
                    <>
                      <XCircle size={18} className="status-icon" style={iconStyle} />
                      <span className="status-text">Not Qualified</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} className="status-icon" style={iconStyle} />
                      <span className="status-text">{getEntryStatusLabel(entry)}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Circle size={18} className="status-icon" style={iconStyle} />
                  <span className="status-text">Results Pending</span>
                </>
              )}
            </>
          ) : (
            <>
              {renderCheckInStatusIcon(entry.check_in_status)}
              <span className="status-text">{getEntryStatusLabel(entry)}</span>
            </>
          )}
        </button>
      </div>

      <div className="class-content">
        {/* Top row: Class Name */}
        <h4 className="class-name" style={{
          margin: 0,
          fontSize: '1.125rem',
          fontWeight: 600,
          lineHeight: 1.2
        }}>
          {[
            entry.element,
            entry.level,
            entry.section && entry.section !== '-' ? entry.section : null
          ].filter(Boolean).join(' \u2022 ')}
        </h4>

        {/* Second row: Judge */}
        {entry.judge_name && (
          <p style={{
            margin: 0,
            marginBottom: 'var(--token-space-md)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--muted-foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            <User size={14} style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            Judge: {entry.judge_name}
          </p>
        )}

        {/* Additional metadata row */}
        <div className="class-meta-details">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <TrialDateBadge date={entry.trial_date} />
          </span>
          {entry.trial_number && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Target size={14} style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              Trial {entry.trial_number}
            </span>
          )}
        </div>

        {/* Performance Stats - respect visibility settings */}
        {entry.is_scored && (
          <div className="class-stats">
            {/* Placement Badge */}
            {entry.visibleFields?.showPlacement &&
             entry.position !== null &&
             entry.position !== undefined &&
             entry.position !== 9996 &&
             entry.position > 0 &&
             isQualified && (
              <PlacementBadge placement={entry.position} />
            )}

            {/* Time */}
            {entry.visibleFields?.showTime ? (
              <span className="time-badge">
                <Clock size={14} className="badge-icon" />
                {formatTime(entry.search_time, entry.result_text)}
              </span>
            ) : (
              <span className="time-badge dimmed">
                <Clock size={14} className="badge-icon" />
                \u23F3 {getAvailabilityMessage(entry.is_completed || false, entry.timeTiming || 'class_complete')}
              </span>
            )}

            {/* Faults */}
            {entry.visibleFields?.showFaults ? (
              <span className="faults-badge-subtle">
                <AlertTriangle size={14} className="badge-icon" />
                {entry.fault_count || 0} {entry.fault_count === 1 ? 'Fault' : 'Faults'}
              </span>
            ) : (
              <span className="faults-badge-subtle dimmed">
                <AlertTriangle size={14} className="badge-icon" />
                \u23F3 {getAvailabilityMessage(entry.is_completed || false, entry.faultsTiming || 'class_complete')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DogDetailsClassCard;
