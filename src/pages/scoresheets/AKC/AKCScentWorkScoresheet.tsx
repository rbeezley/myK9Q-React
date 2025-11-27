/**
 * AKC Scent Work Scoresheet
 *
 * Regular AKC Scent Work scoresheet for standard trials.
 * Refactored to use shared hooks for reduced code duplication.
 *
 * Supports:
 * - Timer/stopwatch functionality
 * - Regular qualifying results: Q, NQ, EX, ABS
 * - Standard area scoring
 * - Fault counting
 * - Voice announcements
 * - Entry navigation
 *
 * @see docs/SCORESHEET_REFACTORING_PLAN.md
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';
import { HamburgerMenu, SyncIndicator, ArmbandBadge } from '../../../components/ui';
import { DogCard } from '../../../components/DogCard';
import { X, ClipboardCheck } from 'lucide-react';
import voiceAnnouncementService from '../../../services/voiceAnnouncementService';
import { parseSmartTime } from '../../../utils/timeInputParsing';

// Shared hooks from refactoring
import { useScoresheetCore, useEntryNavigation } from '../hooks';

import '../BaseScoresheet.css';
import './AKCScentWorkScoresheet-Flutter.css';
import './AKCScentWorkScoresheet-JudgeDialog.css';
import '../../../styles/containers.css';

// =============================================================================
// TIMER HELPERS (extracted to reduce duplication)
// =============================================================================

/**
 * Parse time string (format: "3:00" or "4:00") to milliseconds.
 * Previously duplicated 5+ times throughout the component.
 */
function parseTimeToMs(timeStr: string | undefined): number {
  if (!timeStr) return 0;
  const [minutes, seconds] = timeStr.split(':').map(parseFloat);
  return (minutes * 60 + (seconds || 0)) * 1000;
}

/**
 * Format milliseconds to display string (M:SS.ss format)
 */
function formatTimeMs(milliseconds: number): string {
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return `${minutes}:${seconds.padStart(5, '0')}`;
}

/**
 * Check if current level is Master (no 30-second warnings for Master)
 */
function isMasterLevel(level: string | undefined): boolean {
  const lvl = level?.toLowerCase() || '';
  return lvl === 'master' || lvl === 'masters';
}

