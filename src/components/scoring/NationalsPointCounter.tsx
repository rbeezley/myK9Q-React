/**
 * NationalsPointCounter Component
 *
 * Point tracking component for AKC Nationals scoring
 * Shows real-time point calculations as judge enters alerts, faults, etc.
 */

import React from 'react';
import './shared-scoring.css';

interface NationalsPointCounterProps {
  alertsCorrect: number;
  alertsIncorrect: number;
  faults: number;
  finishCallErrors: number;
  excused: boolean;
  className?: string;
}

export const NationalsPointCounter: React.FC<NationalsPointCounterProps> = ({
  alertsCorrect,
  alertsIncorrect,
  faults,
  finishCallErrors,
  excused,
  className = ''
}) => {
  // Calculate points according to AKC Nationals rules
  const calculatePoints = () => {
    if (excused) return 0;

    const correctPoints = alertsCorrect * 10;
    const incorrectPenalty = alertsIncorrect * 5;
    const faultPenalty = faults * 2;
    const finishErrorPenalty = finishCallErrors * 5;

    return correctPoints - incorrectPenalty - faultPenalty - finishErrorPenalty;
  };

  const totalPoints = calculatePoints();
  const isNegative = totalPoints < 0;

  return (
    <div className={`nationals-point-counter ${className}`}>
      <div className="point-counter-header">
        <h3>🏆 NATIONALS POINTS</h3>
        {excused && <span className="excused-badge">EXCUSED</span>}
      </div>

      <div className="point-breakdown">
        {/* Correct Alerts */}
        <div className="point-row positive">
          <span className="point-label">Correct Alerts</span>
          <span className="point-count">{alertsCorrect}</span>
          <span className="point-calculation">× 10</span>
          <span className="point-value">+{alertsCorrect * 10}</span>
        </div>

        {/* Incorrect Alerts */}
        {alertsIncorrect > 0 && (
          <div className="point-row negative">
            <span className="point-label">Incorrect Alerts</span>
            <span className="point-count">{alertsIncorrect}</span>
            <span className="point-calculation">× 5</span>
            <span className="point-value">-{alertsIncorrect * 5}</span>
          </div>
        )}

        {/* Faults */}
        {faults > 0 && (
          <div className="point-row negative">
            <span className="point-label">Faults</span>
            <span className="point-count">{faults}</span>
            <span className="point-calculation">× 2</span>
            <span className="point-value">-{faults * 2}</span>
          </div>
        )}

        {/* Finish Call Errors */}
        {finishCallErrors > 0 && (
          <div className="point-row negative">
            <span className="point-label">Finish Errors</span>
            <span className="point-count">{finishCallErrors}</span>
            <span className="point-calculation">× 5</span>
            <span className="point-value">-{finishCallErrors * 5}</span>
          </div>
        )}
      </div>

      {/* Total Points Display */}
      <div className={`total-points ${isNegative ? 'negative' : 'positive'} ${excused ? 'excused' : ''}`}>
        <span className="total-label">TOTAL POINTS</span>
        <span className="total-value">
          {excused ? '0' : (totalPoints >= 0 ? `+${totalPoints}` : totalPoints)}
        </span>
      </div>

      {/* Point Rules Reference */}
      <div className="point-rules">
        <div className="rule">Correct Alert: +10</div>
        <div className="rule">Incorrect Alert: -5</div>
        <div className="rule">Fault: -2</div>
        <div className="rule">Finish Error: -5</div>
      </div>
    </div>
  );
};

/**
 * Compact Point Counter for smaller spaces
 */
export const CompactPointCounter: React.FC<NationalsPointCounterProps> = ({
  alertsCorrect,
  alertsIncorrect,
  faults,
  finishCallErrors,
  excused,
  className = ''
}) => {
  const calculatePoints = () => {
    if (excused) return 0;

    const correctPoints = alertsCorrect * 10;
    const incorrectPenalty = alertsIncorrect * 5;
    const faultPenalty = faults * 2;
    const finishErrorPenalty = finishCallErrors * 5;

    return correctPoints - incorrectPenalty - faultPenalty - finishErrorPenalty;
  };

  const totalPoints = calculatePoints();
  const isNegative = totalPoints < 0;

  return (
    <div className={`compact-point-counter ${className}`}>
      <div className="compact-header">
        <span className="compact-title">Points</span>
        {excused && <span className="compact-excused">EX</span>}
      </div>

      <div className={`compact-total ${isNegative ? 'negative' : 'positive'} ${excused ? 'excused' : ''}`}>
        {excused ? '0' : (totalPoints >= 0 ? `+${totalPoints}` : totalPoints)}
      </div>

      <div className="compact-breakdown">
        <span className="compact-item positive">C: {alertsCorrect}</span>
        {alertsIncorrect > 0 && <span className="compact-item negative">I: {alertsIncorrect}</span>}
        {faults > 0 && <span className="compact-item negative">F: {faults}</span>}
        {finishCallErrors > 0 && <span className="compact-item negative">E: {finishCallErrors}</span>}
      </div>
    </div>
  );
};