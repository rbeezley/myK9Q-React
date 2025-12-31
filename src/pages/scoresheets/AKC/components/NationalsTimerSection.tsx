/**
 * Nationals Timer Section Component
 *
 * Extracted from AKCNationalsScoresheet.tsx to reduce complexity.
 * Contains timer display, controls, and warning logic.
 */

import React from 'react';
import { formatStopwatchTime } from '../AKCNationalsScoresheetHelpers';
import { haptic } from '@/hooks/useHapticFeedback';

interface NationalsTimerSectionProps {
  stopwatchTime: number;
  isStopwatchRunning: boolean;
  showWarning: boolean;
  isExpired: boolean;
  remainingTime: string;
  maxTimeDisplay: string;
  warningMessage: string | null;
  onReset: () => void;
  onStart: () => void;
  onStop: () => void;
}

export const NationalsTimerSection: React.FC<NationalsTimerSectionProps> = ({
  stopwatchTime,
  isStopwatchRunning,
  showWarning,
  isExpired,
  remainingTime,
  maxTimeDisplay,
  warningMessage,
  onReset,
  onStart,
  onStop
}) => {
  return (
    <>
      <div className="scoresheet-timer-card">
        <button
          className="timer-btn-reset"
          onClick={() => { haptic.heavy(); onReset(); }}
          disabled={isStopwatchRunning}
          title={isStopwatchRunning ? "Reset disabled while timer is running" : "Reset timer"}
        >
          \u27F2
        </button>

        <div className={`timer-display-large ${showWarning ? 'warning' : ''} ${isExpired ? 'expired' : ''}`}>
          {formatStopwatchTime(stopwatchTime)}
        </div>
        <div className="timer-countdown-display">
          {stopwatchTime > 0 ? (
            <>Remaining: {remainingTime}</>
          ) : (
            <>Max Time: {maxTimeDisplay}</>
          )}
        </div>
        <div className="timer-controls-flutter">
          {isStopwatchRunning ? (
            <button
              className="timer-btn-start stop"
              onClick={() => { haptic.heavy(); onStop(); }}
            >
              Stop
            </button>
          ) : stopwatchTime > 0 ? (
            <button
              className="timer-btn-start resume"
              onClick={() => { haptic.medium(); onStart(); }}
              title="Continue timing"
            >
              Resume
            </button>
          ) : (
            <button
              className="timer-btn-start start"
              onClick={() => { haptic.heavy(); onStart(); }}
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Timer Warning Message */}
      {warningMessage && (
        <div className={`timer-warning ${warningMessage === 'Time Expired' ? 'expired' : 'warning'}`}>
          {warningMessage}
        </div>
      )}
    </>
  );
};

export default NationalsTimerSection;
