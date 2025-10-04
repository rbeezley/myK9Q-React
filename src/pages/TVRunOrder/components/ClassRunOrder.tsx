import React, { useMemo } from 'react';
import { ClassInfo, EntryInfo } from '../../TVDashboard/hooks/useTVData';
import { TVEntryCard } from './TVEntryCard';
import './ClassRunOrder.css';

interface ClassRunOrderProps {
  classInfo: ClassInfo;
  entries: EntryInfo[];
}

export const ClassRunOrder: React.FC<ClassRunOrderProps> = ({ classInfo, entries }) => {
  // Helper function to get display text for result status
  const getResultText = (resultStatus?: string): string | undefined => {
    if (!resultStatus) return undefined;
    const statusMap: Record<string, string> = {
      'q': 'Qualified',
      'qualified': 'Qualified',
      'nq': 'NQ',
      'absent': 'Absent',
      'excused': 'Excused',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[resultStatus.toLowerCase()] || resultStatus;
  };

  // Sort entries: In-ring first, then pending (by run order), then completed
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      // Priority 1: In-ring entries at top
      const aInRing = a.status === 'in_ring';
      const bInRing = b.status === 'in_ring';
      if (aInRing && !bInRing) return -1;
      if (!aInRing && bInRing) return 1;

      // Priority 2: Pending before completed
      const aScored = a.status === 'completed';
      const bScored = b.status === 'completed';
      if (!aScored && bScored) return -1;
      if (aScored && !bScored) return 1;

      // Priority 3: Sort by run order (sort_order field or armband)
      // Note: sort_order in TV data might map to exhibitorOrder in Entry interface
      const aOrder = parseInt(a.sort_order || a.armband || '0');
      const bOrder = parseInt(b.sort_order || b.armband || '0');
      return aOrder - bOrder;
    });
  }, [entries]);

  // Separate into pending and completed sections
  const pendingEntries = sortedEntries.filter(e => e.status !== 'completed');
  const completedEntries = sortedEntries.filter(e => e.status === 'completed');

  // Build class display name
  const className = classInfo.class_name || `${classInfo.element_type} ${classInfo.level || ''}`.trim();

  return (
    <div className="class-runorder">
      {/* Class header */}
      <div className="class-runorder-header">
        <h2 className="class-runorder-title">{className}</h2>
        <div className="class-runorder-meta">
          <span className="class-runorder-judge">
            Judge: {classInfo.judge_name || 'TBD'}
          </span>
          <span className="class-runorder-progress">
            {classInfo.entry_completed_count || 0} of {classInfo.entry_total_count || 0} scored
          </span>
        </div>
      </div>

      {/* Entry list */}
      <div className="class-runorder-entries">
        {/* Pending entries */}
        {pendingEntries.map((entry) => {
          const hasRealSection = entry.section && entry.section !== '-' && entry.section.trim() !== '';
          return (
            <TVEntryCard
              key={entry.id}
              armband={parseInt(entry.armband)}
              callName={entry.dog_name}
              breed={entry.breed}
              handler={entry.handler_name}
              isScored={entry.status === 'completed'}
              inRing={entry.status === 'in_ring'}
              resultText={getResultText(entry.result_status)}
              sectionBadge={hasRealSection ? (entry.section as 'A' | 'B') : undefined}
              checkinStatus={entry.checkin_status}
            />
          );
        })}

        {/* Separator if there are both pending and completed */}
        {pendingEntries.length > 0 && completedEntries.length > 0 && (
          <hr className="entries-separator" />
        )}

        {/* Completed entries */}
        {completedEntries.map((entry) => {
          const hasRealSection = entry.section && entry.section !== '-' && entry.section.trim() !== '';
          return (
            <TVEntryCard
              key={entry.id}
              armband={parseInt(entry.armband)}
              callName={entry.dog_name}
              breed={entry.breed}
              handler={entry.handler_name}
              isScored={entry.status === 'completed'}
              inRing={false}
              resultText={getResultText(entry.result_status)}
              sectionBadge={hasRealSection ? (entry.section as 'A' | 'B') : undefined}
              checkinStatus={entry.checkin_status}
            />
          );
        })}

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="class-runorder-empty">
            <p>No entries for this class</p>
          </div>
        )}
      </div>
    </div>
  );
};
