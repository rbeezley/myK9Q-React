/**
 * Result Choice Chips Component
 *
 * Mobile-friendly choice chips for Nationals and Regular show results.
 * Supports sport-specific NQ/EX reasons for AKC, UKC, and ASCA.
 */

import React from 'react';
import './shared-scoring.css';

type NationalsResult = 'Qualified' | 'Absent' | 'Excused';
// type AllResults = NationalsResult | 'NQ' | 'Withdrawn';

type SportType = 'AKC_SCENT_WORK' | 'AKC_SCENT_WORK_NATIONAL' | 'AKC_FASTCAT' | 'UKC_NOSEWORK' | 'ASCA_SCENT_DETECTION';

// Sport-specific NQ reasons
const NQ_REASONS: Record<string, string[]> = {
  default: [
    'Incorrect Call',
    'Max Time',
    'Point to Hide',
    'Harsh Correction',
    'Significant Disruption'
  ],
  ASCA_SCENT_DETECTION: [
    'Incorrect Call',
    'Exceeded Time Limit',
    'Dog Soil Search Area',
    'Excessive Disruption',
    'Other'
  ]
};

// Sport-specific Excused reasons
const EXCUSED_REASONS: Record<string, string[]> = {
  default: [
    'Dog Eliminated in Area',
    'Handler Request',
    'Out of Control',
    'Overly Stressed',
    'Other'
  ],
  ASCA_SCENT_DETECTION: [
    'Extreme Stress',
    'Harsh Correction',
    'Sportsmanship',
    'Handler Request',
    'Other'
  ]
};

interface ResultChoiceChipsProps {
  selectedResult: NationalsResult | null;
  onResultChange: (result: NationalsResult) => void;
  showNQ?: boolean;
  showEX?: boolean;
  onNQClick?: () => void;
  onEXClick?: () => void;
  _showEX?: boolean;
  _onEXClick?: () => void;
  // Additional props for enhanced functionality
  selectedResultInternal?: string; // Internal result value (Q, NQ, ABS, etc.)
  faultCount?: number;
  onFaultCountChange?: (count: number) => void;
  nqReason?: string;
  onNQReasonChange?: (reason: string) => void;
  excusedReason?: string;
  onExcusedReasonChange?: (reason: string) => void;
  isNationalsMode?: boolean; // Hide faults counter in nationals mode
  sportType?: SportType; // Sport type for reason selection
  level?: string; // Level for fault limit validation (ASCA)
}

/**
 * Get the maximum allowed faults for a sport/level combination.
 * ASCA: Novice/Open = 2 faults, Advanced/Excellent = 1 fault
 * Others: No limit (returns Infinity)
 */
function getMaxFaults(sportType?: SportType, level?: string): number {
  if (sportType === 'ASCA_SCENT_DETECTION' && level) {
    const lvl = level.toLowerCase();
    if (lvl.includes('novice') || lvl.includes('open')) {
      return 2;
    }
    if (lvl.includes('advanced') || lvl.includes('excellent')) {
      return 1;
    }
  }
  return Infinity; // No limit for other sports
}

export const ResultChoiceChips: React.FC<ResultChoiceChipsProps> = ({
  selectedResult,
  onResultChange,
  showNQ = false,
  _showEX = true,
  onNQClick,
  _onEXClick,
  selectedResultInternal,
  faultCount = 0,
  onFaultCountChange,
  nqReason = 'Incorrect Call',
  onNQReasonChange,
  excusedReason = 'Dog Eliminated in Area',
  onExcusedReasonChange,
  isNationalsMode = false,
  sportType,
  level
}) => {
  // Get sport-specific reasons
  const nqReasons = NQ_REASONS[sportType || ''] || NQ_REASONS.default;
  const excusedReasons = EXCUSED_REASONS[sportType || ''] || EXCUSED_REASONS.default;

  // Get max faults for sport/level
  const maxFaults = getMaxFaults(sportType, level);
  const isAtMaxFaults = faultCount >= maxFaults;

  return (
    <div className="result-choice-chips-container">
      {/* Main result choice chips - ordered: Qualified, NQ, Absent, Excused */}
      <div className="result-choice-chips">
        {/* Qualified */}
        <button
          className={`choice-chip success ${
            selectedResult === 'Qualified' ? 'selected' : ''
          }`}
          onClick={() => onResultChange('Qualified')}
        >
          Qualified
        </button>

        {/* NQ - only show for regular shows */}
        {showNQ && (
          <button
            className={`choice-chip danger ${
              selectedResultInternal === 'NQ' ? 'selected' : ''
            }`}
            onClick={onNQClick}
          >
            NQ
          </button>
        )}

        {/* Absent */}
        <button
          className={`choice-chip warning ${
            selectedResult === 'Absent' ? 'selected' : ''
          }`}
          onClick={() => onResultChange('Absent')}
        >
          Absent
        </button>

        {/* Excused */}
        <button
          className={`choice-chip danger ${
            selectedResult === 'Excused' ? 'selected' : ''
          }`}
          onClick={() => onResultChange('Excused')}
        >
          Excused
        </button>
      </div>

      {/* Fault Counter - show when Qualified is selected (but not in nationals mode) */}
      {(selectedResult === 'Qualified' || selectedResultInternal === 'Q') && onFaultCountChange && !isNationalsMode && (
        <div className="fault-counter-section">
          <h3>
            Faults Count
            {maxFaults !== Infinity && (
              <span className="fault-limit-label"> (max {maxFaults})</span>
            )}
          </h3>
          <div className="fault-counter">
            <button
              className="fault-btn-counter"
              onClick={() => onFaultCountChange(Math.max(0, faultCount - 1))}
              disabled={faultCount === 0}
            >
              -
            </button>
            <span className={`fault-count-display ${isAtMaxFaults ? 'at-limit' : ''}`}>
              {faultCount}
            </span>
            <button
              className="fault-btn-counter"
              onClick={() => onFaultCountChange(faultCount + 1)}
              disabled={isAtMaxFaults}
              title={isAtMaxFaults ? `Maximum ${maxFaults} faults allowed` : undefined}
            >
              +
            </button>
          </div>
          {isAtMaxFaults && (
            <div className="fault-limit-warning">
              At maximum faults for {level} level
            </div>
          )}
        </div>
      )}

      {/* NQ Reason Selection - show when NQ is selected */}
      {selectedResultInternal === 'NQ' && onNQReasonChange && (
        <div className="reason-selection">
          <h3>Non-Qualifying Reason</h3>
          <div className="reason-choice-chips">
            {nqReasons.map((reason) => (
              <button
                key={reason}
                className={`choice-chip small ${
                  nqReason === reason ? 'selected' : ''
                } ${reason === 'Incorrect Call' ? 'primary' : 'secondary'}`}
                onClick={() => onNQReasonChange(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Excused Reason Selection - show when Excused is selected */}
      {(selectedResult === 'Excused' || selectedResultInternal === 'EX') && onExcusedReasonChange && (
        <div className="reason-selection">
          <h3>Excused Reason</h3>
          <div className="reason-choice-chips">
            {excusedReasons.map((reason) => (
              <button
                key={reason}
                className={`choice-chip small ${
                  excusedReason === reason ? 'selected' : ''
                } ${reason === 'Dog Eliminated in Area' ? 'primary' : 'secondary'}`}
                onClick={() => onExcusedReasonChange(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultChoiceChips;