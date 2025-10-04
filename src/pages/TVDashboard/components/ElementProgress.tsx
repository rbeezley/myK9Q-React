import React, { useMemo, memo } from 'react';
import { ClassInfo, EntryInfo } from '../hooks/useTVData';

interface ElementProgressItem {
  elementName: string;
  completed: number;
  total: number;
  status: 'completed' | 'in_progress' | 'pending' | 'scheduled';
  scheduledTime?: string;
  estimatedCompletion?: string;
  judge?: string;
}

interface ElementProgressProps {
  classes: ClassInfo[];
  entries: EntryInfo[];
  checkedIn?: number;
  totalDogs?: number;
}

export const ElementProgress: React.FC<ElementProgressProps> = memo(({
  classes,
  entries,
  checkedIn = 189,
  totalDogs = 200
}) => {
  
  // Memoized transform real class data into progress items
  const elementProgressItems = useMemo((): ElementProgressItem[] => {
    // Get actual unique element types from the data, not hardcoded list
    const uniqueElementTypes = [...new Set(classes.map(cls => cls.element_type.toUpperCase()))];
    const fallbackElements = ['CONTAINER', 'BURIED', 'INTERIOR', 'EXTERIOR'];
    const elementTypes = uniqueElementTypes.length > 0 ? uniqueElementTypes : fallbackElements;
    
    return elementTypes.map(elementType => {
      // Find classes for this element type (there might be multiple)
      const elementClasses = classes.filter(cls => 
        cls.element_type.toUpperCase() === elementType
      );
      
      if (elementClasses.length === 0) {
        return {
          elementName: elementType,
          completed: 0,
          total: totalDogs,
          status: 'scheduled' as const,
        };
      }
      
      // Handle multiple classes for this element type
      // Choose the primary class (first in_progress, or first scheduled, or first available)
      const inProgressClass = elementClasses.find(cls => cls.status === 'in_progress');
      const scheduledClass = elementClasses.find(cls => cls.status === 'scheduled');
      const primaryClass = inProgressClass || scheduledClass || elementClasses[0];

      // Count entries across all classes of this element type
      const allClassEntries = entries.filter(entry =>
        elementClasses.some(cls => cls.id === entry.class_id)
      );
      const completedEntries = allClassEntries.filter(entry => entry.status === 'completed').length;
      const totalEntries = allClassEntries.length || totalDogs;

      // Determine overall status for this element type
      let status: 'completed' | 'in_progress' | 'pending' | 'scheduled';
      if (elementClasses.some(cls => cls.status === 'in_progress')) {
        status = 'in_progress';
      } else if (elementClasses.every(cls => cls.status === 'completed')) {
        status = 'completed';
      } else if (elementClasses.some(cls => cls.start_time)) {
        status = 'scheduled';
      } else {
        status = 'pending';
      }

      // Calculate estimated completion time for in_progress element types
      let estimatedCompletion: string | undefined;
      if (status === 'in_progress' && completedEntries > 0) {
        const avgTimePerDog = 3; // minutes - this could be calculated from actual data
        const remainingDogs = totalEntries - completedEntries;
        const estimatedMinutes = remainingDogs * avgTimePerDog;
        const completionTime = new Date(Date.now() + estimatedMinutes * 60000);
        estimatedCompletion = completionTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Get judge name from primary class
      const judgeName = primaryClass.judge_name;
      
      return {
        elementName: elementType,
        completed: completedEntries,
        total: totalEntries,
        status,
        scheduledTime: primaryClass.start_time ? new Date(primaryClass.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }) : undefined,
        estimatedCompletion,
        judge: judgeName,
      };
    });
  }, [classes, entries, totalDogs]);
  
  // Memoized helper functions
  const getProgressText = useMemo(() => {
    return (element: ElementProgressItem) => {
      if (element.status === 'scheduled' && element.scheduledTime) {
        return `Scheduled ${element.scheduledTime}`;
      }
      
      const percentage = Math.round((element.completed / element.total) * 100);
      
      if (element.status === 'in_progress') {
        if (element.estimatedCompletion) {
          return `${percentage}% (Est. complete: ${element.estimatedCompletion})`;
        }
        return `${percentage}% In Progress`;
      }
      
      if (element.status === 'completed') {
        return `✓ Complete (${element.completed}/${element.total})`;
      }
      
      return `${percentage}% (${element.completed}/${element.total})`;
    };
  }, []);

  const getProgressPercentage = useMemo(() => {
    return (element: ElementProgressItem) => {
      return Math.round((element.completed / element.total) * 100);
    };
  }, []);

  const getProgressFillClass = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case 'in_progress':
          return 'progress-fill active';
        case 'pending':
        case 'scheduled':
          return 'progress-fill pending';
        case 'completed':
          return 'progress-fill completed';
        default:
          return 'progress-fill';
      }
    };
  }, []);

  return (
    <section className="progress-section">
      <h3>Element Progress</h3>
      <div className="element-progress-grid">
        {elementProgressItems.map((element) => (
          <div key={element.elementName} className="progress-item">
            <div className="progress-header">
              <div className="element-header-top">
                <span className="element-name">{element.elementName}</span>
                <span className="progress-percentage">
                  {getProgressPercentage(element)}%
                </span>
              </div>
              <div className="element-header-bottom">
                <span className="progress-text">{getProgressText(element)}</span>
                {element.judge && element.status !== 'pending' && (
                  <span className="element-judge">Judge: {element.judge}</span>
                )}
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className={getProgressFillClass(element.status)}
                style={{ width: `${getProgressPercentage(element)}%` }}
              >
                {element.status === 'in_progress' && (
                  <div className="progress-shimmer"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="checkin-status">
        📍 Check-In Status: {checkedIn}/{totalDogs} ✓
      </div>
    </section>
  );
});

// Display name for debugging
ElementProgress.displayName = 'ElementProgress';

export default ElementProgress;