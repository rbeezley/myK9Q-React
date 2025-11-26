/**
 * AKC Nationals Scent Work Scoresheet
 *
 * Nationals-only scoresheet with simplified scoring:
 * - Point counter components for Nationals scoring
 * - Qualifying results: Qualified, Absent, Excused (no NQ)
 * - Dual storage: tbl_entry_queue + nationals_scores
 * - Auto-calculated areas based on alerts
 *
 * Refactored to use shared hooks for reduced code duplication.
 * @see docs/SCORESHEET_REFACTORING_PLAN.md
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useAuth } from '../../../contexts/AuthContext';
import { NationalsCounterSimple } from '../../../components/scoring/NationalsCounterSimple';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';
import { HamburgerMenu, SyncIndicator, ArmbandBadge } from '../../../components/ui';
import { DogCard } from '../../../components/DogCard';
import { X, ClipboardCheck } from 'lucide-react';
import { nationalsScoring } from '../../../services/nationalsScoring';
import { formatSecondsToTime } from '../../../utils/timeUtils';
import voiceAnnouncementService from '../../../services/voiceAnnouncementService';
import { parseSmartTime } from '../../../utils/timeInputParsing';

// Shared hooks from refactoring
import { useScoresheetCore, useEntryNavigation } from '../hooks';

import '../BaseScoresheet.css';
import './AKCScentWorkScoresheet-Nationals.css';
import './AKCScentWorkScoresheet-Flutter.css';
import './AKCScentWorkScoresheet-JudgeDialog.css';
import '../../../styles/containers.css';
import '../../../components/wireframes/NationalsWireframe.css';

// Nationals-specific qualifying results
type NationalsQualifyingResult = 'Qualified' | 'Absent' | 'Excused';

export const AKCNationalsScoresheet: React.FC = () => {
  const { showContext } = useAuth();

  // ==========================================================================
  // SHARED HOOKS (from refactoring)
  // ==========================================================================

  // Core scoresheet state management
  const core = useScoresheetCore({
    sportType: 'AKC_SCENT_WORK_NATIONAL',
    isNationals: true
  });

  // Entry navigation and loading
  const navigation = useEntryNavigation({
    classId: core.classId,
    entryId: core.entryId,
    isNationals: true,
    sportType: 'AKC_SCENT_WORK_NATIONAL',
    onEntryLoaded: (entry, areas) => {
      core.setAreas(areas);
    },
    onTrialDateLoaded: core.setTrialDate,
    onTrialNumberLoaded: core.setTrialNumber,
    onLoadingChange: core.setIsLoadingEntry
  });

  // Destructure for convenience
  const {
    areas, setAreas,
    faultCount, setFaultCount,
    isSubmitting,
    showConfirmation, setShowConfirmation,
    isLoadingEntry,
    trialDate, trialNumber,
    isSyncing, hasError,
    calculateTotalTime,
    handleAreaUpdate,
    navigateBackWithRingCleanup,
    CelebrationModal
  } = core;

  const {
    currentEntry,
    getMaxTimeForArea
  } = navigation;

  // ==========================================================================
  // NATIONALS-SPECIFIC STATE
  // ==========================================================================

  const [qualifying, setQualifying] = useState<NationalsQualifyingResult | ''>('');
  const [alertsCorrect, setAlertsCorrect] = useState(0);
  const [alertsIncorrect, setAlertsIncorrect] = useState(0);
  const [finishCallErrors, setFinishCallErrors] = useState(0);
  const [isExcused, setIsExcused] = useState(false);
  const [totalTime, setTotalTime] = useState<string>('');

  // ==========================================================================
  // TIMER STATE (unique to this component)
  // ==========================================================================

  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchInterval, setStopwatchInterval] = useState<NodeJS.Timeout | null>(null);

  // Settings for voice announcements
  const settings = useSettingsStore(state => state.settings);

  // Ref for stopwatch cleanup
  const stopwatchIntervalRef = useRef(stopwatchInterval);

  useEffect(() => {
    stopwatchIntervalRef.current = stopwatchInterval;
  }, [stopwatchInterval]);

  // Cleanup stopwatch on unmount
  useEffect(() => {
    return () => {
      const interval = stopwatchIntervalRef.current;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // ==========================================================================
  // NATIONALS-SPECIFIC CALCULATIONS
  // ==========================================================================

  // Calculate Nationals points in real-time
  const calculateNationalsPoints = useCallback(() => {
    if (isExcused) return 0;

    const correctPoints = alertsCorrect * 10;
    const incorrectPenalty = alertsIncorrect * 5;
    const faultPenalty = faultCount * 2;
    const finishErrorPenalty = finishCallErrors * 5;

    return correctPoints - incorrectPenalty - faultPenalty - finishErrorPenalty;
  }, [isExcused, alertsCorrect, alertsIncorrect, faultCount, finishCallErrors]);

  // Helper function: Convert time string to seconds
  const convertTimeToSeconds = useCallback((timeString: string): number => {
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return Math.round(minutes * 60 + seconds);
    }
    return Math.round(parseFloat(timeString) || 0);
  }, []);

  // Auto-calculate areas based on alerts
  useEffect(() => {
    if (areas.length > 0) {
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
  }, [alertsCorrect, alertsIncorrect]);

  // Handle result change with special handling for Excused
  // Note: State setters from useState are stable, but included to satisfy React Compiler
  const handleResultChange = useCallback((result: NationalsQualifyingResult | '') => {
    setQualifying(result);

    if (result === 'Excused') {
      setIsExcused(true);

      // Nationals: zero points and max search time
      setAlertsCorrect(0);
      setAlertsIncorrect(0);
      setFinishCallErrors(0);
      setFaultCount(0);

      // Set max search time for all areas
      const updatedAreas = areas.map((area, index) => ({
        ...area,
        time: getMaxTimeForArea(index),
        found: false,
        correct: false
      }));
      setAreas(updatedAreas);

      // Set total time to sum of all max times
      const totalMaxTime = updatedAreas.reduce((sum, area) => {
        const timeInSeconds = convertTimeToSeconds(area.time);
        return sum + timeInSeconds;
      }, 0);
      setTotalTime(formatSecondsToTime(totalMaxTime));
    } else {
      setIsExcused(false);
    }
  }, [
    areas, getMaxTimeForArea, convertTimeToSeconds, setAreas, setTotalTime,
    setQualifying, setIsExcused, setAlertsCorrect, setAlertsIncorrect, setFinishCallErrors, setFaultCount
  ]);

  // ==========================================================================
  // NATIONALS-SPECIFIC HELPERS
  // ==========================================================================

  const mapElementToNationalsType = useCallback((element: string) => {
    const elementLower = element?.toLowerCase() || '';
    if (elementLower.includes('container')) return 'CONTAINER';
    if (elementLower.includes('buried')) return 'BURIED';
    if (elementLower.includes('interior')) return 'INTERIOR';
    if (elementLower.includes('exterior')) return 'EXTERIOR';
    if (elementLower.includes('handler') || elementLower.includes('discrimination')) return 'HD_CHALLENGE';
    return 'CONTAINER'; // Default
  }, []);

  const getCurrentDay = useCallback((): 1 | 2 | 3 => {
    // This should be determined by your trial/class data
    // For now, return 1 as default
    return 1;
  }, []);

  // ==========================================================================
  // SUBMIT HANDLER (Nationals-specific with dual submission)
  // ==========================================================================

  const handleEnhancedSubmit = useCallback(async () => {
if (!currentEntry) {
return;
    }

    setShowConfirmation(false);

    // Prepare score data
    const finalQualifying = qualifying || 'Qualified';
    const finalTotalTime = totalTime || calculateTotalTime() || '0.00';

    // Prepare area results
    const areaResults: Record<string, string> = {};
    areas.forEach(area => {
      areaResults[area.areaName.toLowerCase()] = `${area.time}${area.found ? ' FOUND' : ' NOT FOUND'}${area.correct ? ' CORRECT' : ' INCORRECT'}`;
    });

    // Use core's submitScore but with Nationals-specific data
    await core.submitScore(currentEntry, {
      correctCount: alertsCorrect,
      incorrectCount: alertsIncorrect,
      finishCallErrors: finishCallErrors,
      points: calculateNationalsPoints()
    });

    // Also submit to nationals_scores table for TV dashboard
    if (showContext?.licenseKey) {
      try {
        const timeInSeconds = convertTimeToSeconds(finalTotalTime || '0');
        const elementType = mapElementToNationalsType(currentEntry.element || '');
        const day = getCurrentDay();

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
          notes: undefined
        });

} catch (nationalsError) {
        console.error('❌ Failed to submit Nationals score:', nationalsError);
        // Don't fail the whole submission - regular score still saved
      }
    }
  }, [
    currentEntry,
    qualifying,
    totalTime,
    areas,
    alertsCorrect,
    alertsIncorrect,
    finishCallErrors,
    faultCount,
    isExcused,
    showContext?.licenseKey,
    calculateTotalTime,
    calculateNationalsPoints,
    convertTimeToSeconds,
    mapElementToNationalsType,
    getCurrentDay,
    core,
    setShowConfirmation
  ]);

  // ==========================================================================
  // TIMER FUNCTIONS
  // ==========================================================================

  const formatStopwatchTime = (milliseconds: number): string => {
    const totalSeconds = milliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  const getNextEmptyAreaIndex = useCallback((): number => {
    return areas.findIndex(area => !area.time);
  }, [areas]);

  const getRemainingTime = useCallback((): string => {
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return '';

    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    const remainingMs = Math.max(0, maxTimeMs - stopwatchTime);
    const remainingSeconds = remainingMs / 1000;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = (remainingSeconds % 60).toFixed(2);

    return `${mins}:${secs.padStart(5, '0')}`;
  }, [getNextEmptyAreaIndex, getMaxTimeForArea, stopwatchTime]);

  const resetStopwatch = useCallback(() => {
    setStopwatchTime(0);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }
    setIsStopwatchRunning(false);
  }, [stopwatchInterval]);

  const startStopwatch = useCallback(() => {
    setIsStopwatchRunning(true);
    const startTime = Date.now() - stopwatchTime;
    const interval = setInterval(() => {
      const currentTime = Date.now() - startTime;
      setStopwatchTime(currentTime);

      // Auto-stop when time expires
      const activeAreaIndex = areas.findIndex(area => !area.time);
      const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
      const maxTimeStr = getMaxTimeForArea(areaIndex);
      if (maxTimeStr) {
        const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
        const maxTimeMs = (minutes * 60 + seconds) * 1000;

        if (currentTime >= maxTimeMs) {
          setIsStopwatchRunning(false);
          clearInterval(interval);
          setStopwatchInterval(null);
          setStopwatchTime(maxTimeMs);

          if (areas.length === 1) {
            const formattedMaxTime = formatStopwatchTime(maxTimeMs);
            handleAreaUpdate(0, 'time', formattedMaxTime);
          }
        }
      }
    }, 10);
    setStopwatchInterval(interval);
  }, [stopwatchTime, areas, getMaxTimeForArea, handleAreaUpdate]);

  const stopStopwatch = useCallback(() => {
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }

    if (areas.length === 1) {
      const formattedTime = formatStopwatchTime(stopwatchTime);
      handleAreaUpdate(0, 'time', formattedTime);
    }
  }, [stopwatchInterval, areas.length, stopwatchTime, handleAreaUpdate]);

  const recordTimeForArea = useCallback((areaIndex: number) => {
    const formattedTime = formatStopwatchTime(stopwatchTime);
    handleAreaUpdate(areaIndex, 'time', formattedTime);
    resetStopwatch();
  }, [stopwatchTime, handleAreaUpdate, resetStopwatch]);

  // ==========================================================================
  // 30-SECOND WARNING
  // ==========================================================================

  const shouldShow30SecondWarning = useCallback((): boolean => {
    if (!isStopwatchRunning) return false;

    const level = currentEntry?.level?.toLowerCase() || '';
    if (level === 'master' || level === 'masters') return false;

    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return false;

    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    const remainingMs = maxTimeMs - stopwatchTime;
    return remainingMs > 0 && remainingMs <= 30000;
  }, [isStopwatchRunning, currentEntry?.level, getNextEmptyAreaIndex, getMaxTimeForArea, stopwatchTime]);

  const isTimeExpired = useCallback((): boolean => {
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return false;

    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    return stopwatchTime > 0 && stopwatchTime >= maxTimeMs;
  }, [getNextEmptyAreaIndex, getMaxTimeForArea, stopwatchTime]);

  const getTimerWarningMessage = useCallback((): string | null => {
    if (isTimeExpired()) {
      return "Time Expired";
    } else if (shouldShow30SecondWarning()) {
      return "30 Second Warning";
    }
    return null;
  }, [isTimeExpired, shouldShow30SecondWarning]);

  // Voice announcement for 30-second warning
  const has30SecondAnnouncedRef = useRef(false);

  useEffect(() => {
    if (!settings.voiceAnnouncements || !settings.announceTimerCountdown) {
      return;
    }

    if (!isStopwatchRunning) {
      has30SecondAnnouncedRef.current = false;
      return;
    }

    const level = currentEntry?.level?.toLowerCase() || '';
    if (level === 'master' || level === 'masters') return;

    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    if (!maxTimeStr) return;

    const [minutes, seconds] = maxTimeStr.split(':').map(parseFloat);
    const maxTimeMs = (minutes * 60 + seconds) * 1000;

    const remainingMs = maxTimeMs - stopwatchTime;
    const remainingSeconds = Math.floor(remainingMs / 1000);

    if (remainingSeconds <= 30 && remainingSeconds > 29 && !has30SecondAnnouncedRef.current) {
voiceAnnouncementService.announceTimeRemaining(30);
      has30SecondAnnouncedRef.current = true;
    }

    if (remainingSeconds > 30 && has30SecondAnnouncedRef.current) {
      has30SecondAnnouncedRef.current = false;
    }
  }, [stopwatchTime, isStopwatchRunning, settings.voiceAnnouncements, settings.announceTimerCountdown, currentEntry?.level, getNextEmptyAreaIndex, getMaxTimeForArea]);

  // Set scoring active state
  useEffect(() => {
    voiceAnnouncementService.setScoringActive(isStopwatchRunning);

    return () => {
      voiceAnnouncementService.setScoringActive(false);
    };
  }, [isStopwatchRunning]);

  // ==========================================================================
  // LOCAL INPUT HELPERS
  // ==========================================================================

  const clearTimeInput = (index: number) => {
    handleAreaUpdate(index, 'time', '');
  };

  const handleSmartTimeInput = (index: number, rawInput: string) => {
    handleAreaUpdate(index, 'time', rawInput);
  };

  const handleTimeInputBlur = (index: number, rawInput: string) => {
    const parsedTime = parseSmartTime(rawInput);
    handleAreaUpdate(index, 'time', parsedTime);
  };

  const handleNavigateWithRingCleanup = useCallback(async () => {
    await navigateBackWithRingCleanup(currentEntry);
  }, [navigateBackWithRingCleanup, currentEntry]);

  // ==========================================================================
  // CONDITIONAL RENDERING
  // ==========================================================================

  if (isLoadingEntry) {
    return (
      <div className="scoresheet-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!currentEntry) {
    return null;
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
      {CelebrationModal}
      <div className="scoresheet-container">
        <div className="scoresheet">
        {/* Header */}
        <header className="page-header mobile-header">
        <HamburgerMenu
          backNavigation={{
            label: "Back to Entry List",
            action: handleNavigateWithRingCleanup
          }}
          currentPage="entries"
        />
        <div className="header-content">
          <h1>
            <ClipboardCheck className="title-icon" />
            🏆 AKC Nationals
          </h1>
          <div className="header-trial-info">
            <span>{trialDate}</span>
            <span className="trial-separator">•</span>
            <span>Trial {trialNumber}</span>
            <span className="trial-separator">•</span>
            <span>{currentEntry.element} {currentEntry.level}</span>
          </div>
        </div>
      </header>

      {/* Dog Info Card */}
      <div className="scoresheet-dog-info-card">
        <ArmbandBadge number={currentEntry.armband} />
        <div className="scoresheet-dog-details">
          <div className="scoresheet-dog-name">{currentEntry.callName}</div>
          <div className="scoresheet-dog-breed">{currentEntry.breed}</div>
          <div className="scoresheet-dog-handler">Handler: {currentEntry.handler}</div>
        </div>
      </div>

      {/* Timer Section */}
      <div className="scoresheet-timer-card">
        <button
          className="timer-btn-reset"
          onClick={resetStopwatch}
          disabled={isStopwatchRunning}
          title={isStopwatchRunning ? "Reset disabled while timer is running" : "Reset timer"}
        >
          ⟲
        </button>

        <div className={`timer-display-large ${shouldShow30SecondWarning() ? 'warning' : ''} ${isTimeExpired() ? 'expired' : ''}`}>
          {formatStopwatchTime(stopwatchTime)}
        </div>
        <div className="timer-countdown-display">
          {stopwatchTime > 0 ? (
            <>Remaining: {getRemainingTime()}</>
          ) : (
            <>Max Time: {getMaxTimeForArea(getNextEmptyAreaIndex() >= 0 ? getNextEmptyAreaIndex() : 0)}</>
          )}
        </div>
        <div className="timer-controls-flutter">
          {isStopwatchRunning ? (
            <button
              className="timer-btn-start stop"
              onClick={stopStopwatch}
            >
              Stop
            </button>
          ) : stopwatchTime > 0 ? (
            <button
              className="timer-btn-start resume"
              onClick={startStopwatch}
              title="Continue timing"
            >
              Resume
            </button>
          ) : (
            <button
              className="timer-btn-start start"
              onClick={startStopwatch}
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Timer Warning Message */}
      {getTimerWarningMessage() && (
        <div className={`timer-warning ${getTimerWarningMessage() === 'Time Expired' ? 'expired' : 'warning'}`}>
          {getTimerWarningMessage()}
        </div>
      )}

      {/* Time Input */}
      {areas.map((area, index) => (
        <div key={index} className="scoresheet-time-card">
          <div className="time-input-flutter">
            {areas.length > 1 && (
              <>
                {!area.time ? (
                  <button
                    className={`area-record-btn ${getNextEmptyAreaIndex() === index && stopwatchTime > 0 && !isStopwatchRunning ? 'next-in-sequence' : ''}`}
                    onClick={() => recordTimeForArea(index)}
                    title={`Record time from stopwatch for Area ${index + 1}`}
                  >
                    Record Area {index + 1}
                  </button>
                ) : (
                  <div className="area-badge recorded">
                    Area {index + 1}
                  </div>
                )}
              </>
            )}
            <div className="scoresheet-time-input-wrapper">
              <input
                type="text"
                value={area.time || ''}
                onChange={(e) => handleSmartTimeInput(index, e.target.value)}
                onBlur={(e) => handleTimeInputBlur(index, e.target.value)}
                placeholder="Type: 12345 or 1:23.45"
                className={`scoresheet-time-input ${areas.length === 1 ? 'single-area' : ''}`}
              />
              {area.time && (
                <button
                  type="button"
                  className="scoresheet-time-clear-button"
                  onClick={() => clearTimeInput(index)}
                  title="Clear time"
                >
                  <X size={16} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                </button>
              )}
            </div>
            <div className="max-time-display">
              Max: {getMaxTimeForArea(index)}
            </div>
          </div>
        </div>
      ))}

      {/* Results Section */}
      <div className="results-section">
        <ResultChoiceChips
          selectedResult={qualifying as 'Qualified' | 'Absent' | 'Excused' | null}
          onResultChange={(result) => {
            handleResultChange(result as NationalsQualifyingResult);
          }}
          showNQ={false}
          showEX={true}
          onNQClick={() => {}}
          onEXClick={() => {
            handleResultChange('Excused');
          }}
          selectedResultInternal={qualifying || ''}
          faultCount={faultCount}
          onFaultCountChange={setFaultCount}
          nqReason={''}
          onNQReasonChange={() => {}}
          excusedReason={''}
          onExcusedReasonChange={() => {}}
          isNationalsMode={true}
        />
      </div>

      {/* Nationals Counters */}
      <NationalsCounterSimple
        alertsCorrect={alertsCorrect}
        alertsIncorrect={alertsIncorrect}
        faults={faultCount}
        finishCallErrors={finishCallErrors}
        onAlertsCorrectChange={setAlertsCorrect}
        onAlertsIncorrectChange={setAlertsIncorrect}
        onFaultsChange={setFaultCount}
        onFinishCallErrorsChange={setFinishCallErrors}
      />

      {/* Validation message for incomplete Qualified scores */}
      {qualifying === 'Qualified' && !areas.every(area => area.time && area.time !== '') && (
        <div style={{
          padding: '8px 16px',
          marginBottom: '8px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          color: '#92400e',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          ⚠️ All area times must be completed for a Qualified score
        </div>
      )}

      {/* Action Buttons */}
      <div className="scoresheet-actions">
        <button className="scoresheet-btn-cancel" onClick={handleNavigateWithRingCleanup}>
          Cancel
        </button>
        <button
          className="scoresheet-btn-save"
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting || !qualifying || (qualifying === 'Qualified' && !areas.every(area => area.time && area.time !== ''))}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Sync Status Indicators */}
      {(isSyncing || hasError) && (
        <div style={{ textAlign: 'center', marginTop: '-8px', marginBottom: '8px' }}>
          {isSyncing && <SyncIndicator status="syncing" />}
          {hasError && <SyncIndicator status="error" />}
        </div>
      )}

      {/* Judge Confirmation Dialog */}
      {showConfirmation && (
        <div className="judge-confirmation-overlay">
          <div className="judge-confirmation-dialog">
            <div className="dialog-header">
              <h2>Score Confirmation</h2>
              <div className="trial-info-line">
                {trialDate} • Trial {trialNumber} • {currentEntry.element} {currentEntry.level}
              </div>
            </div>

            <div className="dialog-dog-card">
              <DogCard
                armband={currentEntry.armband}
                callName={currentEntry.callName}
                breed={currentEntry.breed}
                handler={currentEntry.handler}
                className="confirmation-dog-card"
              />
            </div>

            <div className="score-details">
              <div className="result-time-grid nationals-mode">
                <div className="score-item">
                  <span className="item-label">Result</span>
                  <span className={`item-value result-${qualifying?.toLowerCase()}`}>
                    {qualifying === 'Qualified' ? 'Qualified' :
                     qualifying === 'Absent' ? 'Absent' :
                     qualifying === 'Excused' ? 'Excused' : qualifying}
                  </span>
                </div>

                {/* Multi-area search: show each area time + total */}
                {areas.length > 1 ? (
                  <>
                    {areas.map((area, index) => (
                      <div key={index} className="score-item time-container">
                        <span className="item-label">{area.areaName} Time</span>
                        <span className="item-value time-value">{area.time || '0:00.00'}</span>
                      </div>
                    ))}
                    <div className="score-item time-container total-time">
                      <span className="item-label">Total Time</span>
                      <span className="item-value time-value total">{totalTime || calculateTotalTime()}</span>
                    </div>
                  </>
                ) : (
                  <div className="score-item time-container">
                    <span className="item-label">Time</span>
                    <span className="item-value time-value">{areas[0]?.time || totalTime || calculateTotalTime()}</span>
                  </div>
                )}
              </div>

              <div className="nationals-breakdown">
                <h3>Nationals Scoring</h3>
                <div className="score-grid">
                  <div className="score-item">
                    <span className="item-label">Correct Calls</span>
                    <span className="item-value positive">{alertsCorrect}</span>
                  </div>
                  <div className="score-item">
                    <span className="item-label">Incorrect Calls</span>
                    <span className="item-value negative">{alertsIncorrect}</span>
                  </div>
                  <div className="score-item">
                    <span className="item-label">Faults</span>
                    <span className="item-value negative">{faultCount}</span>
                  </div>
                  <div className="score-item">
                    <span className="item-label">No Finish Calls</span>
                    <span className="item-value negative">{finishCallErrors}</span>
                  </div>
                </div>
                <div className="total-points">
                  <span className="total-label">Total Points:</span>
                  <span className="total-value">{calculateNationalsPoints()}</span>
                </div>
              </div>

            </div>

            <div className="dialog-actions">
              <button className="dialog-btn cancel" onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
              <button
                className="dialog-btn confirm"
                onClick={handleEnhancedSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
};

export default AKCNationalsScoresheet;
