import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { CompetitorCard } from '../../../components/scoring/CompetitorCard';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import './AKCScentWorkScoresheet.css';

import { QualifyingResult } from '../../../stores/scoringStore';

interface AreaScore {
  areaName: string;
  time: string;
  found: boolean;
  correct: boolean;
}

export const AKCScentWorkScoresheet: React.FC = () => {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();
  
  // Store hooks
  const {
    isScoring,
    startScoringSession,
    submitScore: addScoreToSession,
    moveToNextEntry,
    moveToPreviousEntry,
    endScoringSession
  } = useScoringStore();
  
  const {
    currentClassEntries,
    currentEntry,
    setCurrentClassEntries,
    setCurrentEntry,
    markAsScored,
    getPendingEntries
  } = useEntryStore();
  
  const { addToQueue, isOnline } = useOfflineQueueStore();
  
  // Initialize areas based on element and level
  const initializeAreas = (element: string, level: string): AreaScore[] => {
    const elementLower = element?.toLowerCase() || '';
    const levelLower = level?.toLowerCase() || '';
    
    if (elementLower === 'interior') {
      if (levelLower === 'excellent') {
        return [
          { areaName: 'Interior Area 1', time: '', found: false, correct: false },
          { areaName: 'Interior Area 2', time: '', found: false, correct: false }
        ];
      } else if (levelLower === 'master' || levelLower === 'masters') {
        return [
          { areaName: 'Interior Area 1', time: '', found: false, correct: false },
          { areaName: 'Interior Area 2', time: '', found: false, correct: false },
          { areaName: 'Interior Area 3', time: '', found: false, correct: false }
        ];
      } else {
        // Novice and Advanced have single area
        return [
          { areaName: 'Interior', time: '', found: false, correct: false }
        ];
      }
    } else if (elementLower === 'handler discrimination' || elementLower === 'handlerdiscrimination') {
      if (levelLower === 'master' || levelLower === 'masters') {
        return [
          { areaName: 'Handler Discrimination Area 1', time: '', found: false, correct: false },
          { areaName: 'Handler Discrimination Area 2', time: '', found: false, correct: false }
        ];
      } else {
        // Novice, Advanced, and Excellent have single area
        return [
          { areaName: 'Handler Discrimination', time: '', found: false, correct: false }
        ];
      }
    } else {
      // Container, Exterior, Buried - single area for all levels
      return [
        { areaName: element || 'Search Area', time: '', found: false, correct: false }
      ];
    }
  };

  // Local state
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingResult>('Q');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [faultCount, setFaultCount] = useState(0);
  
  // Central stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchInterval, setStopwatchInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  
  // Central stopwatch handlers
  const startStopwatch = () => {
    setIsStopwatchRunning(true);
    const startTime = Date.now() - stopwatchTime;
    const interval = setInterval(() => {
      setStopwatchTime(Date.now() - startTime);
    }, 10);
    setStopwatchInterval(interval);
  };
  
  const stopStopwatch = () => {
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    
    // Auto-populate current area time field
    const formattedTime = formatStopwatchTime(stopwatchTime);
    if (currentAreaIndex < areas.length) {
      handleAreaUpdate(currentAreaIndex, 'time', formattedTime);
      
      // Move to next area if available, otherwise stay on current
      if (currentAreaIndex < areas.length - 1) {
        setCurrentAreaIndex(prev => prev + 1);
      }
    }
    
    // Reset stopwatch
    resetStopwatch();
  };
  
  const resetStopwatch = () => {
    setStopwatchTime(0);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    setIsStopwatchRunning(false);
  };
  
  const formatStopwatchTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };
  
  // Load class entries on mount
  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, entryId, showContext]);

  // Cleanup stopwatch on unmount
  useEffect(() => {
    return () => {
      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
      }
    };
  }, [stopwatchInterval]);
  
  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;
    
    try {
      const entries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      setCurrentClassEntries(parseInt(classId));
      
      // Find and set the specific entry that was clicked
      let targetEntry;
      if (entryId && entryId !== '0') {
        // Look for specific entry ID
        targetEntry = entries.find(e => e.id === parseInt(entryId));
      }
      
      // Fallback to first pending entry if specific entry not found or entryId is '0'
      if (!targetEntry) {
        const pending = entries.filter(e => !e.isScored);
        targetEntry = pending.length > 0 ? pending[0] : entries[0];
      }
      
      if (targetEntry) {
        setCurrentEntry(targetEntry);
        
        // Initialize areas based on element and level
        const initialAreas = initializeAreas(targetEntry.element || '', targetEntry.level || '');
        setAreas(initialAreas);
        
        // Start scoring session if not already started
        if (!isScoring) {
          startScoringSession(
            parseInt(classId),
            currentEntry?.className || 'Unknown Class',
            'AKC_SCENT_WORK',
            showContext.licenseKey,
            entries.length
          );
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };
  
  const handleAreaUpdate = (areaIndex: number, field: keyof AreaScore, value: any) => {
    setAreas(prev => prev.map((area, index) => 
      index === areaIndex ? { ...area, [field]: value } : area
    ));
  };
  
  const calculateTotalTime = () => {
    // For AKC Scent Work, sum ALL area times (regardless of found status)
    // This matches AKC rules where total search time includes all areas
    const times = areas
      .filter(area => area.time && area.time.trim() !== '')
      .map(area => {
        const timeStr = area.time.trim();
        if (timeStr.includes(':')) {
          const [minutes, seconds] = timeStr.split(':').map(parseFloat);
          return (minutes * 60) + seconds;
        } else {
          // Handle seconds-only format
          return parseFloat(timeStr) || 0;
        }
      });
    
    if (times.length === 0) return '';
    
    const total = times.reduce((sum, time) => sum + time, 0);
    const totalMinutes = Math.floor(total / 60);
    const totalSeconds = (total % 60).toFixed(2);
    
    return `${totalMinutes}:${totalSeconds.padStart(5, '0')}`;
  };
  
  const calculateQualifying = (): QualifyingResult => {
    const foundCount = areas.filter(area => area.found && area.correct).length;
    
    // Basic AKC Scent Work qualifying logic (simplified)
    if (foundCount >= 2) return 'Q'; // Need at least 2 correct finds
    return 'NQ';
  };
  
  const handleSubmit = () => {
    const calculatedTotal = calculateTotalTime();
    setTotalTime(calculatedTotal);
    
    const calculatedQualifying = qualifying === 'Q' ? calculateQualifying() : qualifying;
    setQualifying(calculatedQualifying);
    
    setShowConfirmation(true);
  };
  
  const confirmSubmit = async () => {
    if (!currentEntry) return;
    
    setIsSubmitting(true);
    setShowConfirmation(false);
    
    const finalQualifying = qualifying === 'Q' ? calculateQualifying() : qualifying;
    const finalTotalTime = totalTime || calculateTotalTime() || '0.00';
    
    // Prepare area results
    const areaResults: Record<string, string> = {};
    areas.forEach(area => {
      areaResults[area.areaName.toLowerCase()] = `${area.time}${area.found ? ' FOUND' : ' NOT FOUND'}${area.correct ? ' CORRECT' : ' INCORRECT'}`;
    });
    
    const scoreData = {
      entryId: currentEntry.id,
      armband: currentEntry.armband,
      time: finalTotalTime,
      qualifying: finalQualifying,
      areas: areaResults,
      nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined
    };
    
    try {
      // Add to scoring session
      addScoreToSession(scoreData);
      
      // Update entry store
      markAsScored(currentEntry.id, finalQualifying || 'NQ');
      
      if (isOnline) {
        // Submit directly if online
        await submitScore(currentEntry.id, {
          resultText: finalQualifying || 'NQ',
          searchTime: finalTotalTime,
          nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined
        });
      } else {
        // Add to offline queue
        addToQueue({
          entryId: currentEntry.id,
          armband: currentEntry.armband,
          classId: parseInt(classId!),
          className: currentEntry.className,
          scoreData: {
            resultText: finalQualifying || 'NQ',
            searchTime: finalTotalTime,
            nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined,
            areas: areaResults
          }
        });
      }
      
      // Move to next entry
      const pendingEntries = getPendingEntries();
      if (pendingEntries.length > 0) {
        setCurrentEntry(pendingEntries[0]);
        moveToNextEntry();
        
        // Reset form with areas for next entry
        const nextEntryAreas = initializeAreas(pendingEntries[0].element || '', pendingEntries[0].level || '');
        setAreas(nextEntryAreas);
        setQualifying('Q');
        setNonQualifyingReason('');
        setTotalTime('');
      } else {
        // All entries scored
        endScoringSession();
        navigate(-1);
      }
      
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. It has been saved offline.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const _handlePrevious = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex > 0) {
      const prevEntry = currentClassEntries[currentIndex - 1];
      setCurrentEntry(prevEntry);
      // Update areas for previous entry
      const prevAreas = initializeAreas(prevEntry.element || '', prevEntry.level || '');
      setAreas(prevAreas);
      moveToPreviousEntry();
    }
  };
  
  const _handleNext = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex < currentClassEntries.length - 1) {
      const nextEntry = currentClassEntries[currentIndex + 1];
      setCurrentEntry(nextEntry);
      // Update areas for next entry
      const nextAreas = initializeAreas(nextEntry.element || '', nextEntry.level || '');
      setAreas(nextAreas);
      moveToNextEntry();
    }
  };
  
  if (!currentEntry) {
    return (
      <div className="scoresheet-container">
        <div className="no-entries">
          <h2>No pending entries</h2>
          <button onClick={() => navigate(-1)}>Back to Class List</button>
        </div>
      </div>
    );
  }
  
  const _currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry.id) + 1;
  const allAreasScored = areas.every(area => area.time && area.time !== '');
  
  return (
    <div className="scoresheet-container akc-scent-work">
      <header className="scoresheet-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>AKC Scent Work</h1>
        <div className="sync-status">
          {isOnline ? (
            <span className="online">● Online</span>
          ) : (
            <span className="offline">● Offline</span>
          )}
        </div>
      </header>
      
      <div className="scoresheet-content compact-mobile">
        {/* Dog Header Card */}
        <div className="dog-header-card">
          <div className="armband-section">
            <span className="armband-label">Armband</span>
            <span className="armband-number">#{currentEntry.armband}</span>
          </div>
          <div className="dog-info">
            <span className="dog-name">{currentEntry.callName}</span>
            <span className="breed">{currentEntry.breed}</span>
            <span className="handler">Handler: {currentEntry.handler}</span>
          </div>
          <div className="trial-details">
            <div className="trial-info">
              <span className="trial-date">{'Trial Date'}</span>
              <span className="trial-number">Trial #{'1'}</span>
            </div>
            <div className="class-info">
              <span className="element">{currentEntry?.element}</span>
              <span className="level">{currentEntry?.level}</span>
              <span className="section">Section {currentEntry?.section}</span>
            </div>
          </div>
        </div>
        
        {/* Central Stopwatch */}
        <div className="central-stopwatch">
          <div className="stopwatch-display">
            <div className="stopwatch-time">
              {formatStopwatchTime(stopwatchTime)}
            </div>
            <div className="current-area-indicator">
              Timing: {areas[currentAreaIndex]?.areaName || 'Ready'}
            </div>
          </div>
          
          <button 
            className={`stopwatch-button ${isStopwatchRunning ? 'stop' : 'start'}`}
            onClick={isStopwatchRunning ? stopStopwatch : startStopwatch}
          >
            {isStopwatchRunning ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                STOP
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                START
              </>
            )}
          </button>
          
          {stopwatchTime > 0 && !isStopwatchRunning && (
            <button className="reset-button" onClick={resetStopwatch}>
              Reset
            </button>
          )}
        </div>
        
        {/* Area Results */}
        <div className="areas-results">
          {areas.map((area, index) => (
            <div key={area.areaName} className={`area-result ${index === currentAreaIndex ? 'current' : ''}`}>
              <div className="area-header">
                <span className="area-name">{area.areaName}</span>
                {index === currentAreaIndex && <span className="current-badge">Current</span>}
              </div>
              
              <div className="area-data">
                <input
                  type="text"
                  placeholder="M:SS.ms"
                  value={area.time}
                  onChange={(e) => handleAreaUpdate(index, 'time', e.target.value)}
                  className="time-input"
                />
                
                {/* Remove checkboxes - not needed for AKC Scent Work */}
              </div>
            </div>
          ))}
        </div>
        
        {/* Total Time Display */}
        <div className="total-time-section">
          <h3>Total Search Time: {calculateTotalTime()}</h3>
          <p>Sum of all area search times (used for placements)</p>
        </div>
        
        {/* Qualifying Section */}
        <div className="qualifying-section">
          <label>Result</label>
          <div className="qualifying-buttons">
            <button
              className={`qual-button ${qualifying === 'Q' ? 'active' : ''}`}
              onClick={() => setQualifying('Q')}
            >
              Qualified
            </button>
            <button
              className={`qual-button ${qualifying === 'NQ' ? 'active' : ''}`}
              onClick={() => setQualifying('NQ')}
            >
              NQ
            </button>
            <button
              className={`qual-button ${qualifying === 'E' ? 'active' : ''}`}
              onClick={() => setQualifying('E')}
            >
              Absent
            </button>
            <button
              className={`qual-button ${qualifying === 'EX' ? 'active' : ''}`}
              onClick={() => setQualifying('EX')}
            >
              Excused
            </button>
            <button
              className={`qual-button ${qualifying === 'DQ' ? 'active' : ''}`}
              onClick={() => setQualifying('DQ')}
            >
              Withdrawn
            </button>
          </div>
        </div>
        
        {/* Faults Section - Only show when Q is selected */}
        {qualifying === 'Q' && (
          <div className="faults-section">
            <label>Faults</label>
            <div className="fault-counter">
              <div className="fault-controls">
                <button 
                  className="fault-button decrease"
                  onClick={() => setFaultCount(Math.max(0, faultCount - 1))}
                  disabled={faultCount === 0}
                >
                  -
                </button>
                <span className="fault-count">{faultCount}</span>
                <button 
                  className="fault-button increase"
                  onClick={() => setFaultCount(faultCount + 1)}
                >
                  +
                </button>
              </div>
              <span className="fault-label">Total Faults</span>
            </div>
          </div>
        )}
        
        {/* Reason Section - Only show when not Qualified */}
        {qualifying !== 'Q' && (
          <div className="reason-section">
            <label htmlFor="reason">
              {qualifying === 'NQ' ? 'Non-Qualifying Reason' : 
               qualifying === 'E' ? 'Absence Reason' :
               qualifying === 'EX' ? 'Excuse Reason' :
               'Withdrawal Reason'}
            </label>
            <textarea
              id="reason"
              value={nonQualifyingReason}
              onChange={(e) => setNonQualifyingReason(e.target.value)}
              placeholder={`Enter reason for ${qualifying}...`}
              rows={3}
            />
          </div>
        )}
        
        <div className="compact-actions">
          <button
            className="submit-button primary"
            onClick={handleSubmit}
            disabled={!allAreasScored || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </button>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h2>Confirm Score</h2>
            <div className="confirmation-details">
              <p><strong>Dog:</strong> {currentEntry.callName} (#{currentEntry.armband})</p>
              <p><strong>Total Time:</strong> {totalTime}</p>
              <p><strong>Result:</strong> {qualifying}</p>
              {areas.filter(a => a.found).map((area, index) => (
                <p key={index}>
                  <strong>{area.areaName}:</strong> {area.time} 
                  {area.correct ? ' ✓' : ' ✗'}
                </p>
              ))}
              {nonQualifyingReason && (
                <p><strong>Reason:</strong> {nonQualifyingReason}</p>
              )}
            </div>
            <div className="confirmation-buttons">
              <button onClick={() => setShowConfirmation(false)}>Cancel</button>
              <button onClick={confirmSubmit} className="confirm-button">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};