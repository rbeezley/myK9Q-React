/**
 * UKC Nosework Scoresheet
 *
 * Scoring system: Time + Faults
 * - Single search time (not multi-area like AKC)
 * - Fault counting
 * - Q/NQ based on faults and time
 *
 * Refactored to use shared hooks (2025-12-21):
 * - Uses useEntryNavigation for consistent entry loading
 * - Uses useScoresheetCore for core state management
 * - Matches AKC scoresheet styling patterns
 */

import React, { useState, useCallback } from 'react';
import { useSettingsStore } from '../../../stores/settingsStore';
import { HamburgerMenu, SyncIndicator, ArmbandBadge } from '../../../components/ui';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';
import { ClipboardCheck, X } from 'lucide-react';
import { parseSmartTime } from '../../../utils/timeInputParsing';

// Shared hooks from refactoring
import { useScoresheetCore, useEntryNavigation, useStopwatch } from '../hooks';

// Extracted components
import { ScoreConfirmationDialog } from '../components/ScoreConfirmationDialog';

import '../BaseScoresheet.css';
import '../AKC/AKCScentWorkScoresheet-Flutter.css';
import '../AKC/AKCScentWorkScoresheet-JudgeDialog.css';
import './UKCNoseworkScoresheet.css';

// ==========================================================================
// EXTRACTED SUB-COMPONENTS (to reduce cyclomatic complexity)
// ==========================================================================

interface TimerControlsProps {
  isRunning: boolean;
  time: number;
  isTimeExpired: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning, time, isTimeExpired, onStart, onStop, onReset
}) => {
  if (isRunning) {
    return (
      <button className="timer-btn-start stop" onClick={onStop}>
        Stop
      </button>
    );
  }
  if (time > 0 && isTimeExpired) {
    return (
      <button className="timer-btn-start reset" onClick={onReset} title="Reset timer">
        Reset
      </button>
    );
  }
  if (time > 0) {
    return (
      <button className="timer-btn-start resume" onClick={onStart} title="Continue timing">
        Resume
      </button>
    );
  }
  return (
    <button className="timer-btn-start start" onClick={onStart}>
      Start
    </button>
  );
};

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================

