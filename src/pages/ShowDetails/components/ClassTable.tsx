/**
 * ClassTable Component
 *
 * Displays classes in a tabbed view (Pending / Completed).
 * Responsive layout:
 * - Phone: Two-line card rows
 * - Tablet: Compact 4-column table
 * - Desktop: Full table with extra details
 *
 * Row tap navigates to EntryList for that class.
 *
 * Smart trial badge logic:
 * - Single trial → No badge
 * - Multiple trials, same day → "T1", "T2"
 * - Multiple days → "Sat", "Sun"
 * - Multiple trials across days → "Sat T1", "Sun T2"
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, User, ChevronRight } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { ClassSummary } from '../hooks/useDashboardData';
import './ClassTable.css';

// ============================================================
// TYPES
// ============================================================

type TabType = 'pending' | 'completed';
type BadgeMode = 'none' | 'trial-only' | 'day-only' | 'day-and-trial';

interface ClassTableProps {
  pendingClasses: ClassSummary[];
  completedClasses: ClassSummary[];
  trialId?: string;
}

interface ClassRowProps {
  classData: ClassSummary;
  badgeMode: BadgeMode;
  onClick: () => void;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get status badge info based on class_status
 */
function getStatusInfo(status: string): { label: string; className: string } {
  switch (status) {
    case 'in-progress':
      return { label: 'In Progress', className: 'status--in-progress' };
    case 'offline-scoring':
      return { label: 'Scoring', className: 'status--scoring' };
    case 'completed':
      return { label: 'Complete', className: 'status--completed' };
    case 'not-started':
      return { label: 'Not Started', className: 'status--not-started' };
    default:
      return { label: 'Pending', className: 'status--pending' };
  }
}

/**
 * Format time for display
 */
function formatTime(timeString?: string): string {
  if (!timeString) return '';
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return timeString;
  }
}

/**
 * Determine which badge mode to use based on the classes
 * - none: Single trial, no badge needed
 * - trial-only: Multiple trials on same day → "T1", "T2"
 * - day-only: Multiple days, one trial per day → "Sat", "Sun"
 * - day-and-trial: Multiple trials across multiple days → "Sat T1"
 */
function computeBadgeMode(classes: ClassSummary[]): BadgeMode {
  if (classes.length === 0) return 'none';

  const uniqueTrials = new Set(classes.map(c => c.trial_id));
  const uniqueDates = new Set(classes.map(c => c.trial_date));

  // Single trial → no badge
  if (uniqueTrials.size <= 1) return 'none';

  const hasMultipleDays = uniqueDates.size > 1;
  const hasMultipleTrialsPerDay = classes.some((c, _, arr) =>
    arr.some(other => other.trial_date === c.trial_date && other.trial_id !== c.trial_id)
  );

  if (hasMultipleDays && hasMultipleTrialsPerDay) return 'day-and-trial';
  if (hasMultipleDays) return 'day-only';
  return 'trial-only';
}

/**
 * Format day abbreviation from date string
 */
function formatDayAbbrev(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return '';
  }
}

/**
 * Get the trial badge text based on mode
 */
