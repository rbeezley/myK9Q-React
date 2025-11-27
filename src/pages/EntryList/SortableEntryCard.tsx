/**
 * SortableEntryCard Component
 *
 * Draggable entry card for the entry list with status badges and result display.
 *
 * Refactored as part of DEBT-008 to reduce complexity from 64 to manageable levels.
 * Helper functions and sub-components extracted to SortableEntryCardHelpers.tsx.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { DogCard } from '../../components/DogCard';
import { Entry } from '../../stores/entryStore';
import { UserPermissions } from '../../utils/auth';
import { getStatusBorderClass } from './sortableEntryCardUtils';
import { ResultBadges, StatusBadgeContent } from './SortableEntryCardComponents';

// ========================================
// TYPES
// ========================================

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
  /** Section badge for combined views (A/B) */
  sectionBadge?: 'A' | 'B' | null;
}

// ========================================
// MAIN COMPONENT
// ========================================

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
  sectionBadge,
}) => {
  const isInRing = entry.inRing || entry.status === 'in-ring';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    disabled: isInRing // Disable dragging for in-ring dogs
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine if self check-in is allowed
  const canCheckIn = hasPermission('canCheckInDogs');
  const isSelfCheckinEnabled = classInfo?.selfCheckin ?? true;
  const isCheckInDisabled = !canCheckIn && !isSelfCheckinEnabled;

  // Handle card click
  const handleCardClick = () => {
    if (isDragMode) return; // Disable navigation in drag mode
    if (hasPermission('canScore')) handleEntryClick(entry);
  };

  // Handle status badge click
  const handleStatusBadgeClick = (e: React.MouseEvent) => {
    if (canCheckIn || isSelfCheckinEnabled) {
      handleStatusClick(e, entry.id);
    } else {
      e.preventDefault();
      e.stopPropagation();
      setSelfCheckinDisabledDialog(true);
    }
  };

  // Handle reset menu click
  const handleResetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    handleResetMenuClick(e, entry.id);
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragMode ? 'sortable-item' : ''}>
      {/* Drag handle (only shown in drag mode for non-in-ring entries) */}
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
        onClick={handleCardClick}
        onPrefetch={() => onPrefetch?.(entry)}
        className={`${
          hasPermission('canScore') && !entry.isScored ? 'clickable' : ''
        } ${entry.status === 'in-ring' ? 'in-ring' : ''}`}
        statusBorder={getStatusBorderClass(entry)}
        resultBadges={<ResultBadges entry={entry} showContext={showContext} />}
        sectionBadge={sectionBadge}
        actionButton={
          !entry.isScored ? (
            <StatusBadge
              entry={entry}
              isDisabled={isCheckInDisabled}
              onClick={handleStatusBadgeClick}
            />
          ) : (
            <ResetButton onClick={handleResetClick} />
          )
        }
      />
    </div>
  );
};

// ========================================
// EXTRACTED SUB-COMPONENTS
// ========================================

/**
 * Status badge for unscored entries
 */
interface StatusBadgeProps {
  entry: Entry;
  isDisabled: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ entry, isDisabled, onClick }) => {
  const statusClass = entry.inRing
    ? 'in-ring'
    : (entry.status || 'none').toLowerCase().replace(' ', '-');

  return (
    <div
      className={`status-badge checkin-status ${statusClass} ${isDisabled ? 'disabled' : ''}`}
      style={{ textTransform: 'none' }}
      data-no-uppercase="true"
      onClick={onClick}
      title={isDisabled ? 'Self check-in disabled' : 'Tap to change status'}
    >
      <StatusBadgeContent status={entry.status} />
    </div>
  );
};

/**
 * Reset button for scored entries
 */
interface ResetButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

const ResetButton: React.FC<ResetButtonProps> = ({ onClick }) => (
  <button
    className="reset-button reset-menu-button"
    onClick={onClick}
    onMouseDown={(e) => e.stopPropagation()}
    aria-label="More options"
    title="Reset score"
  >
    ⋯
  </button>
);
