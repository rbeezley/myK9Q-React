/**
 * Result Choice Chips Component
 *
 * Mobile-friendly choice chips for Nationals and Regular show results
 */

import React from 'react';
import './shared-scoring.css';

type NationalsResult = 'Qualified' | 'Absent' | 'Excused';
// type AllResults = NationalsResult | 'NQ' | 'Withdrawn';

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
  isNationalsMode = false
}) => {
  // NQ Reason options
  const nqReasons = [
    'Incorrect Call',
    'Max Time',
    'Point to Hide',
    'Harsh Correction',
    'Significant Disruption'
  ];

  // Excused Reason options
  const excusedReasons = [
    'Dog Eliminated in Area',
    'Handler Request',
    'Out of Control',
    'Overly Stressed',
    'Other'
  ];

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
          <h3>Faults Count</h3>
          <div className="fault-counter">
            <button
              className="fault-btn-counter"
              onClick={() => onFaultCountChange(Math.max(0, faultCount - 1))}
              disabled={faultCount === 0}
            >
              -
            </button>
            <span className="fault-count-display">{faultCount}</span>
            <button
              className="fault-btn-counter"
              onClick={() => onFaultCountChange(faultCount + 1)}
            >
              +
            </button>
          </div>
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