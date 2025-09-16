import React, { useMemo, memo, useState, useEffect } from 'react';
import { ClassInfo, EntryInfo } from '../hooks/useTVData';
import { RotationDots } from './RotationDots';

interface CurrentStatusProps {
  currentClass: ClassInfo | null;
  currentEntry: EntryInfo | null;
  nextEntries: EntryInfo[];
  classes: ClassInfo[];
  inProgressClasses?: ClassInfo[];
  entries?: EntryInfo[];
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
  entries = []
}) => {
  // State for rotating through multiple in-progress classes
  const [currentClassIndex, setCurrentClassIndex] = useState(0);
  const [rotationEnabled, setRotationEnabled] = useState(true);
  
  // Use in-progress classes for rotation, fallback to single currentClass
  const availableClasses = inProgressClasses.length > 0 ? inProgressClasses : (currentClass ? [currentClass] : []);
  const activeClass = availableClasses[currentClassIndex] || currentClass;
  
  // Create items array for RotationDots component
  const classItems = availableClasses.map((cls, _index) => ({
    id: cls.id.toString(),
    label: `${cls.element_type.toUpperCase()} - ${cls.judge_name}`
  }));
  
  // Auto-rotate through in-progress classes every 8 seconds
  useEffect(() => {
    if (!rotationEnabled || availableClasses.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentClassIndex(prev => {
        const next = (prev + 1) % availableClasses.length;
        console.log(`🔄 Rotating to class ${next + 1}/${availableClasses.length}: ${availableClasses[next]?.class_name}`);
        return next;
      });
    }, 8000); // Rotate every 8 seconds
    
    return () => clearInterval(interval);
  }, [availableClasses.length, rotationEnabled]);
  
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
    // Use element matching since entries don't have direct class_id relationship
    return entries
      .filter(entry => 
        entry.element?.toUpperCase() === activeClass.element_type.toUpperCase() && 
        entry.status === 'waiting'
      )
      .slice(0, 6);
  }, [activeClass, entries, nextEntries]);
  // Memoized check-in status calculation
  const checkInStatus = useMemo(() => {
    if (!activeClass) return null;
    
    // Count entries for the active element type (since entries are organized by element, not class_id)
    const elementEntries = entries.filter(entry => 
      entry.element?.toUpperCase() === activeClass.element_type.toUpperCase()
    );
    const totalEntries = elementEntries.length;
    
    // Count actual check-ins from checkin_status field (1 = checked in, 0 = not checked in)
    const checkedIn = elementEntries.filter(entry => entry.checkin_status === 1).length;
    
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
  const getEntryStatusColor = useMemo(() => {
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
      <h2>Current Status</h2>
      
      {/* Class Rotation Dots */}
      <RotationDots
        items={classItems}
        currentIndex={currentClassIndex}
        isRotationEnabled={rotationEnabled}
        onItemSelect={setCurrentClassIndex}
        onToggleRotation={() => setRotationEnabled(!rotationEnabled)}
        className="class-rotation"
      />
      
      <div className="status-content">
        {activeClass ? (
          <>
            {/* Element and Judge Info */}
            <div className="element-info">
              <div className="element-name">{activeClass.element_type.toUpperCase()}</div>
              <div className="judge-name">Judge: {activeClass.judge_name}</div>
              {activeClass.start_time && (
                <div className="class-time">
                  Started: {new Date(activeClass.start_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
            
            {/* Current Dog in Search */}
            {activeCurrentEntry ? (
              <div className="current-dog">
                <div className="dog-header">
                  Dog In Search:
                  {/* Only show search time and score for completed dogs, not dogs currently in ring */}
                  {activeCurrentEntry.status !== 'in_ring' && activeCurrentEntry.search_time && (
                    <span className="search-timer">
                      Search Time: {formatSearchTime(activeCurrentEntry.search_time)}
                    </span>
                  )}
                </div>
                <div className="dog-info">
                  <div className="armband">#{activeCurrentEntry.armband}</div>
                  <div className="dog-details">
                    <div className="dog-name">"{activeCurrentEntry.dog_name}"</div>
                    <div className="dog-breed">{activeCurrentEntry.breed}</div>
                    <div className="handler-info">
                      Handler: {activeCurrentEntry.handler_name}
                      {activeCurrentEntry.handler_location && `, ${activeCurrentEntry.handler_location}`}
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
              <div className="current-dog preparing">
                <div className="dog-header">Preparing Next Dog...</div>
                <div className="preparing-message">
                  Judge is evaluating or setting up for next search
                </div>
              </div>
            )}
            
            {/* Next Dogs in Queue */}
            {activeNextEntries.length > 0 ? (
              <div className="next-dogs">
                <div className="next-header">
                  Next Up ({activeNextEntries.length} waiting):
                </div>
                <div className="dog-queue">
                  {activeNextEntries.slice(0, 6).map((entry, _index) => (
                    <div 
                      key={entry.id} 
                      className={`queue-dog ${_index === 0 ? 'next-immediate' : ''}`}
                      style={{ borderLeftColor: getEntryStatusColor(entry) }}
                    >
                      <div className="queue-position">{_index + 1}</div>
                      <div className="queue-info">
                        <span className="queue-armband">#{entry.armband}</span>
                        <span className="queue-name">"{entry.dog_name}"</span>
                        <span className="queue-breed">{entry.breed}</span>
                      </div>
                      <div className="queue-handler">
                        {entry.handler_name}
                        {entry.handler_location && (
                          <span className="handler-location">, {entry.handler_location}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {activeNextEntries.length > 6 && (
                    <div className="queue-more">
                      +{activeNextEntries.length - 6} more dogs waiting
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
                        <span className="upcoming-element">{cls.element_type.toUpperCase()}</span>
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