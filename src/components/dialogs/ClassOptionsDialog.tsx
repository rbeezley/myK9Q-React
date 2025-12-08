/**
 * ClassOptionsDialog
 *
 * Reusable dialog showing class action options in a grid layout.
 * Used by ClassList and EntryList pages.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  List,
  ClipboardList,
  Clock,
  Settings,
  BarChart3,
  FileText,
  Award,
  Activity
} from 'lucide-react';
import './shared-dialog.css';
import './ClassOptionsDialog.css';

export interface ClassOptionsData {
  id: number;
  element: string;
  level: string;
  class_name: string;
  entry_count?: number;
  completed_count?: number;
  class_status?: string;
  briefing_time?: string;
  break_until_time?: string;
  start_time?: string;
}

export interface ClassOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassOptionsData | null;
  /** Called when Requirements is clicked */
  onRequirements?: () => void;
  /** Called when Set Max Time is clicked */
  onSetMaxTime?: () => void;
  /** Called when Settings is clicked */
  onSettings?: () => void;
  /** Called when Statistics is clicked. Returns false to prevent close (e.g., show warning) */
  onStatistics?: () => boolean | void;
  /** Called when Status is clicked */
  onStatus?: () => void;
  /** Called when Check-In Sheet is clicked */
  onPrintCheckIn?: () => void;
  /** Called when Results Sheet is clicked */
  onPrintResults?: () => void;
  /** Called when Scoresheet is clicked */
  onPrintScoresheet?: () => void;
  /** Hide options that aren't available */
  hideRequirements?: boolean;
  hideMaxTime?: boolean;
  hideSettings?: boolean;
  hideStatistics?: boolean;
  hideStatus?: boolean;
  hidePrintOptions?: boolean;
}

export const ClassOptionsDialog: React.FC<ClassOptionsDialogProps> = ({
  isOpen,
  onClose,
  classData,
  onRequirements,
  onSetMaxTime,
  onSettings,
  onStatistics,
  onStatus,
  onPrintCheckIn,
  onPrintResults,
  onPrintScoresheet,
  hideRequirements = false,
  hideMaxTime = false,
  hideSettings = false,
  hideStatistics = false,
  hideStatus = false,
  hidePrintOptions = false,
}) => {
  if (!isOpen || !classData) return null;

  const handleOptionClick = (callback?: () => boolean | void) => {
    if (callback) {
      const result = callback();
      // If callback returns false, don't close
      if (result === false) return;
    }
    onClose();
  };

  const dialogContent = (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            <List className="title-icon" />
            <span>Class Options</span>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="dialog-content">
          {/* Class Info Header */}
          <div className="class-info-header">
            <h3 className="class-title">{classData.class_name}</h3>
          </div>
          <div className="class-options-grid">
            {/* Requirements */}
            {!hideRequirements && onRequirements && (
              <button
                className="class-option-item"
                onClick={() => handleOptionClick(onRequirements)}
              >
                <div className="class-option-icon icon-primary">
                  <ClipboardList size={20} />
                </div>
                <div className="class-option-label">Requirements</div>
                <div className="class-option-description">View class rules and requirements</div>
              </button>
            )}

            {/* Set Max Time */}
            {!hideMaxTime && onSetMaxTime && (
              <button
                className="class-option-item"
                onClick={() => handleOptionClick(onSetMaxTime)}
              >
                <div className="class-option-icon icon-accent">
                  <Clock size={20} />
                </div>
                <div className="class-option-label">Set Max Time</div>
                <div className="class-option-description">Configure maximum time limits</div>
              </button>
            )}

            {/* Settings */}
            {!hideSettings && onSettings && (
              <button
                className="class-option-item"
                onClick={() => handleOptionClick(onSettings)}
              >
                <div className="class-option-icon icon-muted">
                  <Settings size={20} />
                </div>
                <div className="class-option-label">Settings</div>
                <div className="class-option-description">Configure class settings</div>
              </button>
            )}

            {/* Statistics */}
            {!hideStatistics && onStatistics && (
              <button
                className="class-option-item"
                onClick={() => handleOptionClick(onStatistics)}
              >
                <div className="class-option-icon icon-success">
                  <BarChart3 size={20} />
                </div>
                <div className="class-option-label">Statistics</div>
                <div className="class-option-description">View class performance data</div>
              </button>
            )}

            {/* Status */}
            {!hideStatus && onStatus && (
              <button
                className="class-option-item"
                onClick={() => handleOptionClick(onStatus)}
              >
                <div className="class-option-icon icon-info">
                  <Activity size={20} />
                </div>
                <div className="class-option-label">Status</div>
                <div className="class-option-description">Update class status</div>
              </button>
            )}

            {/* Print Options */}
            {!hidePrintOptions && (
              <>
                {onPrintCheckIn && (
                  <button
                    className="class-option-item"
                    onClick={() => handleOptionClick(onPrintCheckIn)}
                  >
                    <div className="class-option-icon icon-warning">
                      <FileText size={20} />
                    </div>
                    <div className="class-option-label">Check-In Sheet</div>
                    <div className="class-option-description">Print check-in roster</div>
                  </button>
                )}

                {onPrintResults && (
                  <button
                    className="class-option-item"
                    onClick={() => handleOptionClick(onPrintResults)}
                  >
                    <div className="class-option-icon icon-secondary">
                      <Award size={20} />
                    </div>
                    <div className="class-option-label">Results Sheet</div>
                    <div className="class-option-description">Print results report</div>
                  </button>
                )}

                {onPrintScoresheet && (
                  <button
                    className="class-option-item"
                    onClick={() => handleOptionClick(onPrintScoresheet)}
                  >
                    <div className="class-option-icon icon-primary">
                      <ClipboardList size={20} />
                    </div>
                    <div className="class-option-label">Scoresheet</div>
                    <div className="class-option-description">Print judge scoresheet</div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default ClassOptionsDialog;
