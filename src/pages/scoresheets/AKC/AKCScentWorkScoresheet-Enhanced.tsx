/**
 * Enhanced AKC Scent Work Scoresheet with Nationals Support
 *
 * This enhances the existing scoresheet to support AKC Nationals mode:
 * - Point counter components for Nationals scoring
 * - Different qualifying results (no NQ in Nationals)
 * - Dual storage: tbl_entry_queue + nationals_scores
 * - Maintains compatibility with regular shows
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScoringStore, useEntryStore, useOfflineQueueStore } from '../../../stores';
import { getClassEntries, submitScore, markInRing } from '../../../services/entryService';
import { useAuth } from '../../../contexts/AuthContext';
import { NationalsPointCounter, CompactPointCounter } from '../../../components/scoring/NationalsPointCounter';
import { nationalsScoring } from '../../../services/nationalsScoring';
import '../BaseScoresheet.css';
import './AKCScentWorkScoresheet.css';

import { QualifyingResult } from '../../../stores/scoringStore';

interface AreaScore {
  areaName: string;
  time: string;
  found: boolean;
  correct: boolean;
}

// Nationals-specific qualifying results
type NationalsResult = 'Qualified' | 'Excused' | 'Withdrawn' | 'Eliminated';
type _RegularResult = QualifyingResult;

export const AKCScentWorkScoresheetEnhanced: React.FC = () => {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();
  const { showContext } = useAuth();

  // Store hooks
  const {
    isScoring,
    startScoringSession,
    submitScore: addScoreToSession,
    moveToNextEntry,
    moveToPreviousEntry, // eslint-disable-line @typescript-eslint/no-unused-vars
    endScoringSession
  } = useScoringStore();

  const {
    currentClassEntries, // eslint-disable-line @typescript-eslint/no-unused-vars
    currentEntry,
    setEntries,
    setCurrentClassEntries,
    setCurrentEntry,
    markAsScored,
    getPendingEntries
  } = useEntryStore();

  // Detect if this is Nationals mode (moved after currentEntry is available)
  const isNationalsMode = currentEntry?.competitionType === 'AKC_SCENT_WORK_NATIONAL' ||
                         currentEntry?.className?.toLowerCase().includes('national') ||
                         showContext?.showType?.toLowerCase().includes('national');

  const { addToQueue, isOnline } = useOfflineQueueStore();

  // Nationals-specific state
  const [alertsCorrect, setAlertsCorrect] = useState(0);
  const [alertsIncorrect, setAlertsIncorrect] = useState(0);
  const [finishCallErrors, setFinishCallErrors] = useState(0);
  const [isExcused, setIsExcused] = useState(false);

  // Regular scoresheet state
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingResult | NationalsResult | ''>('');
  const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
  const [totalTime, setTotalTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [faultCount, setFaultCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Timer state (existing from original)
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchInterval, setStopwatchInterval] = useState<NodeJS.Timeout | null>(null);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);

  // Refs to capture current values for cleanup
  const currentEntryRef = useRef(currentEntry);
  const stopwatchIntervalRef = useRef(stopwatchInterval);

  // Update refs when values change
  useEffect(() => {
    currentEntryRef.current = currentEntry;
  }, [currentEntry]);

  useEffect(() => {
    stopwatchIntervalRef.current = stopwatchInterval;
  }, [stopwatchInterval]);

  // Initialize areas based on element and level (existing logic)
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
        return [
          { areaName: 'Handler Discrimination', time: '', found: false, correct: false }
        ];
      }
    } else {
      return [
        { areaName: element || 'Search Area', time: '', found: false, correct: false }
      ];
    }
  };

  // Calculate Nationals points in real-time
  const calculateNationalsPoints = () => {
    if (isExcused) return 0;

    const correctPoints = alertsCorrect * 10;
    const incorrectPenalty = alertsIncorrect * 5;
    const faultPenalty = faultCount * 2;
    const finishErrorPenalty = finishCallErrors * 5;

    return correctPoints - incorrectPenalty - faultPenalty - finishErrorPenalty;
  };

  // Auto-calculate areas based on alerts for Nationals
  useEffect(() => {
    if (isNationalsMode && areas.length > 0) {
      const updatedAreas = areas.map((area, index) => {
        const correctForThisArea = index < alertsCorrect;
        const incorrectForThisArea = index < alertsIncorrect && index >= alertsCorrect;

        return {
          ...area,
          found: correctForThisArea || incorrectForThisArea,
          correct: correctForThisArea
        };
      });

      setAreas(updatedAreas);
    }
  }, [alertsCorrect, alertsIncorrect, isNationalsMode]);

  // Get qualifying options based on mode
  const getQualifyingOptions = () => {
    if (isNationalsMode) {
      // Nationals: No NQ, mainly Qualified/Excused
      return [
        { value: 'Qualified', label: 'Qualified' },
        { value: 'Excused', label: 'Excused' },
        { value: 'Withdrawn', label: 'Withdrawn' },
        { value: 'Eliminated', label: 'Eliminated' }
      ];
    } else {
      // Regular shows
      return [
        { value: 'Q', label: 'Qualified' },
        { value: 'NQ', label: 'Not Qualified' },
        { value: 'EX', label: 'Excused' },
        { value: 'WD', label: 'Withdrawn' },
        { value: 'DQ', label: 'Disqualified' },
        { value: 'ABS', label: 'Absent' }
      ];
    }
  };

  // Enhanced submit handler for dual storage
  const handleEnhancedSubmit = async () => {
    if (!currentEntry) return;

    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      // Regular scoresheet submission (existing logic)
      const finalQualifying = qualifying || (isNationalsMode ? 'Qualified' : 'NQ');
      const finalResultText = finalQualifying;
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
        nonQualifyingReason: finalQualifying !== 'Q' && finalQualifying !== 'Qualified' ? nonQualifyingReason : undefined,
        // Nationals-specific fields
        correctCount: alertsCorrect,
        incorrectCount: alertsIncorrect,
        faultCount: faultCount,
        finishCallErrors: finishCallErrors
      };

      // Add to scoring session
      addScoreToSession(scoreData);
      markAsScored(currentEntry.id, finalQualifying);

      // Submit to regular database
      if (isOnline) {
        await submitScore(currentEntry.id, {
          resultText: finalResultText,
          searchTime: finalTotalTime,
          nonQualifyingReason: finalQualifying !== 'Qualified' && finalQualifying !== 'Q' ? nonQualifyingReason : undefined,
          correctCount: alertsCorrect,
          incorrectCount: alertsIncorrect,
          faultCount: faultCount
        });
      } else {
        addToQueue({
          entryId: currentEntry.id,
          armband: currentEntry.armband,
          classId: parseInt(classId!),
          className: currentEntry.className,
          scoreData: {
            resultText: finalResultText,
            searchTime: finalTotalTime,
            nonQualifyingReason: finalQualifying !== 'Qualified' && finalQualifying !== 'Q' ? nonQualifyingReason : undefined,
            areas: areaResults,
            correctCount: alertsCorrect,
            incorrectCount: alertsIncorrect,
            faultCount: faultCount
          }
        });
      }

      // NATIONALS: Also submit to nationals_scores table for TV dashboard
      if (isNationalsMode && showContext?.licenseKey) {
        try {
          const timeInSeconds = convertTimeToSeconds(finalTotalTime || '0');
          const elementType = mapElementToNationalsType(currentEntry.element || '');
          const day = getCurrentDay(); // You'll need to implement this

          await nationalsScoring.submitScore({
            entry_id: currentEntry.id,
            armband: currentEntry.armband.toString(),
            element_type: elementType,
            day: day,
            alerts_correct: alertsCorrect,
            alerts_incorrect: alertsIncorrect,
            faults: faultCount,
            finish_call_errors: finishCallErrors,
            time_seconds: timeInSeconds,
            excused: isExcused || finalQualifying === 'Excused',
            notes: nonQualifyingReason
          });

          console.log('✅ Nationals score submitted to TV dashboard');
        } catch (nationalsError) {
          console.error('❌ Failed to submit Nationals score:', nationalsError);
          // Don't fail the whole submission - regular score still saved
        }
      }

      // Move to next entry or finish
      const pendingEntries = getPendingEntries();
      if (pendingEntries.length > 0) {
        setCurrentEntry(pendingEntries[0]);
        moveToNextEntry();
        resetForm(pendingEntries[0]);
      } else {
        endScoringSession();
        navigate(-1);
      }

    } catch (error) {
      console.error('Error submitting score:', error);
      alert(`Failed to submit score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const convertTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return Math.round(minutes * 60 + seconds);
    }
    return Math.round(parseFloat(timeString) || 0);
  };

  const mapElementToNationalsType = (element: string) => {
    const elementLower = element?.toLowerCase() || '';
    if (elementLower.includes('container')) return 'CONTAINER';
    if (elementLower.includes('buried')) return 'BURIED';
    if (elementLower.includes('interior')) return 'INTERIOR';
    if (elementLower.includes('exterior')) return 'EXTERIOR';
    if (elementLower.includes('handler') || elementLower.includes('discrimination')) return 'HD_CHALLENGE';
    return 'CONTAINER'; // Default
  };

  const getCurrentDay = (): 1 | 2 | 3 => {
    // This should be determined by your trial/class data
    // For now, return 1 as default
    return 1;
  };

  const resetForm = (entry?: any) => {
    const nextEntryAreas = initializeAreas(entry?.element || '', entry?.level || '');
    setAreas(nextEntryAreas);
    setQualifying('');
    setNonQualifyingReason('');
    setFaultCount(0);
    setTotalTime('');

    // Reset Nationals-specific fields
    setAlertsCorrect(0);
    setAlertsIncorrect(0);
    setFinishCallErrors(0);
    setIsExcused(false);
  };

  const calculateTotalTime = (): string => {
    const validTimes = areas.filter(area => area.time && area.time !== '').map(area => area.time);
    if (validTimes.length === 0) return '0.00';

    // For multi-area, sum the times; for single area, use that time
    if (validTimes.length === 1) {
      return validTimes[0];
    }

    // Sum multiple areas (simplified - you may want more complex logic)
    const totalSeconds = validTimes.reduce((sum, time) => {
      const parts = time.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        return sum + (minutes * 60 + seconds);
      }
      return sum + (parseFloat(time) || 0);
    }, 0);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  // Timer functions (existing logic - keeping for compatibility)
  const formatStopwatchTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

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

    const formattedTime = formatStopwatchTime(stopwatchTime);
    if (currentAreaIndex < areas.length) {
      handleAreaUpdate(currentAreaIndex, 'time', formattedTime);
      if (currentAreaIndex < areas.length - 1) {
        setCurrentAreaIndex(prev => prev + 1);
        resetStopwatch();
      }
    }
  };

  const resetStopwatch = () => {
    setStopwatchTime(0);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    setIsStopwatchRunning(false);
  };

  const handleAreaUpdate = (index: number, field: keyof AreaScore, value: any) => {
    setAreas(prev => prev.map((area, i) =>
      i === index ? { ...area, [field]: value } : area
    ));
  };

  // Load entries on mount (existing logic)
  useEffect(() => {
    if (classId && showContext?.licenseKey) {
      loadEntries();
    }
  }, [classId, entryId, showContext]);

  const loadEntries = async () => {
    if (!classId || !showContext?.licenseKey) return;

    try {
      const entries = await getClassEntries(parseInt(classId), showContext.licenseKey);
      setEntries(entries);
      setCurrentClassEntries(parseInt(classId));

      if (entryId) {
        const targetEntry = entries.find(e => e.id === parseInt(entryId));
        if (targetEntry) {
          setCurrentEntry(targetEntry);
          await markInRing(targetEntry.id, true);
          const initialAreas = initializeAreas(targetEntry.element || '', targetEntry.level || '');
          setAreas(initialAreas);
        }
      } else if (entries.length > 0) {
        setCurrentEntry(entries[0]);
        await markInRing(entries[0].id, true);
        const initialAreas = initializeAreas(entries[0].element || '', entries[0].level || '');
        setAreas(initialAreas);
      }

      // Start scoring session
      if (!isScoring && entries.length > 0) {
        startScoringSession(
          parseInt(classId),
          entries[0].className || 'AKC Scent Work',
          isNationalsMode ? 'AKC_SCENT_WORK_NATIONAL' : 'AKC_SCENT_WORK',
          'judge-1',
          entries.length
        );
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  // Show loading or error state
  if (!currentEntry) {
    return (
      <div className="mobile-scoresheet error-state">
        <header className="mobile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1>AKC Scent Work</h1>
        </header>
        <div className="error-message">
          <h2>No Entry Found</h2>
          <p>Please return to the class list and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-scoresheet" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Header */}
      <header className="mobile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>
          {isNationalsMode ? '🏆 AKC Nationals' : 'AKC Scent Work'}
        </h1>
        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Dog & Trial Info */}
      <div className="dog-info-compact">
        <div className="armband">#{currentEntry.armband}</div>
        <div className="dog-details">
          <div className="dog-name">{currentEntry.callName}</div>
          <div className="dog-breed">{currentEntry.breed}</div>
          <div className="dog-handler">Handler: {currentEntry.handler}</div>
        </div>
        <div className="trial-details">
          <div className="class-info">{currentEntry.element} {currentEntry.level}</div>
          <div className="class-info">{currentEntry.section !== '-' ? `Section ${currentEntry.section}` : ''}</div>
          {isNationalsMode && <div className="class-info nationals-badge">🏆 NATIONALS</div>}
        </div>
      </div>

      {/* Nationals Point Counter */}
      {isNationalsMode && (
        <div className="nationals-section">
          <NationalsPointCounter
            alertsCorrect={alertsCorrect}
            alertsIncorrect={alertsIncorrect}
            faults={faultCount}
            finishCallErrors={finishCallErrors}
            excused={isExcused}
          />

          {/* Nationals Scoring Controls */}
          <div className="nationals-controls">
            <div className="control-group">
              <label>Correct Alerts</label>
              <div className="counter-controls">
                <button onClick={() => setAlertsCorrect(Math.max(0, alertsCorrect - 1))}>-</button>
                <span className="counter-value">{alertsCorrect}</span>
                <button onClick={() => setAlertsCorrect(alertsCorrect + 1)}>+</button>
              </div>
            </div>

            <div className="control-group">
              <label>Incorrect Alerts</label>
              <div className="counter-controls">
                <button onClick={() => setAlertsIncorrect(Math.max(0, alertsIncorrect - 1))}>-</button>
                <span className="counter-value">{alertsIncorrect}</span>
                <button onClick={() => setAlertsIncorrect(alertsIncorrect + 1)}>+</button>
              </div>
            </div>

            <div className="control-group">
              <label>Faults</label>
              <div className="counter-controls">
                <button onClick={() => setFaultCount(Math.max(0, faultCount - 1))}>-</button>
                <span className="counter-value">{faultCount}</span>
                <button onClick={() => setFaultCount(faultCount + 1)}>+</button>
              </div>
            </div>

            <div className="control-group">
              <label>Finish Errors</label>
              <div className="counter-controls">
                <button onClick={() => setFinishCallErrors(Math.max(0, finishCallErrors - 1))}>-</button>
                <span className="counter-value">{finishCallErrors}</span>
                <button onClick={() => setFinishCallErrors(finishCallErrors + 1)}>+</button>
              </div>
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={isExcused}
                  onChange={(e) => setIsExcused(e.target.checked)}
                />
                Dog Excused
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Timer Section (existing) */}
      <div className="timer-section">
        <div className="timer-display">
          <div className="timer-time">
            {formatStopwatchTime(stopwatchTime)}
          </div>
          <div className="timer-controls">
            <button className="timer-btn-secondary" onClick={resetStopwatch}>⟲</button>
            <button
              className={`timer-btn-main ${isStopwatchRunning ? 'stop' : 'start'}`}
              onClick={isStopwatchRunning ? stopStopwatch : startStopwatch}
            >
              {isStopwatchRunning ? '⏸ Stop' : '▶ Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Areas Section (existing with modifications for Nationals) */}
      <div className="areas-section">
        {areas.map((area, index) => (
          <div key={index} className={`area-card ${index === currentAreaIndex ? 'active' : ''}`}>
            <div className="area-header">
              <h3>{area.areaName}</h3>
              {isNationalsMode && (
                <div className="area-status">
                  {area.correct && <span className="status-correct">✓ CORRECT</span>}
                  {area.found && !area.correct && <span className="status-incorrect">✗ INCORRECT</span>}
                  {!area.found && <span className="status-not-found">NOT FOUND</span>}
                </div>
              )}
            </div>

            <div className="area-inputs">
              <div className="time-input-group">
                <label>Time</label>
                <input
                  type="text"
                  value={area.time}
                  onChange={(e) => handleAreaUpdate(index, 'time', e.target.value)}
                  placeholder="0:00.00"
                />
              </div>

              {!isNationalsMode && (
                <>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={area.found}
                        onChange={(e) => handleAreaUpdate(index, 'found', e.target.checked)}
                      />
                      Found
                    </label>
                  </div>

                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={area.correct}
                        onChange={(e) => handleAreaUpdate(index, 'correct', e.target.checked)}
                        disabled={!area.found}
                      />
                      Correct
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Results Section */}
      <div className="results-section">
        <div className="qualifying-section">
          <label>Result</label>
          <select
            value={qualifying || ''}
            onChange={(e) => setQualifying(e.target.value as any)}
          >
            <option value="">Select Result</option>
            {getQualifyingOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {(qualifying === 'NQ' || qualifying === 'Excused' || qualifying === 'Withdrawn' || qualifying === 'Eliminated') && (
          <div className="reason-section">
            <label>Reason (optional)</label>
            <input
              type="text"
              value={nonQualifyingReason}
              onChange={(e) => setNonQualifyingReason(e.target.value)}
              placeholder="Enter reason..."
            />
          </div>
        )}

        <div className="total-time-section">
          <label>Total Time</label>
          <input
            type="text"
            value={totalTime}
            onChange={(e) => setTotalTime(e.target.value)}
            placeholder="Auto-calculated"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="submit-section">
        <button
          className="submit-btn"
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting || !qualifying}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Score'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Score</h3>

            {isNationalsMode && (
              <div className="nationals-summary">
                <CompactPointCounter
                  alertsCorrect={alertsCorrect}
                  alertsIncorrect={alertsIncorrect}
                  faults={faultCount}
                  finishCallErrors={finishCallErrors}
                  excused={isExcused}
                />
              </div>
            )}

            <div className="score-summary">
              <p><strong>Dog:</strong> {currentEntry.callName} (#{currentEntry.armband})</p>
              <p><strong>Result:</strong> {qualifying}</p>
              <p><strong>Time:</strong> {totalTime || calculateTotalTime()}</p>
              {isNationalsMode && (
                <p><strong>Points:</strong> {calculateNationalsPoints()}</p>
              )}
              {nonQualifyingReason && <p><strong>Reason:</strong> {nonQualifyingReason}</p>}
            </div>

            <div className="modal-buttons">
              <button onClick={() => setShowConfirmation(false)}>Cancel</button>
              <button onClick={handleEnhancedSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};