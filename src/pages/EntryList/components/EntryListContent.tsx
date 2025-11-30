import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  SensorDescriptor,
  SensorOptions,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableEntryCard } from '../SortableEntryCard';
import { Entry } from '../../../stores/entryStore';
import { UserPermissions } from '../../../utils/auth';
import type { ClassInfo } from '../hooks';

export interface EntryListContentProps {
  /** Filtered and sorted entries to display */
  entries: Entry[];
  /** Current active tab for empty state message */
  activeTab: 'pending' | 'completed';
  /** Whether drag mode is active */
  isDragMode: boolean;
  /** Show context for competition type */
  showContext?: {
    competition_type?: string;
  } | null;
  /** Class info for self-checkin setting */
  classInfo?: ClassInfo | null;
  /** Permission checker function */
  hasPermission: (permission: keyof UserPermissions) => boolean;
  /** Handler for entry click (scoresheet navigation) */
  onEntryClick: (entry: Entry) => void;
  /** Handler for status badge click */
  onStatusClick: (e: React.MouseEvent, entryId: number) => void;
  /** Handler for reset menu click */
  onResetMenuClick: (e: React.MouseEvent, entryId: number) => void;
  /** Handler for showing self-checkin disabled dialog */
  onSelfCheckinDisabled: () => void;
  /** Handler for prefetch on hover */
  onPrefetch?: (entry: Entry) => void;
  /** Whether to show section badges (for combined view) */
  showSectionBadges?: boolean;
  /** DnD sensors */
  sensors: SensorDescriptor<SensorOptions>[];
  /** DnD drag start handler */
  onDragStart: (event: DragStartEvent) => void;
  /** DnD drag end handler */
  onDragEnd: (event: DragEndEvent) => Promise<void>;
  /** Handler to open drag mode (long press) */
  onOpenDragMode?: () => void;
}

/**
 * Shared content component for entry list grid with drag-and-drop support.
 * Used by both EntryList and CombinedEntryList.
 */
export const EntryListContent: React.FC<EntryListContentProps> = ({
  entries,
  activeTab,
  isDragMode,
  showContext,
  classInfo,
  hasPermission,
  onEntryClick,
  onStatusClick,
  onResetMenuClick,
  onSelfCheckinDisabled,
  onPrefetch,
  showSectionBadges = false,
  sensors,
  onDragStart,
  onDragEnd,
  onOpenDragMode,
}) => {
  if (entries.length === 0) {
    return (
      <div className="no-entries">
        <h2>No {activeTab} entries</h2>
        <p>{activeTab === 'pending' ? 'All entries have been scored.' : 'No entries have been scored yet.'}</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={entries.map(e => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={`grid-responsive ${isDragMode ? 'drag-mode' : ''}`}>
          {entries.map((entry) => (
            <SortableEntryCard
              key={`${entry.id}-${entry.status}-${entry.isScored}`}
              entry={entry}
              isDragMode={isDragMode}
              showContext={showContext}
              classInfo={classInfo}
              hasPermission={hasPermission}
              handleEntryClick={onEntryClick}
              handleStatusClick={onStatusClick}
              handleResetMenuClick={onResetMenuClick}
              setSelfCheckinDisabledDialog={onSelfCheckinDisabled}
              onPrefetch={onPrefetch}
              sectionBadge={showSectionBadges ? (entry.section as 'A' | 'B' | null) : undefined}
              onOpenDragMode={onOpenDragMode}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default EntryListContent;