function getTrialBadge(classData: ClassSummary, mode: BadgeMode): string {
  switch (mode) {
    case 'none':
      return '';
    case 'trial-only':
      return `T${classData.trial_number}`;
    case 'day-only':
      return formatDayAbbrev(classData.trial_date);
    case 'day-and-trial':
      return `${formatDayAbbrev(classData.trial_date)} T${classData.trial_number}`;
    default:
      return '';
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Individual class row - renders differently at each breakpoint
 */
function ClassRow({ classData, badgeMode, onClick }: ClassRowProps) {
  const statusInfo = getStatusInfo(classData.class_status);
  const startTime = formatTime(classData.planned_start_time);
  const progressText = `${classData.completed_count}/${classData.entry_count}`;
  const trialBadge = getTrialBadge(classData, badgeMode);

  return (
    <button
      className="class-row"
      onClick={onClick}
      aria-label={`${trialBadge ? trialBadge + ' ' : ''}${classData.class_name}, ${classData.entry_count} entries, ${statusInfo.label}`}
    >
      {/* Mobile: Two-line layout with optional trial badge above */}
      <div className="class-row__mobile">
        <div className="class-row__line1">
          {trialBadge && (
            <span className="class-row__trial-badge">{trialBadge}</span>
          )}
          <span className="class-row__name">{classData.class_name}</span>
          <span className={`class-row__status ${statusInfo.className}`}>
            {classData.class_status === 'in-progress' && <Clock size={12} />}
            {classData.class_status === 'completed' && <CheckCircle2 size={12} />}
          </span>
          <span className="class-row__scored">{progressText}</span>
        </div>
        <div className="class-row__line2">
          <span className="class-row__judge">
            <User size={12} />
            {classData.judge_name || 'TBD'}
          </span>
          {startTime && (
            <span className="class-row__time">Starts {startTime}</span>
          )}
        </div>
      </div>

      {/* Tablet: 4-column table with inline badge */}
      <div className="class-row__tablet">
        <div className="class-row__cell class-row__cell--name">
          {trialBadge && (
            <span className="class-row__trial-badge class-row__trial-badge--inline">{trialBadge}</span>
          )}
          <span className="class-row__name">{classData.class_name}</span>
          <span className={`class-row__status-dot ${statusInfo.className}`} />
        </div>
        <div className="class-row__cell class-row__cell--judge">
          {classData.judge_name || 'TBD'}
        </div>
        <div className="class-row__cell class-row__cell--scored">
          {progressText}
        </div>
        <div className="class-row__cell class-row__cell--time">
          {startTime || '-'}
        </div>
      </div>

      {/* Desktop: Extended columns with dedicated Trial column */}
      <div className="class-row__desktop">
        {trialBadge && (
          <div className="class-row__cell class-row__cell--trial">
            <span className="class-row__trial-badge class-row__trial-badge--desktop">{trialBadge}</span>
          </div>
        )}
        <div className={`class-row__cell class-row__cell--name ${!trialBadge ? 'class-row__cell--name-full' : ''}`}>
          {classData.class_name}
        </div>
        <div className="class-row__cell class-row__cell--judge">
          {classData.judge_name || 'TBD'}
        </div>
        <div className="class-row__cell class-row__cell--scored">
          {progressText}
        </div>
        <div className="class-row__cell class-row__cell--time">
          {startTime || '-'}
        </div>
        <div className="class-row__cell class-row__cell--status">
          <span className={`class-row__status-badge ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="class-row__cell class-row__cell--chevron">
          <ChevronRight size={16} />
        </div>
      </div>
    </button>
  );
}

/**
 * Empty state for when no classes exist
 */
function EmptyState({ type }: { type: TabType }) {
  return (
    <div className="class-table__empty">
      {type === 'pending' ? (
        <>
          <Clock size={32} />
          <p>No pending classes</p>
        </>
      ) : (
        <>
          <CheckCircle2 size={32} />
          <p>No completed classes yet</p>
        </>
      )}
    </div>
  );
}

/**
 * Table header for tablet/desktop views
 */
function TableHeader({ showTrialColumn }: { showTrialColumn: boolean }) {
  return (
    <div className="class-table__header" role="row">
      {showTrialColumn && (
        <div className="class-table__header-cell class-table__header-cell--trial">Trial</div>
      )}
      <div className={`class-table__header-cell class-table__header-cell--name ${!showTrialColumn ? 'class-table__header-cell--name-full' : ''}`}>Class</div>
      <div className="class-table__header-cell class-table__header-cell--judge">Judge</div>
      <div className="class-table__header-cell class-table__header-cell--scored">Scored</div>
      <div className="class-table__header-cell class-table__header-cell--time">Start</div>
      <div className="class-table__header-cell class-table__header-cell--status">Status</div>
      <div className="class-table__header-cell class-table__header-cell--chevron" />
    </div>
  );
}

/**
 * Main ClassTable component
 */
export function ClassTable({ pendingClasses, completedClasses, trialId: _trialId }: ClassTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const navigate = useNavigate();
  const hapticFeedback = useHapticFeedback();

  // Compute badge mode based on ALL classes (both pending and completed)
  const badgeMode = useMemo(() => {
    const allClasses = [...pendingClasses, ...completedClasses];
    return computeBadgeMode(allClasses);
  }, [pendingClasses, completedClasses]);

  const showTrialColumn = badgeMode !== 'none';

  const handleTabChange = (tab: TabType) => {
    hapticFeedback.light();
    setActiveTab(tab);
  };

  const handleClassClick = (classData: ClassSummary) => {
    hapticFeedback.light();
    // Navigate to EntryList for this class
    navigate(`/class/${classData.id}/entries`);
  };

  const currentClasses = activeTab === 'pending' ? pendingClasses : completedClasses;
  const pendingCount = pendingClasses.length;
  const completedCount = completedClasses.length;

  return (
    <div className="class-table-container">
      {/* Tabs */}
      <div className="class-table__tabs" role="tablist">
        <button
          className={`class-table__tab ${activeTab === 'pending' ? 'class-table__tab--active' : ''}`}
          onClick={() => handleTabChange('pending')}
          role="tab"
          aria-selected={activeTab === 'pending'}
          aria-controls="pending-panel"
        >
          <Clock size={16} />
          Pending
          <span className="class-table__tab-count">{pendingCount}</span>
        </button>
        <button
          className={`class-table__tab ${activeTab === 'completed' ? 'class-table__tab--active' : ''}`}
          onClick={() => handleTabChange('completed')}
          role="tab"
          aria-selected={activeTab === 'completed'}
          aria-controls="completed-panel"
        >
          <CheckCircle2 size={16} />
          Completed
          <span className="class-table__tab-count">{completedCount}</span>
        </button>
      </div>

      {/* Table content */}
      <div
        className="class-table"
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-label={`${activeTab} classes`}
      >
        {currentClasses.length > 0 ? (
          <>
            <TableHeader showTrialColumn={showTrialColumn} />
            <div className="class-table__body" role="list">
              {currentClasses.map(classData => (
                <ClassRow
                  key={classData.id}
                  classData={classData}
                  badgeMode={badgeMode}
                  onClick={() => handleClassClick(classData)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState type={activeTab} />
        )}
      </div>
    </div>
  );
}

export default ClassTable;
