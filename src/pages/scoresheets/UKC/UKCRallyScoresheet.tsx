import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompetitorCard } from '../../../components/scoring/CompetitorCard';
import { Timer } from '../../../components/scoring/Timer';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import './UKCRallyScoresheet.css';

type QualifyingResult = 'Q' | 'NQ';

export const UKCRallyScoresheet: React.FC = () => {
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
  const [totalScore, setTotalScore] = useState<number>(100); // UKC Rally starts with 100 points
  const [deductions, setDeductions] = useState<number>(0);
  const [courseTime, setCourseTime] = useState<string>(''); // Time for tiebreaker
  const [qualifying, setQualifying] = useState<QualifyingResult>('Q');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Load class entries on mount
  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, showContext]);
  
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
            'UKC_RALLY',
            showContext.licenseKey,
            entries.length
          );
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };
  
  const calculateFinalScore = () => {
    return Math.max(0, totalScore - deductions);
  };
  
  const calculateQualifying = (): QualifyingResult => {
    const finalScore = calculateFinalScore();
    // UKC Rally requires 70+ points to qualify (70% of 100)
    return finalScore >= 70 ? 'Q' : 'NQ';
  };
  
  const handleSubmit = () => {
    const calculatedQualifying = calculateQualifying();
    setQualifying(calculatedQualifying);
    setShowConfirmation(true);
  };
  
  const confirmSubmit = async () => {
    if (!currentEntry) return;
    
    setIsSubmitting(true);
    setShowConfirmation(false);
    
    const finalScore = calculateFinalScore();
    const finalQualifying = calculateQualifying();
    
    const scoreData = {
      entryId: currentEntry.id,
      armband: currentEntry.armband,
      score: finalScore,
      time: courseTime,
      qualifying: finalQualifying,
      deductions: deductions,
      nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined
    };
    
    try {
      // Add to scoring session
      addScoreToSession(scoreData);
      
      // Update entry store
      markAsScored(currentEntry.id, finalQualifying);
      
      if (isOnline) {
        // Submit directly if online
        await submitScore(currentEntry.id, {
          resultText: finalQualifying,
          searchTime: courseTime,
          score: finalScore,
          deductions: deductions,
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
            resultText: finalQualifying,
            searchTime: courseTime,
            nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined,
            score: finalScore,
            deductions: deductions
          }
        });
      }
      
      // Move to next entry
      const pendingEntries = getPendingEntries();
      if (pendingEntries.length > 0) {
        setCurrentEntry(pendingEntries[0]);
        moveToNextEntry();
        
        // Reset form
        setTotalScore(100);
        setDeductions(0);
        setCourseTime('');
        setQualifying('Q');
        setNonQualifyingReason('');
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
  const finalScore = calculateFinalScore();
  const calculatedQualifying = calculateQualifying();
  
  return (
    <div className="scoresheet-container ukc-rally">
      <header className="scoresheet-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>UKC Rally</h1>
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
            areaId="rally-course"
            areaName="Rally Course"
            showControls={true}
            size="large"
            maxTime={5 * 60 * 1000} // 5 minutes max
          />
        </div>
        
        {/* Score Input Section */}
        <div className="score-section">
          <h3>Rally Scoring</h3>
          
          <div className="score-inputs">
            <div className="score-input">
              <label htmlFor="totalScore">Starting Score</label>
              <input
                id="totalScore"
                type="number"
                value={totalScore}
                onChange={(e) => setTotalScore(parseInt(e.target.value) || 100)}
                min="0"
                max="100"
              />
            </div>
            
            <div className="score-input">
              <label htmlFor="deductions">Deductions</label>
              <input
                id="deductions"
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(parseInt(e.target.value) || 0)}
                min="0"
                max="100"
              />
            </div>
            
            <div className="score-input">
              <label htmlFor="courseTime">Course Time</label>
              <input
                id="courseTime"
                type="text"
                placeholder="M:SS.ms"
                value={courseTime}
                onChange={(e) => setCourseTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="final-score">
            <h3>Final Score: {finalScore}</h3>
            <p className={`qualifying-status ${calculatedQualifying.toLowerCase()}`}>
              {calculatedQualifying === 'Q' ? 'Qualifying' : 'Non-Qualifying'} 
              ({calculatedQualifying === 'Q' ? '70+ required' : 'Below 70'})
            </p>
            {courseTime && (
              <p className="course-time">Course Time: {courseTime}</p>
            )}
          </div>
        </div>
        
        {/* Qualifying Section */}
        <div className="qualifying-section">
          <label>Final Result</label>
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
          </div>
        </div>
        
        {qualifying !== 'Q' && (
          <div className="reason-section">
            <label htmlFor="reason">Non-Qualifying Reason</label>
            <textarea
              id="reason"
              value={nonQualifyingReason}
              onChange={(e) => setNonQualifyingReason(e.target.value)}
              placeholder="Enter reason for NQ..."
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
            disabled={isSubmitting || !courseTime}
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
              <p><strong>Final Score:</strong> {finalScore}/100</p>
              <p><strong>Course Time:</strong> {courseTime}</p>
              <p><strong>Deductions:</strong> {deductions}</p>
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