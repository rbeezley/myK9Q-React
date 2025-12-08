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

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, User, MoreVertical, Pencil, Check, X } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { usePermission } from '@/hooks/usePermission';
import { replicatedClassesTable } from '@/services/replication';
import { ClassOptionsDialog } from '@/components/dialogs/ClassOptionsDialog';
import { ClassRequirementsDialog } from '@/components/dialogs/ClassRequirementsDialog';
import { MaxTimeDialog } from '@/components/dialogs/MaxTimeDialog';
import { ClassSettingsDialog } from '@/components/dialogs/ClassSettingsDialog';
import { NoStatsDialog } from '@/components/dialogs/NoStatsDialog';
import { ClassStatusDialog } from '@/components/dialogs/ClassStatusDialog';
import { usePrintReports, type ReportDependencies } from '@/pages/ClassList/hooks/usePrintReports';
import type { ClassEntry, TrialInfo } from '@/pages/ClassList/hooks/useClassListData';
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
  licenseKey?: string;
  organization?: string;
  onClassUpdate?: () => void | Promise<void>;
}

interface ClassRowProps {
  classData: ClassSummary;
  badgeMode: BadgeMode;
  canEdit: boolean;
  onClick: () => void;
  onOptionsClick: (e: React.MouseEvent) => void;
  onTimeChange: (classId: number, time: string) => Promise<void>;
  onStatusClick: (classData: ClassSummary) => void;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Normalize status string to use dashes (CSS convention)
 * Database uses underscores (in_progress), CSS uses dashes (in-progress)
 */
function normalizeStatus(status: string): string {
  return status.replace(/_/g, '-');
}

/**
 * Get status badge info based on class_status
 * Accepts both database format (in_progress) and CSS format (in-progress)
 */
function getStatusInfo(status: string): { label: string; className: string } {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'in-progress':
      return { label: 'In Progress', className: 'status--in-progress' };
    case 'offline-scoring':
      return { label: 'Scoring', className: 'status--scoring' };
    case 'completed':
      return { label: 'Complete', className: 'status--completed' };
    case 'not-started':
      return { label: 'Not Started', className: 'status--not-started' };
    case 'setup':
      return { label: 'Setup', className: 'status--setup' };
    case 'briefing':
      return { label: 'Briefing', className: 'status--briefing' };
    case 'break':
      return { label: 'Break', className: 'status--break' };
    case 'start-time':
      return { label: 'Starts', className: 'status--start-time' };
    case 'no-status':
    default:
      return { label: 'No Status', className: 'status--no-status' };
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
 * Extract time portion (HH:MM) from ISO timestamp
 */
function extractTimeFromISO(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Inline Time Editor Component
 */
function InlineTimeEditor({
  classId,
  currentTime,
  onSave
}: {
  classId: number;
  currentTime?: string;
  onSave: (classId: number, time: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [time, setTime] = useState(extractTimeFromISO(currentTime));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hapticFeedback = useHapticFeedback();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.light();
    setTime(extractTimeFromISO(currentTime));
    setIsEditing(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      await onSave(classId, time);
      hapticFeedback.success();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save time:', error);
      hapticFeedback.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setTime(extractTimeFromISO(currentTime));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(e as unknown as React.MouseEvent);
    } else if (e.key === 'Escape') {
      handleCancel(e as unknown as React.MouseEvent);
    }
  };

  const displayTime = formatTime(currentTime);

  if (isEditing) {
    return (
      <div className="inline-editor inline-editor--time" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          onKeyDown={handleKeyDown}
          className="inline-editor__input"
          disabled={isSaving}
        />
        <button
          className="inline-editor__btn inline-editor__btn--save"
          onClick={handleSave}
          disabled={isSaving}
          aria-label="Save"
        >
          <Check size={14} />
        </button>
        <button
          className="inline-editor__btn inline-editor__btn--cancel"
          onClick={handleCancel}
          disabled={isSaving}
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      className="inline-editable"
      onClick={handleEditClick}
      title="Click to edit start time"
    >
      <span>{displayTime || '-'}</span>
      <Pencil size={12} className="inline-editable__icon" />
    </button>
  );
}

/**
 * Status Button - opens the ClassStatusDialog when clicked
 */
function StatusButton({
  classData,
  onClick
}: {
  classData: ClassSummary;
  onClick: (classData: ClassSummary) => void;
}) {
  const hapticFeedback = useHapticFeedback();
  const statusInfo = getStatusInfo(classData.class_status);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.light();
    onClick(classData);
  };

  return (
    <button
      className={`class-row__status-badge ${statusInfo.className} inline-editable`}
      onClick={handleClick}
      title="Click to change status"
    >
      {statusInfo.label}
      <Pencil size={10} className="inline-editable__icon" />
    </button>
  );
}

/**
 * Individual class row - renders differently at each breakpoint
 */
function ClassRow({ classData, badgeMode, canEdit, onClick, onOptionsClick, onTimeChange, onStatusClick }: ClassRowProps) {
  const statusInfo = getStatusInfo(classData.class_status);
  const startTime = formatTime(classData.planned_start_time);
  const progressText = `${classData.completed_count}/${classData.entry_count}`;
  const trialBadge = getTrialBadge(classData, badgeMode);

  // Handle keyboard navigation for the row (since we use div instead of button for nesting)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div className="class-row-wrapper">
      <div
        className="class-row"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
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
            {canEdit ? (
              <InlineTimeEditor
                classId={classData.id}
                currentTime={classData.planned_start_time}
                onSave={onTimeChange}
              />
            ) : (
              startTime && <span className="class-row__time">Starts {startTime}</span>
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
            {canEdit ? (
              <StatusButton
                classData={classData}
                onClick={onStatusClick}
              />
            ) : (
              <span className={`class-row__status-dot ${statusInfo.className}`} />
            )}
          </div>
          <div className="class-row__cell class-row__cell--judge">
            {classData.judge_name || 'TBD'}
          </div>
          <div className="class-row__cell class-row__cell--scored">
            {progressText}
          </div>
          <div className="class-row__cell class-row__cell--time">
            {canEdit ? (
              <InlineTimeEditor
                classId={classData.id}
                currentTime={classData.planned_start_time}
                onSave={onTimeChange}
              />
            ) : (
              startTime || '-'
            )}
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
            {canEdit ? (
              <InlineTimeEditor
                classId={classData.id}
                currentTime={classData.planned_start_time}
                onSave={onTimeChange}
              />
            ) : (
              startTime || '-'
            )}
          </div>
          <div className="class-row__cell class-row__cell--status">
            {canEdit ? (
              <StatusButton
                classData={classData}
                onClick={onStatusClick}
              />
            ) : (
              <span className={`class-row__status-badge ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Options button - separate from row click */}
      <button
        className="class-row__options-btn"
        onClick={onOptionsClick}
        aria-label={`Options for ${classData.class_name}`}
        title="Class options"
      >
        <MoreVertical size={18} />
      </button>
    </div>
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
      <div className="class-table__header-cell class-table__header-cell--options" />
    </div>
  );
}

/**
 * Main ClassTable component
 */
/**
 * Convert ClassSummary to ClassEntry format for report generation
 */
function classToEntry(cls: ClassSummary): ClassEntry {
  return {
    id: cls.id,
    element: cls.element,
    level: cls.level,
    section: cls.section,
    class_name: cls.class_name,
    class_order: 0, // Not used in report generation
    judge_name: cls.judge_name,
    entry_count: cls.entry_count,
    completed_count: cls.completed_count,
    class_status: cls.class_status as ClassEntry['class_status'],
    is_favorite: false, // Not relevant for reports
    time_limit_seconds: cls.time_limit_seconds,
    time_limit_area2_seconds: cls.time_limit_area2_seconds,
    time_limit_area3_seconds: cls.time_limit_area3_seconds,
    area_count: cls.area_count,
    planned_start_time: cls.planned_start_time,
    dogs: [], // Not used in report generation - entries fetched separately
  };
}

/**
 * Build TrialInfo from ClassSummary data
 */
function buildTrialInfo(cls: ClassSummary, allClasses: ClassSummary[]): TrialInfo {
  const trialClasses = allClasses.filter(c => c.trial_id === cls.trial_id);
  return {
    trial_name: `Trial ${cls.trial_number}`,
    trial_date: cls.trial_date,
    trial_number: cls.trial_number,
    total_classes: trialClasses.length,
    pending_classes: trialClasses.filter(c => c.class_status !== 'completed').length,
    completed_classes: trialClasses.filter(c => c.class_status === 'completed').length,
  };
}

export function ClassTable({ pendingClasses, completedClasses, trialId: _trialId, licenseKey, organization, onClassUpdate }: ClassTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedClass, setSelectedClass] = useState<ClassSummary | null>(null);
  const [classOptionsOpen, setClassOptionsOpen] = useState(false);
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [maxTimeOpen, setMaxTimeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noStatsOpen, setNoStatsOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogClass, setStatusDialogClass] = useState<ClassSummary | null>(null);
  const navigate = useNavigate();
  const hapticFeedback = useHapticFeedback();
  const { hasPermission } = usePermission();

  // Check if user can edit (admin or judge)
  const canEdit = hasPermission('canManageClasses');

  // Print reports hook
  const { handleGenerateCheckIn, handleGenerateResults, handleGenerateScoresheet } = usePrintReports();

  // Inline edit handlers (offline-first)
  const handleTimeChange = useCallback(async (classId: number, time: string) => {
    // Convert time (HH:MM) to ISO timestamp using the class's trial date
    const classData = [...pendingClasses, ...completedClasses].find(c => c.id === classId);
    let plannedTimestamp: string | null = null;

    if (time && classData?.trial_date) {
      // Parse trial_date (format: "YYYY-MM-DD") and set time in local timezone
      // This avoids timezone issues from new Date("YYYY-MM-DD") which creates UTC date
      const [hours, minutes] = time.split(':');
      const [year, month, day] = classData.trial_date.split('-').map(Number);
      const date = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0);
      plannedTimestamp = date.toISOString();
    } else if (time) {
      // Fallback to today's date if no trial date
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      plannedTimestamp = date.toISOString();
    }

    try {
      // Update local cache first (offline-first) - syncs to Supabase in background
      // Use updateClassStatus with current status and time as additional field
      await replicatedClassesTable.updateClassStatus(
        String(classId),
        classData?.class_status || 'no-status',
        { planned_start_time: plannedTimestamp || undefined }
      );

      // Trigger UI refresh from cache
      onClassUpdate?.();
    } catch (error) {
      console.error('❌ Error updating planned start time:', error);
      throw error;
    }
  }, [pendingClasses, completedClasses, onClassUpdate]);

  // Handler for opening status dialog
  const handleStatusClick = useCallback((classData: ClassSummary) => {
    setStatusDialogClass(classData);
    setStatusDialogOpen(true);
  }, []);

  // Handler for status change from dialog (offline-first)
  const handleStatusDialogChange = useCallback(async (status: string, timeValue?: string) => {
    if (!statusDialogClass) return;

    const classId = String(statusDialogClass.id);

    // Build additional fields for time values
    const additionalFields: Record<string, string> = {};
    if (timeValue) {
      switch (status) {
        case 'briefing':
          additionalFields.briefing_time = timeValue;
          break;
        case 'break':
          additionalFields.break_until = timeValue;
          break;
        case 'start_time':
          additionalFields.start_time = timeValue;
          break;
      }
    }

    try {
      // Update local cache first (offline-first) - syncs to Supabase in background
      await replicatedClassesTable.updateClassStatus(classId, status, additionalFields);

      // Close dialog and refresh UI from cache
      setStatusDialogOpen(false);
      setStatusDialogClass(null);
      await onClassUpdate?.();
    } catch (error) {
      console.error('Error updating class status:', error);
      throw error;
    }
  }, [statusDialogClass, onClassUpdate]);

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

  const handleOptionsClick = (classData: ClassSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback.light();
    setSelectedClass(classData);
    setClassOptionsOpen(true);
  };

  const handleCloseOptions = () => {
    setClassOptionsOpen(false);
  };

  // Build report dependencies
  const allClasses = useMemo(() => [...pendingClasses, ...completedClasses], [pendingClasses, completedClasses]);

  const buildReportDeps = useCallback((cls: ClassSummary): ReportDependencies => {
    const classEntries = allClasses.map(classToEntry);
    const trialInfo = buildTrialInfo(cls, allClasses);
    return {
      classes: classEntries,
      trialInfo,
      licenseKey: licenseKey || '',
      organization: organization || '',
      onComplete: handleCloseOptions,
    };
  }, [allClasses, licenseKey, organization]);

  // Print handlers
  const handlePrintCheckIn = useCallback(async () => {
    if (!selectedClass) return;
    const result = await handleGenerateCheckIn(selectedClass.id, buildReportDeps(selectedClass));
    if (!result.success) {
      alert(result.error || 'Failed to generate check-in sheet');
    }
  }, [selectedClass, buildReportDeps, handleGenerateCheckIn]);

  const handlePrintResults = useCallback(async () => {
    if (!selectedClass) return;
    const result = await handleGenerateResults(selectedClass.id, buildReportDeps(selectedClass));
    if (!result.success) {
      alert(result.error || 'Failed to generate results sheet');
    }
  }, [selectedClass, buildReportDeps, handleGenerateResults]);

  const handlePrintScoresheet = useCallback(async () => {
    if (!selectedClass) return;
    const result = await handleGenerateScoresheet(selectedClass.id, buildReportDeps(selectedClass));
    if (!result.success) {
      alert(result.error || 'Failed to generate scoresheet');
    }
  }, [selectedClass, buildReportDeps, handleGenerateScoresheet]);

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
                  canEdit={canEdit}
                  onClick={() => handleClassClick(classData)}
                  onOptionsClick={(e) => handleOptionsClick(classData, e)}
                  onTimeChange={handleTimeChange}
                  onStatusClick={handleStatusClick}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState type={activeTab} />
        )}
      </div>

      {/* Class Options Dialog */}
      {selectedClass && (
        <ClassOptionsDialog
          isOpen={classOptionsOpen}
          onClose={handleCloseOptions}
          classData={{
            id: selectedClass.id,
            element: selectedClass.element,
            level: selectedClass.level,
            class_name: selectedClass.class_name,
            entry_count: selectedClass.entry_count,
            completed_count: selectedClass.completed_count,
            class_status: selectedClass.class_status
          }}
          onRequirements={() => setRequirementsOpen(true)}
          onSetMaxTime={() => setMaxTimeOpen(true)}
          onSettings={() => setSettingsOpen(true)}
          onStatistics={() => {
            if (selectedClass.completed_count === 0) {
              setNoStatsOpen(true);
              return false; // Don't close dialog
            }
            navigate(`/stats/trial/${selectedClass.trial_id}?classId=${selectedClass.id}`);
          }}
          onStatus={() => {
            setStatusDialogClass(selectedClass);
            setStatusDialogOpen(true);
          }}
          onPrintCheckIn={handlePrintCheckIn}
          onPrintResults={handlePrintResults}
          onPrintScoresheet={handlePrintScoresheet}
        />
      )}

      {/* Class Requirements Dialog */}
      {selectedClass && (
        <ClassRequirementsDialog
          isOpen={requirementsOpen}
          onClose={() => setRequirementsOpen(false)}
          onSetMaxTime={() => {
            setRequirementsOpen(false);
            setMaxTimeOpen(true);
          }}
          classData={{
            id: selectedClass.id,
            element: selectedClass.element,
            level: selectedClass.level,
            class_name: selectedClass.class_name,
            entry_count: selectedClass.entry_count
          }}
        />
      )}

      {/* Max Time Dialog */}
      {selectedClass && (
        <MaxTimeDialog
          isOpen={maxTimeOpen}
          onClose={() => setMaxTimeOpen(false)}
          classData={{
            id: selectedClass.id,
            element: selectedClass.element,
            level: selectedClass.level,
            class_name: selectedClass.class_name
          }}
        />
      )}

      {/* Class Settings Dialog */}
      {selectedClass && (
        <ClassSettingsDialog
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          classData={{
            id: selectedClass.id,
            element: selectedClass.element,
            level: selectedClass.level,
            class_name: selectedClass.class_name
          }}
        />
      )}

      {/* No Stats Dialog */}
      <NoStatsDialog
        isOpen={noStatsOpen}
        onClose={() => setNoStatsOpen(false)}
        className={selectedClass?.class_name || ''}
      />

      {/* Class Status Dialog */}
      {statusDialogClass && (
        <ClassStatusDialog
          isOpen={statusDialogOpen}
          onClose={() => {
            setStatusDialogOpen(false);
            setStatusDialogClass(null);
          }}
          onStatusChange={handleStatusDialogChange}
          classData={{
            id: statusDialogClass.id,
            element: statusDialogClass.element,
            level: statusDialogClass.level,
            class_name: statusDialogClass.class_name,
            class_status: statusDialogClass.class_status,
            entry_count: statusDialogClass.entry_count,
            briefing_time: statusDialogClass.briefing_time,
            break_until_time: statusDialogClass.break_until_time,
            start_time: statusDialogClass.start_time
          }}
          currentStatus={statusDialogClass.class_status}
        />
      )}
    </div>
  );
}

export default ClassTable;
