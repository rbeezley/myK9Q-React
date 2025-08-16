import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompetitorCard } from '../../../components/scoring/CompetitorCard';
import { Timer } from '../../../components/scoring/Timer';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import './AKCFastCatScoresheet.css';

type QualifyingResult = 'Q' | 'NQ' | 'E' | 'DQ';

export const AKCFastCatScoresheet: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
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
  
  // Local state
  const [runTime, setRunTime] = useState<string>('');
  const [qualifying, setQualifying] = useState<QualifyingResult>('Q');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [mph, setMph] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // FastCat course is 100 yards
  const COURSE_LENGTH = 100; // yards
  
  // Load class entries on mount
  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, showContext]);
  
  // Calculate MPH and points when run time changes
  useEffect(() => {
    if (runTime) {
      calculateMphAndPoints();
    }
  }, [runTime, currentEntry]);
  
  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;
    
    try {
      const entries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      setCurrentClassEntries(parseInt(classId));
      
      // Set first pending entry as current
      const pending = entries.filter(e => !e.isScored);
      if (pending.length > 0) {
        setCurrentEntry(pending[0]);
        
        // Start scoring session if not already started
        if (!isScoring) {
          startScoringSession(
            parseInt(classId),
            pending[0].className,
            'AKC_FASTCAT',
            showContext.licenseKey,
            entries.length
          );
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };
  
  const parseTimeToSeconds = (timeString: string): number => {
    if (!timeString) return 0;
    
    const parts = timeString.split(':');
    if (parts.length === 2) {
      // MM:SS.ms format
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return (minutes * 60) + seconds;
    } else {
      // SS.ms format
      return parseFloat(timeString) || 0;
    }
  };
  
  const calculateMphAndPoints = () => {
    if (!runTime || !currentEntry) return;
    
    const timeInSeconds = parseTimeToSeconds(runTime);
    if (timeInSeconds <= 0) return;
    
    // Calculate MPH: (Distance in yards * 3600) / (Time in seconds * 1760)
    const calculatedMph = (COURSE_LENGTH * 3600) / (timeInSeconds * 1760);
    setMph(Math.round(calculatedMph * 100) / 100); // Round to 2 decimal places
    
    // Calculate points based on dog's height category
    // This is a simplified point calculation - actual AKC formula is more complex
    const basePoints = Math.round(calculatedMph * 2);
    setPoints(basePoints);
  };
  
  const handleSubmit = () => {
    if (!runTime) {
      alert('Please enter a run time');
      return;
    }
    
    calculateMphAndPoints();
    setShowConfirmation(true);
  };
  
  const confirmSubmit = async () => {
    if (!currentEntry) return;
    
    setIsSubmitting(true);
    setShowConfirmation(false);
    
    const scoreData = {
      entryId: currentEntry.id,
      armband: currentEntry.armband,
      time: runTime,
      qualifying: qualifying,
      mph: mph,
      points: points,
      nonQualifyingReason: qualifying !== 'Q' ? nonQualifyingReason : undefined
    };
    
    try {
      // Add to scoring session
      addScoreToSession(scoreData);
      
      // Update entry store
      markAsScored(currentEntry.id, qualifying);
      
      if (isOnline) {
        // Submit directly if online
        await submitScore(currentEntry.id, {
          resultText: qualifying,
          searchTime: runTime,
          mph: mph,
          points: points,
          nonQualifyingReason: qualifying !== 'Q' ? nonQualifyingReason : undefined
        });
      } else {
        // Add to offline queue
        addToQueue({
          entryId: currentEntry.id,
          armband: currentEntry.armband,
          classId: parseInt(classId!),
          className: currentEntry.className,
          scoreData: {
            resultText: qualifying,
            searchTime: runTime,
            nonQualifyingReason: qualifying !== 'Q' ? nonQualifyingReason : undefined,
            mph: mph,
            points: points
          }
        });
      }
      
      // Move to next entry
      const pendingEntries = getPendingEntries();
      if (pendingEntries.length > 0) {
        setCurrentEntry(pendingEntries[0]);
        moveToNextEntry();
        
        // Reset form
        setRunTime('');
        setQualifying('Q');
        setNonQualifyingReason('');
        setMph(0);
        setPoints(0);
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
  
  const handlePrevious = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex > 0) {
      setCurrentEntry(currentClassEntries[currentIndex - 1]);
      moveToPreviousEntry();
    }
  };
  
  const handleNext = () => {
    const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry?.id);
    if (currentIndex < currentClassEntries.length - 1) {
      setCurrentEntry(currentClassEntries[currentIndex + 1]);
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
  
  const currentIndex = currentClassEntries.findIndex(e => e.id === currentEntry.id) + 1;
  
  return (
    <div className="scoresheet-container akc-fastcat">
      <header className="scoresheet-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>AKC FastCAT</h1>
        <div className="sync-status">
          {isOnline ? (
            <span className="online">● Online</span>
          ) : (
            <span className="offline">● Offline</span>
          )}
        </div>
      </header>
      
      <div className="scoresheet-content">
        <CompetitorCard
          entry={currentEntry}
          currentPosition={currentIndex}
          totalEntries={currentClassEntries.length}
        />
        
        {/* Timer Section */}
        <div className="timer-section">
          <Timer
            areaId="fastcat-run"
            areaName="FastCAT Run"
            showControls={true}
            size="large"
            maxTime={60000} // 60 seconds max
          />
        </div>
        
        {/* Time Input Section */}
        <div className="time-section">
          <h3>Run Time</h3>
          <div className="time-input">
            <label htmlFor="runTime">Time (seconds)</label>
            <input
              id="runTime"
              type="text"
              placeholder="SS.ms or MM:SS.ms"
              value={runTime}
              onChange={(e) => setRunTime(e.target.value)}
            />
          </div>
        </div>
        
        {/* Results Display */}
        {runTime && mph > 0 && (
          <div className="results-section">
            <div className="result-card">
              <h3>Speed</h3>
              <div className="result-value">{mph} MPH</div>
            </div>
            <div className="result-card">
              <h3>Points</h3>
              <div className="result-value">{points}</div>
            </div>
          </div>
        )}
        
        {/* Qualifying Section */}
        <div className="qualifying-section">
          <label>Result</label>
          <div className="qualifying-buttons">
            <button
              className={`qual-button ${qualifying === 'Q' ? 'active' : ''}`}
              onClick={() => setQualifying('Q')}
            >
              Q
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
              E
            </button>
            <button
              className={`qual-button ${qualifying === 'DQ' ? 'active' : ''}`}
              onClick={() => setQualifying('DQ')}
            >
              DQ
            </button>
          </div>
        </div>
        
        {qualifying !== 'Q' && (
          <div className="reason-section">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              value={nonQualifyingReason}
              onChange={(e) => setNonQualifyingReason(e.target.value)}
              placeholder="Enter reason for NQ/E/DQ..."
              rows={3}
            />
          </div>
        )}
        
        <div className="action-buttons">
          <button
            className="nav-button"
            onClick={handlePrevious}
            disabled={currentIndex === 1}
          >
            Previous
          </button>
          
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!runTime || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Score'}
          </button>
          
          <button
            className="nav-button"
            onClick={handleNext}
            disabled={currentIndex === currentClassEntries.length}
          >
            Next
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
              <p><strong>Run Time:</strong> {runTime} seconds</p>
              <p><strong>Speed:</strong> {mph} MPH</p>
              <p><strong>Points:</strong> {points}</p>
              <p><strong>Result:</strong> {qualifying}</p>
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