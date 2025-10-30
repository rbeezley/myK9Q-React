import React from 'react';
import { createPortal } from 'react-dom';
import { ArmbandBadge } from '../ui';
import { usePermission } from '../../hooks/usePermission';
import {
  Circle,
  Check,
  XCircle,
  AlertTriangle,
  Star,
  X,
  Bell,
  Target,
  CheckCircle
} from 'lucide-react';
import './shared-dialog.css';
import './CheckinStatusDialog.css';

export type CheckinStatus = 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate' | 'come-to-gate' | 'in-ring' | 'completed';

interface CheckinStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: CheckinStatus) => void;
  dogInfo: {
    armband: number;
    callName: string;
    handler: string;
  };
  showDescriptions?: boolean;
  showRingManagement?: boolean; // Show "In Ring" and "Completed" options (for stewards/judges only)
}

export const CheckinStatusDialog: React.FC<CheckinStatusDialogProps> = ({
  isOpen,
  onClose,
  onStatusChange,
  dogInfo,
  showDescriptions = false,
  showRingManagement = false
}) => {
  const { hasPermission: _hasPermission } = usePermission();

  if (!isOpen) return null;

  const handleStatusSelect = (status: CheckinStatus) => {
    onStatusChange(status);
    onClose();
  };

  const dialogContent = (
    <div className="dialog-overlay">
      <div className="dialog-container">
        <div className="dialog-header">
          <div className="dialog-title">
            <div className="status-dialog-info">
              <div className="status-dialog-entry">
                <ArmbandBadge number={dogInfo.armband} />
                <div className="status-dialog-details">
                  <span className="status-dialog-dog-name">{dogInfo.callName}</span>
                  <span className="status-dialog-handler">{dogInfo.handler}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20}  style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          </button>
        </div>

        <div className="dialog-content">
          <div className={showDescriptions ? "status-grid" : "status-options-grid"}>
            <div
              className={showDescriptions ? "status-item status-none" : "status-option status-none"}
              onMouseDown={() => handleStatusSelect('none')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStatusSelect('none');
                }
              }}
            >
              {showDescriptions ? (
                <>
                  <div className="status-icon">
                    <Circle />
                  </div>
                  <div className="status-content">
                    <label className="status-label">Not Checked-in</label>
                    <div className="status-description">Dog has not checked in yet</div>
                  </div>
                </>
              ) : (
                <>
                  <span className="popup-icon">⚪</span>
                  <span className="status-text">Not Checked In</span>
                </>
              )}
            </div>

            <div
              className={showDescriptions ? "status-item status-checked-in" : "status-option status-checked-in"}
              onMouseDown={() => handleStatusSelect('checked-in')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStatusSelect('checked-in');
                }
              }}
            >
              {showDescriptions ? (
                <>
                  <div className="status-icon">
                    <Check />
                  </div>
                  <div className="status-content">
                    <label className="status-label">Checked-in</label>
                    <div className="status-description">Dog is ready to compete</div>
                  </div>
                </>
              ) : (
                <>
                  <Check className="popup-icon" />
                  <span className="status-text">Check-in</span>
                </>
              )}
            </div>

            <div
              className={showDescriptions ? "status-item status-come-to-gate" : "status-option status-come-to-gate"}
              onMouseDown={() => handleStatusSelect('come-to-gate')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStatusSelect('come-to-gate');
                }
              }}
            >
              {showDescriptions ? (
                <>
                  <div className="status-icon">
                    <Bell />
                  </div>
                  <div className="status-content">
                    <label className="status-label">Come to Gate</label>
                    <div className="status-description">Gate steward calling exhibitor</div>
                  </div>
                </>
              ) : (
                <>
                  <Bell className="popup-icon" />
                  <span className="status-text">Come to Gate</span>
                </>
              )}
            </div>

            <div
              className={showDescriptions ? "status-item status-at-gate" : "status-option status-at-gate"}
              onMouseDown={() => handleStatusSelect('at-gate')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStatusSelect('at-gate');
                }
              }}
            >
              {showDescriptions ? (
                <>
                  <div className="status-icon">
                    <Star />
                  </div>
                  <div className="status-content">
                    <label className="status-label">At Gate</label>
                    <div className="status-description">Dog is waiting at the ring entrance</div>
                  </div>
                </>
              ) : (
                <>
                  <Star className="popup-icon" />
                  <span className="status-text">At Gate</span>
                </>
              )}
            </div>

            <div
              className={showDescriptions ? "status-item status-conflict" : "status-option status-conflict"}
              onMouseDown={() => handleStatusSelect('conflict')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStatusSelect('conflict');
                }
              }}
            >
              {showDescriptions ? (
                <>
                  <div className="status-icon">
                    <AlertTriangle />
                  </div>
                  <div className="status-content">
                    <label className="status-label">Conflict</label>
                    <div className="status-description">Dog entered in multiple classes</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="popup-icon" />
                  <span className="status-text">Conflict</span>
                </>
              )}
            </div>

            <div
              className={showDescriptions ? "status-item status-pulled" : "status-option status-pulled"}
              onMouseDown={() => handleStatusSelect('pulled')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStatusSelect('pulled');
                }
              }}
            >
              {showDescriptions ? (
                <>
                  <div className="status-icon">
                    <XCircle />
                  </div>
                  <div className="status-content">
                    <label className="status-label">Pulled</label>
                    <div className="status-description">Dog has been withdrawn from class</div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="popup-icon" />
                  <span className="status-text">Pulled</span>
                </>
              )}
            </div>

            {showRingManagement && (
              <>
                <div
                  className={showDescriptions ? "status-item status-in-ring" : "status-option status-in-ring"}
                  onMouseDown={() => handleStatusSelect('in-ring')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStatusSelect('in-ring');
                    }
                  }}
                >
                  {showDescriptions ? (
                    <>
                      <div className="status-icon">
                        <Target />
                      </div>
                      <div className="status-content">
                        <label className="status-label">In Ring</label>
                        <div className="status-description">Dog is currently competing in the ring</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Target className="popup-icon" />
                      <span className="status-text">In Ring</span>
                    </>
                  )}
                </div>

                <div
                  className={showDescriptions ? "status-item status-completed" : "status-option status-completed"}
                  onMouseDown={() => handleStatusSelect('completed')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStatusSelect('completed');
                    }
                  }}
                >
                  {showDescriptions ? (
                    <>
                      <div className="status-icon">
                        <CheckCircle />
                      </div>
                      <div className="status-content">
                        <label className="status-label">Completed</label>
                        <div className="status-description">Dog has finished competing (no score)</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="popup-icon" />
                      <span className="status-text">Completed</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};