export const UKCNoseworkScoresheet: React.FC = () => {
  // ==========================================================================
  // SHARED HOOKS
  // ==========================================================================

  // Core scoresheet state management
  const core = useScoresheetCore({ sportType: 'UKC_NOSEWORK' });

  // Entry navigation and loading
  const navigation = useEntryNavigation({
    classId: core.classId,
    entryId: core.entryId,
    sportType: 'UKC_NOSEWORK',
    onLoadingChange: core.setIsLoadingEntry
  });

  // Destructure for convenience
  const {
    qualifying, setQualifying,
    nonQualifyingReason, setNonQualifyingReason,
    faultCount, setFaultCount,
    isSubmitting,
    showConfirmation, setShowConfirmation,
    isLoadingEntry,
    isSyncing, hasError,
    navigateBackWithRingCleanup,
    CelebrationModal
  } = core;

  const { currentEntry } = navigation;

  // Settings for voice announcements
  const settings = useSettingsStore(state => state.settings);

  // ==========================================================================
  // UKC-SPECIFIC STATE
  // ==========================================================================

  const [searchTime, setSearchTime] = useState<string>('');

  // Default max time for UKC Nosework (3 minutes)
  const maxTime = '3:00.00';

  // ==========================================================================
  // STOPWATCH (using extracted hook)
  // ==========================================================================

  const stopwatch = useStopwatch({
    maxTime: maxTime,
    level: currentEntry?.level,
    enableVoiceAnnouncements: settings.voiceAnnouncements,
    enableTimerCountdown: settings.announceTimerCountdown,
    onTimeExpired: (formattedTime) => {
      // Auto-fill the time field when timer expires
      setSearchTime(formattedTime);
      // Auto-set result to NQ with Max Time reason
      setQualifying('NQ');
      setNonQualifyingReason('Max Time');
    }
  });

  // ==========================================================================
  // TIMER CONTROLS
  // ==========================================================================

  const handleStopTimer = useCallback(() => {
    stopwatch.pause();
    // Automatically copy time to search time field
    setSearchTime(stopwatch.formatTime(stopwatch.time));
  }, [stopwatch]);

  // ==========================================================================
  // INPUT HELPERS
  // ==========================================================================

  const clearTimeInput = () => {
    setSearchTime('');
  };

  const handleSmartTimeInput = (rawInput: string) => {
    setSearchTime(rawInput);
  };

  const handleTimeInputBlur = (rawInput: string) => {
    const parsedTime = parseSmartTime(rawInput);
    setSearchTime(parsedTime);
  };

  // ==========================================================================
  // NAVIGATION & SUBMIT
  // ==========================================================================

  const handleNavigateWithRingCleanup = useCallback(() => {
    navigateBackWithRingCleanup(currentEntry);
  }, [navigateBackWithRingCleanup, currentEntry]);

  const handleEnhancedSubmit = async () => {
    if (!currentEntry) return;

    // Submit score using the shared core hook's submitScore
    await core.submitScore(currentEntry, {
      resultText: qualifying || 'NQ',
      searchTime: searchTime,
      faultCount: faultCount,
      nonQualifyingReason: qualifying !== 'Q' ? nonQualifyingReason : undefined,
      // UKC doesn't use areas, so we pass empty
      areas: {},
      correctCount: 0,
      incorrectCount: 0,
      finishCallErrors: 0,
      points: 0,
      areaTimes: [searchTime]
    });
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const warningMessage = stopwatch.getWarningMessage();

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
                UKC Nosework
              </h1>
              <div className="header-trial-info">
                <span>{currentEntry.element} {currentEntry.level}</span>
              </div>
            </div>
          </header>

          {/* Content Wrapper */}
          <div className="scoresheet-content-wrapper">
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
                onClick={stopwatch.reset}
                disabled={stopwatch.isRunning}
                title={stopwatch.isRunning ? "Reset disabled while timer is running" : "Reset timer"}
              >
                ⟲
              </button>

              <div className={`timer-display-large ${stopwatch.shouldShow30SecondWarning() ? 'warning' : ''} ${stopwatch.isTimeExpired() ? 'expired' : ''}`}>
                {stopwatch.formatTime(stopwatch.time)}
              </div>
              <div className="timer-countdown-display">
                {stopwatch.time > 0 ? (
                  <>Remaining: {stopwatch.getRemainingTime()}</>
                ) : (
                  <>Max Time: {maxTime}</>
                )}
              </div>
              <div className="timer-controls-flutter">
                <TimerControls
                  isRunning={stopwatch.isRunning}
                  time={stopwatch.time}
                  isTimeExpired={stopwatch.isTimeExpired()}
                  onStart={stopwatch.start}
                  onStop={handleStopTimer}
                  onReset={stopwatch.reset}
                />
              </div>
            </div>

            {/* Timer Warning Message */}
            {warningMessage && (
              <div className={`timer-warning ${warningMessage === 'Time Expired' ? 'expired' : 'warning'}`}>
                {warningMessage}
              </div>
            )}

            {/* Time Input */}
            <div className="scoresheet-time-card">
              <div className="time-input-flutter">
                <div className="scoresheet-time-input-wrapper">
                  <input
                    type="text"
                    value={searchTime}
                    onChange={(e) => handleSmartTimeInput(e.target.value)}
                    onBlur={(e) => handleTimeInputBlur(e.target.value)}
                    placeholder="Type: 12345 or 1:23.45"
                    className="scoresheet-time-input single-area"
                  />
                  {searchTime && (
                    <button
                      type="button"
                      className="scoresheet-time-clear-button"
                      onClick={clearTimeInput}
                      title="Clear time"
                    >
                      <X size={16} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    </button>
                  )}
                </div>
                <div className="max-time-display">
                  Max: {maxTime}
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="results-section">
              <ResultChoiceChips
                selectedResult={
                  qualifying === 'Q' ? 'Qualified' :
                  qualifying === 'ABS' ? 'Absent' :
                  qualifying === 'EX' ? 'Excused' :
                  null
                }
                onResultChange={(result) => {
                  if (result === 'Qualified') {
                    setQualifying('Q');
                  } else if (result === 'Absent') {
                    setQualifying('ABS');
                    setNonQualifyingReason('Absent');
                  } else if (result === 'Excused') {
                    setQualifying('EX');
                    setNonQualifyingReason('Excused');
                  }
                }}
                showNQ={true}
                showEX={true}
                onNQClick={() => {
                  setQualifying('NQ');
                  setNonQualifyingReason('');
                }}
                onEXClick={() => {
                  setQualifying('EX');
                  setNonQualifyingReason('Excused');
                }}
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

            {/* Validation message */}
            {qualifying === 'Q' && !searchTime && (
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
                Search time is required for a Qualified score
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
                disabled={isSubmitting || !qualifying || (qualifying === 'Q' && !searchTime)}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Sync Status */}
            {(isSyncing || hasError) && (
              <div style={{ textAlign: 'center', marginTop: '-8px', marginBottom: '8px' }}>
                {isSyncing && <SyncIndicator status="syncing" />}
                {hasError && <SyncIndicator status="error" />}
              </div>
            )}

            {/* Confirmation Dialog */}
            <ScoreConfirmationDialog
              isOpen={showConfirmation}
              onClose={() => setShowConfirmation(false)}
              onConfirm={handleEnhancedSubmit}
              isSubmitting={isSubmitting}
              trialDate=""
              trialNumber=""
              entry={currentEntry}
              qualifying={qualifying}
              areas={[{ areaName: 'Search', time: searchTime, found: true, correct: true }]}
              faultCount={faultCount}
              nonQualifyingReason={nonQualifyingReason}
              calculateTotalTime={() => searchTime}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default UKCNoseworkScoresheet;