export const AKCScentWorkScoresheet: React.FC = () => {
  // ==========================================================================
  // SHARED HOOKS (from refactoring)
  // ==========================================================================

  // Core scoresheet state management
  const core = useScoresheetCore({ sportType: 'AKC_SCENT_WORK' });

  // Entry navigation and loading
  const navigation = useEntryNavigation({
    classId: core.classId,
    entryId: core.entryId,
    sportType: 'AKC_SCENT_WORK',
    onEntryLoaded: (entry, areas) => {
      core.setAreas(areas);
    },
    onTrialDateLoaded: core.setTrialDate,
    onTrialNumberLoaded: core.setTrialNumber,
    onLoadingChange: core.setIsLoadingEntry
  });

  // Destructure for convenience
  const {
    areas, setAreas: _setAreas,
    qualifying, setQualifying,
    nonQualifyingReason, setNonQualifyingReason,
    faultCount, setFaultCount,
    isSubmitting,
    showConfirmation, setShowConfirmation,
    isLoadingEntry,
    trialDate, trialNumber,
    isSyncing, hasError,
    calculateTotalTime,
    handleAreaUpdate,
    submitScore,
    navigateBackWithRingCleanup,
    CelebrationModal
  } = core;

  const {
    currentEntry,
    getMaxTimeForArea
  } = navigation;

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
  // SUBMIT HANDLER
  // ==========================================================================

  const handleEnhancedSubmit = async () => {
    if (!currentEntry) return;
    await submitScore(currentEntry);
  };

  // ==========================================================================
  // TIMER HELPERS
  // ==========================================================================

  // Helper to determine "next in sequence" for pulse indicator
  const getNextEmptyAreaIndex = useCallback((): number => {
    return areas.findIndex(area => !area.time);
  }, [areas]);

  // Pre-compute max time for current area (used by multiple functions)
  const activeAreaMaxTimeMs = useMemo(() => {
    const activeAreaIndex = getNextEmptyAreaIndex();
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeStr = getMaxTimeForArea(areaIndex);
    return parseTimeToMs(maxTimeStr);
  }, [getNextEmptyAreaIndex, getMaxTimeForArea]);

  // Computed remaining time (avoids recalculation in multiple places)
  const remainingTimeMs = useMemo(() => {
    return Math.max(0, activeAreaMaxTimeMs - stopwatchTime);
  }, [activeAreaMaxTimeMs, stopwatchTime]);

  const getRemainingTime = useCallback((): string => {
    return formatTimeMs(remainingTimeMs);
  }, [remainingTimeMs]);

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

    // Capture max time at start (avoid recalculating in interval)
    const activeAreaIndex = areas.findIndex(area => !area.time);
    const areaIndex = activeAreaIndex >= 0 ? activeAreaIndex : 0;
    const maxTimeMs = parseTimeToMs(getMaxTimeForArea(areaIndex));

    const interval = setInterval(() => {
      const currentTime = Date.now() - startTime;
      setStopwatchTime(currentTime);

      // Auto-stop when time expires
      if (maxTimeMs > 0 && currentTime >= maxTimeMs) {
        setIsStopwatchRunning(false);
        clearInterval(interval);
        setStopwatchInterval(null);
        setStopwatchTime(maxTimeMs);

        // For single-area classes, auto-fill the time field
        if (areas.length === 1) {
          handleAreaUpdate(0, 'time', formatTimeMs(maxTimeMs));
        }
      }
    }, 10);
    setStopwatchInterval(interval);
  }, [stopwatchTime, areas, getMaxTimeForArea, handleAreaUpdate]);

  const stopStopwatch = useCallback(() => {
    // Just stop/pause the timer - don't reset or move to next area
    setIsStopwatchRunning(false);
    if (stopwatchInterval) {
      clearInterval(stopwatchInterval);
      setStopwatchInterval(null);
    }

    // For single-area classes, automatically copy time to search time field
    if (areas.length === 1) {
      handleAreaUpdate(0, 'time', formatTimeMs(stopwatchTime));
    }
    // Timer stays paused - judge can resume or record time for any area
  }, [stopwatchInterval, areas.length, stopwatchTime, handleAreaUpdate]);

  // Record time for a specific area (new multi-area approach)
  const recordTimeForArea = useCallback((areaIndex: number) => {
    handleAreaUpdate(areaIndex, 'time', formatTimeMs(stopwatchTime));
    resetStopwatch(); // Auto-reset stopwatch after recording (stays stopped)
  }, [stopwatchTime, handleAreaUpdate, resetStopwatch]);

  // ==========================================================================
  // WARNING STATE (uses pre-computed values)
  // ==========================================================================

  // 30-second warning (excluded for Master level)
  const shouldShow30SecondWarning = useMemo((): boolean => {
    if (!isStopwatchRunning) return false;
    if (isMasterLevel(currentEntry?.level)) return false;
    // Show warning if less than 30 seconds remaining (but not expired)
    return remainingTimeMs > 0 && remainingTimeMs <= 30000;
  }, [isStopwatchRunning, currentEntry?.level, remainingTimeMs]);

  const isTimeExpired = useMemo((): boolean => {
    return stopwatchTime > 0 && remainingTimeMs === 0;
  }, [stopwatchTime, remainingTimeMs]);

  const timerWarningMessage = useMemo((): string | null => {
    if (isTimeExpired) return "Time Expired";
    if (shouldShow30SecondWarning) return "30 Second Warning";
    return null;
  }, [isTimeExpired, shouldShow30SecondWarning]);

  // Voice announcement for 30-second warning (uses pre-computed remainingTimeMs)
  const has30SecondAnnouncedRef = useRef(false);

  useEffect(() => {
    if (!settings.voiceAnnouncements || !settings.announceTimerCountdown) return;

    if (!isStopwatchRunning) {
      has30SecondAnnouncedRef.current = false;
      return;
    }

    // No warnings for Master level
    if (isMasterLevel(currentEntry?.level)) return;

    const remainingSeconds = Math.floor(remainingTimeMs / 1000);

    // Announce when crossing 30-second threshold (29 < remaining <= 30)
    if (remainingSeconds <= 30 && remainingSeconds > 29 && !has30SecondAnnouncedRef.current) {
      voiceAnnouncementService.announceTimeRemaining(30);
      has30SecondAnnouncedRef.current = true;
    }

    // Reset flag if above 30 seconds (timer reset/restarted)
    if (remainingSeconds > 30 && has30SecondAnnouncedRef.current) {
      has30SecondAnnouncedRef.current = false;
    }
  }, [remainingTimeMs, isStopwatchRunning, settings.voiceAnnouncements, settings.announceTimerCountdown, currentEntry?.level]);

  // Set scoring active state to suppress push notification voices while timing
  useEffect(() => {
    voiceAnnouncementService.setScoringActive(isStopwatchRunning);

    // Cleanup: ensure scoring state is cleared when component unmounts
    return () => {
      voiceAnnouncementService.setScoringActive(false);
    };
  }, [isStopwatchRunning]);

  // ==========================================================================
  // LOCAL INPUT HELPERS (wraps core handleAreaUpdate)
  // ==========================================================================

  const clearTimeInput = (index: number) => {
    handleAreaUpdate(index, 'time', '');
  };

  const handleSmartTimeInput = (index: number, rawInput: string) => {
    // Always update with raw input first (for real-time typing)
    handleAreaUpdate(index, 'time', rawInput);
  };

  const handleTimeInputBlur = (index: number, rawInput: string) => {
    const parsedTime = parseSmartTime(rawInput);
    handleAreaUpdate(index, 'time', parsedTime);
  };

  // Wrapper for navigation cleanup with current entry
  const handleNavigateWithRingCleanup = useCallback(async () => {
    await navigateBackWithRingCleanup(currentEntry);
  }, [navigateBackWithRingCleanup, currentEntry]);

  // ==========================================================================
  // CONDITIONAL RENDERING
  // ==========================================================================

  // Show loading state while entry is being loaded
  if (isLoadingEntry) {
    return (
      <div className="scoresheet-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </div>
    );
  }

  // Show nothing if no entry after loading (will redirect)
  if (!currentEntry) {
    return null;
  }

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
            AKC Scent Work
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

      {/* Content Wrapper - Constrained width on desktop */}
      <div className="scoresheet-content-wrapper">
      {/* Dog Info Card - Production Styling */}
      <div className="scoresheet-dog-info-card">
        <ArmbandBadge number={currentEntry.armband} />
        <div className="scoresheet-dog-details">
          <div className="scoresheet-dog-name">{currentEntry.callName}</div>
          <div className="scoresheet-dog-breed">{currentEntry.breed}</div>
          <div className="scoresheet-dog-handler">Handler: {currentEntry.handler}</div>
        </div>
      </div>


      {/* Flutter-style Timer Section */}
      <div className="scoresheet-timer-card">
        {/* Reset button - always in top-right corner */}
        <button
          className="timer-btn-reset"
          onClick={resetStopwatch}
          disabled={isStopwatchRunning}
          title={isStopwatchRunning ? "Reset disabled while timer is running" : "Reset timer"}
        >
          ⟲
        </button>

        <div className={`timer-display-large ${shouldShow30SecondWarning ? 'warning' : ''} ${isTimeExpired ? 'expired' : ''}`}>
          {formatTimeMs(stopwatchTime)}
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
            // Timer is running - show Stop button (centered)
            <button
              className="timer-btn-start stop"
              onClick={stopStopwatch}
            >
              Stop
            </button>
          ) : stopwatchTime > 0 ? (
            // Timer is stopped with time recorded - show Resume button
            <button
              className="timer-btn-start resume"
              onClick={startStopwatch}
              title="Continue timing"
            >
              Resume
            </button>
          ) : (
            // Timer is at zero - show Start button (centered)
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
      {timerWarningMessage && (
        <div className={`timer-warning ${timerWarningMessage === 'Time Expired' ? 'expired' : 'warning'}`}>
          {timerWarningMessage}
        </div>
      )}

      {/* Time Input - Conditional Badge/Button Based on Area Count */}
      {areas.map((area, index) => (
        <div key={index} className="scoresheet-time-card">
          <div className="time-input-flutter">
            {/* Only show badge/button for multi-area elements/levels */}
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
                  <X size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                </button>
              )}
            </div>
            <div className="max-time-display">
              Max: {getMaxTimeForArea ? getMaxTimeForArea(index) : '02:00'}
            </div>
          </div>
        </div>
      ))}

      {/* Results Section - Choice Chips for All Shows */}
      <div className="results-section">
        <ResultChoiceChips
          selectedResult={
            // Map regular show results to choice chip format
            qualifying === 'Q' ? 'Qualified' :
            qualifying === 'ABS' ? 'Absent' :
            qualifying === 'EX' ? 'Excused' :
            null
          }
          onResultChange={(result) => {
            // Map choice chip results back to regular show format
            if (result === 'Qualified') {
              setQualifying('Q');
            } else if (result === 'Absent') {
              setQualifying('ABS');
              setNonQualifyingReason('Absent');
            } else if (result === 'Excused') {
              setQualifying('EX');
              setNonQualifyingReason('Dog Eliminated in Area');
            }
          }}
          showNQ={true}
          showEX={true}
          onNQClick={() => {
            setQualifying('NQ');
            setNonQualifyingReason('Incorrect Call');
          }}
          onEXClick={() => {
            setQualifying('EX');
            setNonQualifyingReason('Dog Eliminated in Area');
          }}
          // Additional props for enhanced functionality
          selectedResultInternal={qualifying || ''}
          faultCount={faultCount}
          onFaultCountChange={setFaultCount}
          nqReason={nonQualifyingReason}
          onNQReasonChange={setNonQualifyingReason}
          excusedReason={nonQualifyingReason}
          onExcusedReasonChange={setNonQualifyingReason}
          isNationalsMode={false}
        />


      </div>

      {/* Validation message for incomplete Qualified scores */}
      {qualifying === 'Q' && !areas.every(area => area.time && area.time !== '') && (
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

      {/* Flutter-style Action Buttons */}
      <div className="scoresheet-actions">
        <button className="scoresheet-btn-cancel" onClick={handleNavigateWithRingCleanup}>
          Cancel
        </button>
        <button
          className="scoresheet-btn-save"
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting || !qualifying || (qualifying === 'Q' && !areas.every(area => area.time && area.time !== ''))}
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
              <div className="result-time-grid">
                <div className="score-item">
                  <span className="item-label">Result</span>
                  <span className={`item-value result-${qualifying?.toLowerCase()}`}>
                    {qualifying === 'Q' ? 'Qualified' :
                     qualifying === 'NQ' ? 'NQ' :
                     qualifying === 'ABS' ? 'Absent' :
                     qualifying === 'EX' ? 'Excused' : qualifying}
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
                      <span className="item-value time-value total">{calculateTotalTime()}</span>
                    </div>
                  </>
                ) : (
                  /* Single area search: show time */
                  <div className="score-item time-container">
                    <span className="item-label">Time</span>
                    <span className="item-value time-value">{areas[0]?.time || calculateTotalTime()}</span>
                  </div>
                )}

                {/* Show faults if any (both single and multi-area) */}
                {faultCount > 0 && (
                  <div className="score-item">
                    <span className="item-label">Faults</span>
                    <span className="item-value negative">{faultCount}</span>
                  </div>
                )}

                {nonQualifyingReason && (qualifying === 'NQ' || qualifying === 'EX') && (
                  <div className="score-item">
                    <span className="item-label">{qualifying === 'EX' ? 'Excused' : 'NQ'} Reason</span>
                    <span className="item-value">{nonQualifyingReason}</span>
                  </div>
                )}
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
      </div> {/* End scoresheet-content-wrapper */}
      </div> {/* End scoresheet */}
    </div> {/* End scoresheet-container */}
    </>
  );
};

export default AKCScentWorkScoresheet;
