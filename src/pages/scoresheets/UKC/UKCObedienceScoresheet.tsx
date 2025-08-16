import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CompetitorCard } from '../../../components/scoring/CompetitorCard';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import './UKCObedienceScoresheet.css';

type QualifyingResult = 'Q' | 'NQ' | 'EX' | 'DQ';

export const UKCObedienceScoresheet: React.FC = () => {
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
  const [points, setPoints] = useState<string>('');
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
            'UKC_OBEDIENCE',
            showContext.licenseKey,
            entries.length
          );
        }
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };
  
  const handlePointsChange = (value: string) => {
    // Allow only numbers and one decimal point
    const regex = /^\d{0,3}(\.\d{0,1})?$/;
    if (regex.test(value) || value === '') {
      setPoints(value);
    }
  };
  
  const calculateQualifying = (score: number): QualifyingResult => {
    // UKC Obedience qualifying scores (example thresholds)
    if (score >= 170) return 'Q';
    return 'NQ';
  };
  
  const handleSubmit = () => {
    if (!currentEntry || !points) return;
    setShowConfirmation(true);
  };
  
  const confirmSubmit = async () => {
    if (!currentEntry || !points) return;
    
    setIsSubmitting(true);
    setShowConfirmation(false);
    
    const scoreValue = parseFloat(points);
    const finalQualifying = qualifying === 'Q' ? calculateQualifying(scoreValue) : qualifying;
    
    const scoreData = {
      entryId: currentEntry.id,
      armband: currentEntry.armband,
      points: scoreValue,
      qualifying: finalQualifying,
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
          points: scoreValue,
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
            points: scoreValue,
            nonQualifyingReason: finalQualifying !== 'Q' ? nonQualifyingReason : undefined
          }
        });
      }
      
      // Move to next entry
      const pendingEntries = getPendingEntries();
      if (pendingEntries.length > 0) {
        setCurrentEntry(pendingEntries[0]);
        moveToNextEntry();
        
        // Reset form
        setPoints('');
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
  
  return (
    <div className="scoresheet-container ukc-obedience">
      <header className="scoresheet-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>UKC Obedience</h1>
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
        
        <div className="scoring-form">
          <div className="score-input-section">
            <label htmlFor="points">Score Points</label>
            <input
              id="points"
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={points}
              onChange={(e) => handlePointsChange(e.target.value)}
              className="points-input"
              autoFocus
            />
            <span className="max-points">out of 200.0</span>
          </div>
          
          <div className="qualifying-section">
            <label>Qualifying Result</label>
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
                className={`qual-button ${qualifying === 'EX' ? 'active' : ''}`}
                onClick={() => setQualifying('EX')}
              >
                EX
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
              <label htmlFor="reason">Non-Qualifying Reason</label>
              <textarea
                id="reason"
                value={nonQualifyingReason}
                onChange={(e) => setNonQualifyingReason(e.target.value)}
                placeholder="Enter reason for NQ/EX/DQ..."
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
              disabled={!points || isSubmitting}
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
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h2>Confirm Score</h2>
            <div className="confirmation-details">
              <p><strong>Dog:</strong> {currentEntry.callName} (#{currentEntry.armband})</p>
              <p><strong>Score:</strong> {points} / 200.0</p>
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