/**
 * TimerDisplay Component
 *
 * Displays the scoresheet timer with controls, countdown, and warning states.
 * Features Flutter-style modern UI with start/stop/resume/reset functionality.
 *
 * Extracted from AKCScentWorkScoresheet.tsx
 */

import React from 'react';
import './TimerDisplay.css';

/**
 * Timer warning state
 */
export type TimerWarningState = 'normal' | 'warning' | 'expired' | null;

/**
 * Props for TimerDisplay component
 */
export interface TimerDisplayProps {
  /** Current timer value in milliseconds */
  time: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Warning state based on remaining time */
  warningState: TimerWarningState;
  /** Maximum time allowed (formatted as "M:SS") */
  maxTime: string;
  /** Remaining time display (formatted as "M:SS") */
  remainingTime: string;
  /** Warning message to display (if any) */
  warningMessage?: string;
  /** Handler for start/resume button */
  onStart: () => void;
  /** Handler for stop button */
  onStop: () => void;
  /** Handler for reset button */
  onReset: () => void;
}

/**
 * TimerDisplay Component
 *
 * Displays a large, prominent timer for scoresheets with:
 * - Large elapsed time display
 * - Countdown/remaining time indicator
 * - Start/Stop/Resume/Reset controls
 * - Visual warnings (30 seconds remaining, time expired)
 * - Disabled reset during timing
 *
 * **Features**:
 * - Flutter-style modern card design
 * - Color-coded warning states (yellow warning, red expired)
 * - Smart button states (Start → Stop → Resume)
 * - Always-visible reset button (top-right corner)
 * - Max time display before timing starts
 *
 * **Use Cases**:
 * - AKC Scent Work scoresheets
 * - FastCAT scoresheets
 * - Any timed scoring event
 * - Real-time judging with countdown
 *
 * @example
 * ```tsx
 * <TimerDisplay
 *   time={45000}
 *   isRunning={false}
 *   warningState="normal"
 *   maxTime="3:00"
 *   remainingTime="2:15"
 *   onStart={handleStart}
 *   onStop={handleStop}
 *   onReset={handleReset}
 * />
 * ```
 */
export function TimerDisplay({
  time,
  isRunning,
  warningState,
  maxTime,
  remainingTime,
  warningMessage,
  onStart,
  onStop,
  onReset
}: TimerDisplayProps): React.ReactElement {
  // Format milliseconds to M:SS.ss
  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  return (
    <>
      <div className="scoresheet-timer-card">
        {/* Reset button - always in top-right corner */}
        <button
          className="timer-btn-reset"
          onClick={onReset}
          disabled={isRunning}
          title={isRunning ? "Reset disabled while timer is running" : "Reset timer"}
        >
          ⟲
        </button>

        {/* Main timer display */}
        <div
          className={`timer-display-large ${warningState === 'warning' ? 'warning' : ''} ${warningState === 'expired' ? 'expired' : ''}`}
        >
          {formatTime(time)}
        </div>

        {/* Countdown/Max Time display */}
        <div className="timer-countdown-display">
          {time > 0 ? (
            <>Remaining: {remainingTime}</>
          ) : (
            <>Max Time: {maxTime}</>
          )}
        </div>

        {/* Control buttons */}
        <div className="timer-controls-flutter">
          {isRunning ? (
            // Timer is running - show Stop button (centered)
            <button
              className="timer-btn-start stop"
              onClick={onStop}
            >
              Stop
            </button>
          ) : time > 0 ? (
            // Timer is stopped with time recorded - show Resume button
            <button
              className="timer-btn-start resume"
              onClick={onStart}
              title="Continue timing"
            >
              Resume
            </button>
          ) : (
            // Timer is at zero - show Start button (centered)
            <button
              className="timer-btn-start start"
              onClick={onStart}
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Timer Warning Message */}
      {warningMessage && (
        <div className={`timer-warning ${warningState === 'expired' ? 'expired' : 'warning'}`}>
          {warningMessage}
        </div>
      )}
    </>
  );
}
