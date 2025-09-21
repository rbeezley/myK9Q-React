import React, { useMemo, memo, useState, useEffect } from 'react';
import { ClassInfo, EntryInfo, ShowInfo } from '../hooks/useTVData';
import { RotationDots } from './RotationDots';
import { ClassProgressSummary } from './ClassProgressSummary';
import '../styles/enhanced-animations.css';
import './ClassProgressSummary.css';

// Helper function to get element icons
const _getElementIcon = (elementType: string): string => {
  switch (elementType.toUpperCase()) {
    case 'CONTAINER': return '📦';
    case 'BURIED': return '🕳️';
    case 'INTERIOR': return '🏠';
    case 'EXTERIOR': return '🌳';
    case 'HANDLER DISCRIMINATION':
    case 'HD_CHALLENGE': return '🎯';
    default: return '🔍';
  }
};

interface CurrentStatusProps {
  currentClass: ClassInfo | null;
  currentEntry: EntryInfo | null;
  nextEntries: EntryInfo[];
  classes: ClassInfo[];
  inProgressClasses?: ClassInfo[];
  entries?: EntryInfo[];
  showInfo?: ShowInfo | null;
}

// Helper function for ordinal suffixes
const getOrdinalSuffix = (num: number): string => {
  const remainder = num % 100;
  if (remainder >= 11 && remainder <= 13) {
    return 'th';
  }
  switch (num % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export const CurrentStatus: React.FC<CurrentStatusProps> = memo(({
  currentClass,
  currentEntry: _currentEntry,
  nextEntries,
  classes,
  inProgressClasses = [],
  entries = [],
  showInfo: _showInfo
}) => {
  // State for rotating through multiple in-progress classes + summary
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [rotationEnabled, setRotationEnabled] = useState(true);

  // Use in-progress classes for rotation, fallback to single currentClass
  const availableClasses = inProgressClasses.length > 0 ? inProgressClasses : (currentClass ? [currentClass] : []);

  // Create items array for RotationDots component (individual classes only, no summary)
  const viewItems = useMemo(() => {
    const classItems = availableClasses.map((cls, _index) => ({
      id: cls.id.toString(),
      label: `${cls.element_type.toUpperCase()} - ${cls.judge_name}`
    }));

    // No longer adding summary view
    return classItems;
  }, [availableClasses]);

  // Now we only show specific classes, no summary view
  const isShowingSummary = false; // Always false now
  const activeClass = availableClasses[currentViewIndex] || null;
  
  // Auto-rotate through views (classes + summary) every 8 seconds
  useEffect(() => {
    if (!rotationEnabled || viewItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentViewIndex(prev => {
        const next = (prev + 1) % viewItems.length;
        const nextItem = viewItems[next];
        console.log(`🔄 Rotating to view ${next + 1}/${viewItems.length}: ${nextItem?.label}`);
        return next;
      });
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(interval);
  }, [viewItems.length, rotationEnabled]);
  
  // Find current entry and next entries for the active class
  const activeCurrentEntry = useMemo(() => {
    if (!activeClass) return null;
    
    // First try to find by current_entry_id if it exists
    if (activeClass.current_entry_id) {
      const entryById = entries.find(entry => entry.id === activeClass.current_entry_id);
      if (entryById) return entryById;
    }
    
    // Otherwise, look for any entry marked as in_ring for this element
    return entries.find(entry => 
      entry.element?.toUpperCase() === activeClass.element_type.toUpperCase() && 
      entry.status === 'in_ring'
    ) || null;
  }, [activeClass, entries]);
  
  const activeNextEntries = useMemo(() => {
    if (!activeClass) return nextEntries;

    console.log(`🔍 Filtering waiting entries for ${activeClass.element_type} ${activeClass.level} on ${activeClass.trial_date} ${activeClass.trial_number}`);
    console.log(`📊 Total entries available: ${entries.length}`);

    // Step-by-step filtering with logging for debugging
    const matchingElement = entries.filter(entry => {
      const match = entry.element?.toUpperCase() === activeClass.element_type.toUpperCase();
      if (!match && entry.element) {
        console.log(`❌ Element mismatch: "${entry.element}" !== "${activeClass.element_type}"`);
      }
      return match;
    });
    console.log(`📊 Matching element (${activeClass.element_type}): ${matchingElement.length}`);

    const matchingLevel = matchingElement.filter(entry => {
      const match = entry.level?.toUpperCase() === activeClass.level?.toUpperCase();
      if (!match && entry.level) {
        console.log(`❌ Level mismatch: "${entry.level}" !== "${activeClass.level}"`);
      }
      return match;
    });
    console.log(`📊 Matching level (${activeClass.level}): ${matchingLevel.length}`);

    const matchingDate = matchingLevel.filter(entry => {
      // Normalize trial dates for comparison (handle format variations)
      const entryDate = entry.trial_date?.trim();
      const classDate = activeClass.trial_date?.trim();
      const match = entryDate === classDate;
      if (!match && entryDate && classDate) {
        console.log(`❌ Date mismatch: "${entryDate}" !== "${classDate}"`);
      }
      return match;
    });
    console.log(`📊 Matching date (${activeClass.trial_date}): ${matchingDate.length}`);

    const matchingTrial = matchingDate.filter(entry => {
      const match = entry.trial_number === activeClass.trial_number;
      if (!match && entry.trial_number) {
        console.log(`❌ Trial number mismatch: "${entry.trial_number}" !== "${activeClass.trial_number}"`);
      }
      return match;
    });
    console.log(`📊 Matching trial number (${activeClass.trial_number}): ${matchingTrial.length}`);

    const waitingEntries = matchingTrial.filter(entry => {
      const isWaiting = entry.status === 'waiting';
      if (!isWaiting) {
        console.log(`ℹ️ Entry ${entry.armband} ${entry.dog_name} status: ${entry.status} (is_scored: ${entry.score !== undefined}, in_ring: ${entry.status === 'in_ring'})`);
      }
      return isWaiting;
    });
    console.log(`📊 Waiting entries: ${waitingEntries.length}`);

    // Log details of waiting entries
    waitingEntries.forEach(entry => {
      console.log(`🐕 Waiting: #${entry.armband} ${entry.dog_name} (sort_order: ${entry.sort_order})`);
    });

    const sortedEntries = waitingEntries.sort((a, b) => {
      // Sort by sort_order first, then by armband as tiebreaker
      const sortOrderA = parseInt(a.sort_order || '999999');
      const sortOrderB = parseInt(b.sort_order || '999999');
      if (sortOrderA !== sortOrderB) {
        return sortOrderA - sortOrderB;
      }
      return parseInt(a.armband) - parseInt(b.armband);
    });

    const finalEntries = sortedEntries.slice(0, 4);
    console.log(`📊 Final waiting list (showing ${finalEntries.length}/4):`, finalEntries.map(e => `#${e.armband} ${e.dog_name}`));

    return finalEntries;
  }, [activeClass, entries, nextEntries]);
  // Memoized check-in status calculation - class-specific like completion progress
  const checkInStatus = useMemo(() => {
    if (!activeClass) return null;

    // Use same filtering logic as activeNextEntries to get class-specific entries
    const classEntries = entries.filter(entry => {
      return (
        entry.element?.toUpperCase() === activeClass.element_type.toUpperCase() &&
        entry.level?.toUpperCase() === activeClass.level?.toUpperCase() &&
        entry.trial_date?.trim() === activeClass.trial_date?.trim() &&
        entry.trial_number === activeClass.trial_number
      );
    });

    const totalEntries = classEntries.length;

    // Count actual check-ins from checkin_status field (1 = checked in, 0 = not checked in)
    const checkedIn = classEntries.filter(entry => entry.checkin_status === 1).length;

    return { checkedIn, total: totalEntries };
  }, [activeClass, entries]);

  // Memoized format search time function
  const formatSearchTime = useMemo(() => {
    return (timeStr?: string) => {
      if (!timeStr) return null;
      
      // Convert seconds to MM:SS format
      const seconds = parseInt(timeStr);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
  }, []);

  // Memoized status color function
  const _getEntryStatusColor = useMemo(() => {
    return (entry: EntryInfo) => {
      switch (entry.status) {
        case 'in_ring': return 'var(--status-active)';
        case 'waiting': return 'var(--status-scheduled)';
        case 'completed': return 'var(--status-complete)';
        default: return 'var(--text-secondary)';
      }
    };
  }, []);

  return (
    <section className="current-status-panel">
      {/* View Rotation Dots */}
      <RotationDots
        items={viewItems}
        currentIndex={currentViewIndex}
        isRotationEnabled={rotationEnabled}
        onItemSelect={setCurrentViewIndex}
        onToggleRotation={() => setRotationEnabled(!rotationEnabled)}
        className="class-rotation"
      />
      
      <div className="status-content">
        {isShowingSummary ? (
          <ClassProgressSummary inProgressClasses={inProgressClasses} entries={entries} />
        ) : activeClass ? (
          <>
            {/* Compact Header - All info on one line */}
            <div className="element-info compact-header">
              <div className="class-info-line">
                {/* Trial Date */}
                {currentClass?.trial_date && (
                  <span className="trial-date">
                    {(() => {
                      const date = new Date(currentClass.trial_date);
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });
                    })()}
                  </span>
                )}

                {/* Trial Number */}
                {currentClass?.trial_number && (
                  <span className="trial-number">Trial {currentClass.trial_number}</span>
                )}

                {/* Element and Level */}
                <span className="element-level">
                  {activeClass.level && activeClass.level !== 'Unknown'
                    ? `${activeClass.level.toUpperCase()} ${activeClass.element_type.toUpperCase()}`
                    : activeClass.element_type.toUpperCase()
                  }
                </span>

                {/* Judge */}
                <span className="judge-name">Judge: {activeClass.judge_name}</span>

                {/* Start Time */}
                {activeClass.start_time && (
                  <span className="class-time">
                    Started: {new Date(activeClass.start_time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="class-progress">
                <div className="progress-label">
                  <span>Progress</span>
                  <span className="progress-count">
                    {activeClass.entry_completed_count || 0}/{activeClass.entry_total_count || 0} ({Math.round(((activeClass.entry_completed_count || 0) / (activeClass.entry_total_count || 1)) * 100)}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.max(((activeClass.entry_completed_count || 0) / (activeClass.entry_total_count || 1)) * 100, 2)}%`
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Current Dog in Search - Matching waiting card design */}
            {activeCurrentEntry ? (
              <div className="current-dog queue-dog-enhanced in-ring">
                <div className="dog-header">
                  Currently Searching:
                  {/* Only show search time and score for completed dogs, not dogs currently in ring */}
                  {activeCurrentEntry.status !== 'in_ring' && activeCurrentEntry.search_time && (
                    <span className="search-timer">
                      Search Time: {formatSearchTime(activeCurrentEntry.search_time)}
                    </span>
                  )}
                </div>
                <div className="dog-info">
                  <div className="queue-armband-badge in-ring-badge">
                    <span className="queue-position">🔍</span>
                    <span className="armband-number">{activeCurrentEntry.armband}</span>
                  </div>
                  <div className="queue-info">
                    <div className="queue-name">{activeCurrentEntry.dog_name}</div>
                    <div className="queue-breed">{activeCurrentEntry.breed}</div>
                    <div className="queue-handler">
                      <span className="handler-name">{activeCurrentEntry.handler_name}</span>
                      {activeCurrentEntry.handler_location && (
                        <span className="handler-location">, {activeCurrentEntry.handler_location}</span>
                      )}
                    </div>
                    {/* Only show score for completed dogs, not dogs currently in ring */}
                    {activeCurrentEntry.status !== 'in_ring' && activeCurrentEntry.score !== undefined && (
                      <div className="current-score">
                        Score: {activeCurrentEntry.score}
                        {activeCurrentEntry.placement && ` (${activeCurrentEntry.placement}${getOrdinalSuffix(activeCurrentEntry.placement)} place)`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="current-dog current-dog-enhanced preparing">
                <div className="dog-header">Preparing for Next Dog...</div>
              </div>
            )}
            
            {/* Next Dogs in Queue */}
            {activeNextEntries.length > 0 ? (
              <div className="next-dogs">
                <div className="next-header">
                  Next {Math.min(activeNextEntries.length, 4)} waiting:
                </div>
                <div className="dog-queue">
                  {activeNextEntries.slice(0, 4).map((entry, _index) => (
                    <div
                      key={entry.id}
                      className={`queue-dog queue-dog-enhanced ${_index === 0 ? 'next-immediate' : ''}`}
                    >
                      <div className="queue-armband-badge">
                        <span className="queue-position">{_index + 1}</span>
                        <span className="armband-number">{entry.armband}</span>
                      </div>
                      <div className="queue-info">
                        <div className="queue-name">{entry.dog_name}</div>
                        <div className="queue-breed">{entry.breed}</div>
                        <div className="queue-handler">
                          <span className="handler-name">{entry.handler_name}</span>
                          {entry.handler_location && (
                            <span className="handler-location">, {entry.handler_location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeNextEntries.length > 4 && (
                    <div className="queue-more">
                      +{activeNextEntries.length - 4} more dogs waiting
                    </div>
                  )}
                </div>
              </div>
            ) : activeCurrentEntry ? (
              <div className="queue-empty">
                <div className="empty-message">
                  🎉 Last dog in class!
                </div>
              </div>
            ) : null}

            {/* Check-in Status */}
            {checkInStatus && (
              <div className="checkin-summary">
                <div className="checkin-header">Class Check-in Status:</div>
                <div className="checkin-stats">
                  <span className="checkin-count">
                    {checkInStatus.checkedIn}/{checkInStatus.total} dogs checked in
                  </span>
                  <div className="checkin-bar">
                    <div 
                      className="checkin-fill"
                      style={{ 
                        width: `${(checkInStatus.checkedIn / checkInStatus.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-active-class">
            <div className="element-info">
              <div className="element-name">NO IN-PROGRESS CLASS</div>
              <div className="judge-name">
                Competition Status: {classes.length > 0 ? 'Between Classes' : 'Awaiting Schedule'}
              </div>
            </div>
            
            {classes.length > 0 && (
              <div className="upcoming-classes">
                <div className="upcoming-header">Upcoming Classes:</div>
                <div className="class-list">
                  {classes
                    .filter(cls => cls.status === 'scheduled')
                    .slice(0, 3)
                    .map(cls => (
                      <div key={cls.id} className="upcoming-class">
                        <span className="upcoming-element">
                          {cls.level && cls.level !== 'Unknown'
                            ? `${cls.level.toUpperCase()} ${cls.element_type.toUpperCase()}`
                            : cls.element_type.toUpperCase()
                          }
                        </span>
                        <span className="upcoming-judge">Judge: {cls.judge_name}</span>
                        {cls.start_time && (
                          <span className="upcoming-time">
                            {new Date(cls.start_time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
});

// Display name for debugging
CurrentStatus.displayName = 'CurrentStatus';

export default CurrentStatus;