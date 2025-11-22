import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Circle, Check, AlertTriangle, XCircle, Star, Bell, Target } from 'lucide-react';
import { DogCard } from '../../components/DogCard';
import { Entry } from '../../stores/entryStore';
import { formatTimeForDisplay } from '../../utils/timeUtils';
import { UserPermissions } from '../../utils/auth';

interface SortableEntryCardProps {
  entry: Entry;
  isDragMode: boolean;
  showContext?: {
    competition_type?: string;
  } | null;
  classInfo?: {
    selfCheckin?: boolean;
  } | null;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  handleEntryClick: (entry: Entry) => void;
  handleStatusClick: (e: React.MouseEvent, entryId: number) => void;
  handleResetMenuClick: (e: React.MouseEvent, entryId: number) => void;
  setSelfCheckinDisabledDialog: (value: boolean) => void;
  onPrefetch?: (entry: Entry) => void;
}

export const SortableEntryCard: React.FC<SortableEntryCardProps> = ({
  entry,
  isDragMode,
  showContext,
  classInfo,
  hasPermission,
  handleEntryClick,
  handleStatusClick,
  handleResetMenuClick,
  setSelfCheckinDisabledDialog,
  onPrefetch,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    disabled: entry.inRing || entry.status === 'in-ring' // Disable dragging for in-ring dogs
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isInRing = entry.inRing || entry.status === 'in-ring';

  return (
    <div ref={setNodeRef} style={style} className={isDragMode ? 'sortable-item' : ''}>
      {isDragMode && !isInRing && (
        <div {...attributes} {...listeners} className="drag-handle-external">
          <GripVertical size={24} />
        </div>
      )}
      <DogCard
        key={entry.id}
        armband={entry.armband}
        callName={entry.callName}
        breed={entry.breed}
        handler={entry.handler}
        onClick={() => {
          if (isDragMode) return; // Disable navigation in drag mode
          if (hasPermission('canScore')) handleEntryClick(entry); // Entry click handler
        }}
        onPrefetch={() => onPrefetch?.(entry)}
        className={`${
          hasPermission('canScore') && !entry.isScored ? 'clickable' : ''
        } ${entry.status === 'in-ring' ? 'in-ring' : ''}`}
        statusBorder={
          entry.isScored ? (
            // For scored entries, use result status color
            (() => {
              const result = (entry.resultText || '').toLowerCase();
              if (result === 'q' || result === 'qualified') return 'result-qualified';
              if (result === 'nq' || result === 'non-qualifying') return 'result-nq';
              if (result === 'ex' || result === 'excused') return 'result-ex';
              if (result === 'abs' || result === 'absent') return 'result-abs';
              if (result === 'wd' || result === 'withdrawn') return 'result-wd';
              return 'scored'; // Fallback to generic scored
            })()
          ) :
          entry.status === 'in-ring' ? 'in-ring' : // In-ring gets blue border
          (entry.status === 'checked-in' ? 'checked-in' :
           entry.status === 'conflict' ? 'conflict' :
           entry.status === 'pulled' ? 'pulled' :
           entry.status === 'at-gate' ? 'at-gate' :
           entry.status === 'come-to-gate' ? 'come-to-gate' :
           entry.status === 'completed' ? 'completed' : 'no-status')
        }
        resultBadges={
          entry.isScored ? (
            // Check if this is a nationals show using show type from context
            showContext?.competition_type?.toLowerCase().includes('national') ? (
              <div className="nationals-scoresheet-improved">
                {/* Header Row: Placement, Time, and Result badges */}
                <div className="nationals-header-row">
                  {entry.placement && (
                    <span className={`placement-badge place-${Math.min(entry.placement, 5)}`}>
                      {entry.placement <= 4 && (
                        <span className="placement-badge-icon">
                          {entry.placement === 1 ? '🥇' : entry.placement === 2 ? '🥈' : entry.placement === 3 ? '🥉' : '🎖️'}
                        </span>
                      )}
                      <span>{entry.placement === 1 ? '1st' : entry.placement === 2 ? '2nd' : entry.placement === 3 ? '3rd' : `${entry.placement}th`}</span>
                    </span>
                  )}
                  <span className="time-badge">{formatTimeForDisplay(entry.searchTime || null)}</span>
                  <span className={`result-badge ${(entry.resultText || '').toLowerCase()}`}>
                    {(() => {
                      const result = (entry.resultText || '').toLowerCase();
                      if (result === 'q' || result === 'qualified') return 'Q';
                      if (result === 'nq' || result === 'non-qualifying') return 'NQ';
                      if (result === 'abs' || result === 'absent' || result === 'e') return 'ABS';
                      if (result === 'ex' || result === 'excused') return 'EX';
                      if (result === 'wd' || result === 'withdrawn') return 'WD';
                      return entry.resultText || 'N/A';
                    })()}
                  </span>
                </div>

                {/* Stats Grid: 2x2 for Calls and Faults */}
                <div className="nationals-stats-grid">
                  <div className="nationals-stat-item">
                    <span className="nationals-stat-label">Correct</span>
                    <span className="nationals-stat-value">{entry.correctFinds || 0}</span>
                  </div>
                  <div className="nationals-stat-item">
                    <span className="nationals-stat-label">Incorrect</span>
                    <span className="nationals-stat-value">{entry.incorrectFinds || 0}</span>
                  </div>
                  <div className="nationals-stat-item">
                    <span className="nationals-stat-label">Faults</span>
                    <span className="nationals-stat-value">{entry.faultCount || 0}</span>
                  </div>
                  <div className="nationals-stat-item">
                    <span className="nationals-stat-label">No Finish</span>
                    <span className="nationals-stat-value">{entry.noFinishCount || 0}</span>
                  </div>
                </div>

                {/* Total Points Row */}
                <div className="nationals-total-points-improved">
                  <span className="nationals-total-label">Total Points</span>
                  <span className={`nationals-total-value ${(entry.totalPoints || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {(entry.totalPoints || 0) >= 0 ? '+' : ''}{entry.totalPoints || 0}
                  </span>
                </div>
              </div>
            ) : (
              // Regular (non-nationals) scoring display
              entry.searchTime ? (
                <div className="regular-scoresheet-single-line">
                  {/* Single line: Placement, Result, Time, Faults */}
                  {(() => {
                    const resultLower = (entry.resultText || '').toLowerCase();
                    const isNonQualifying = resultLower.includes('nq') || resultLower.includes('non-qualifying') ||
                                           resultLower.includes('abs') || resultLower.includes('absent') ||
                                           resultLower.includes('ex') || resultLower.includes('excused') ||
                                           resultLower.includes('wd') || resultLower.includes('withdrawn');

                    // Show placement badge for all qualified placements
                    if (entry.placement && !isNonQualifying) {
                      return (
                        <span className={`placement-badge place-${Math.min(entry.placement, 5)}`}>
                          {entry.placement <= 4 && (
                            <span className="placement-badge-icon">
                              {entry.placement === 1 ? '🥇' : entry.placement === 2 ? '🥈' : entry.placement === 3 ? '🥉' : '🎖️'}
                            </span>
                          )}
                          <span>{entry.placement === 1 ? '1st' : entry.placement === 2 ? '2nd' : entry.placement === 3 ? '3rd' : `${entry.placement}th`}</span>
                        </span>
                      );
                    }
                    return null;
                  })()}

                  {entry.resultText && (
                    <span className={`result-badge ${entry.resultText.toLowerCase()}`}>
                      {(() => {
                        const result = entry.resultText.toLowerCase();
                        if (result === 'q' || result === 'qualified') return 'Q';
                        if (result === 'nq' || result === 'non-qualifying') return 'NQ';
                        if (result === 'abs' || result === 'absent' || result === 'e') return 'ABS';
                        if (result === 'ex' || result === 'excused') return 'EX';
                        if (result === 'wd' || result === 'withdrawn') return 'WD';
                        return entry.resultText;
                      })()}
                    </span>
                  )}

                  <span className="time-badge">{formatTimeForDisplay(entry.searchTime || null)}</span>

                  <span className="faults-badge-subtle">{entry.faultCount || 0}&nbsp;{entry.faultCount === 1 ? 'Fault' : 'Faults'}</span>
                </div>
              ) : undefined
            )
          ) : undefined
        }
        actionButton={
          !entry.isScored ? (
            <div
              className={`status-badge checkin-status ${
                entry.inRing ? 'in-ring' :
                (entry.status || 'none').toLowerCase().replace(' ', '-')
              } ${
                (!hasPermission('canCheckInDogs') && !(classInfo?.selfCheckin ?? true)) ? 'disabled' : ''
              }`}
              style={{ textTransform: 'none' }}
              data-no-uppercase="true"
              onClick={(e) => {
                const canCheckIn = hasPermission('canCheckInDogs');
                const isSelfCheckinEnabled = classInfo?.selfCheckin ?? true;

                if (canCheckIn || isSelfCheckinEnabled) {
                  handleStatusClick(e, entry.id);
                } else {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelfCheckinDisabledDialog(true);
                }
              }}
              title={
                (!hasPermission('canCheckInDogs') && !(classInfo?.selfCheckin ?? true))
                  ? "Self check-in disabled"
                  : "Tap to change status"
              }
            >
              {(() => {
                const status = entry.status || 'no-status';
                switch(status) {
                  case 'in-ring': return <><Target size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">In Ring</span></>;
                  case 'completed': return <><Check size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">Completed</span></>;
                  case 'no-status': return <><Circle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">No Status</span></>;
                  case 'checked-in': return <><Check size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">Checked-in</span></>;
                  case 'conflict': return <><AlertTriangle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">Conflict</span></>;
                  case 'pulled': return <><XCircle size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">Pulled</span></>;
                  case 'at-gate': return <><Star size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">At Gate</span></>;
                  case 'come-to-gate': return <><Bell size={18} className="status-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} /><span className="status-text">Come to Gate</span></>;
                  default: return <span className="status-text">{status}</span>;
                }
              })()}
            </div>
          ) : (
            <button
              className="reset-button reset-menu-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                handleResetMenuClick(e, entry.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              aria-label="More options"
              title="Reset score"
            >
              ⋯
            </button>
          )
        }
      />
    </div>
  );
};
