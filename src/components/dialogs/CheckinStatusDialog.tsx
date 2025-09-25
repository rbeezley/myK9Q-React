import React from 'react';
import { ArmbandBadge } from '../ui';
import { usePermission } from '../../hooks/usePermission';
import {
  Circle,
  Check,
  XCircle,
  AlertTriangle,
  Star
} from 'lucide-react';
import './CheckinStatusDialog.css';

export type CheckinStatus = 'none' | 'checked-in' | 'conflict' | 'pulled' | 'at-gate';

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
}

export const CheckinStatusDialog: React.FC<CheckinStatusDialogProps> = ({
  isOpen,
  onClose,
  onStatusChange,
  dogInfo,
  showDescriptions = false
}) => {
  const { hasPermission } = usePermission();

  if (!isOpen) return null;

  const handleStatusSelect = (status: CheckinStatus) => {
    onStatusChange(status);
    onClose();
  };

  return (
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
              <span className="status-dialog-action">Change Status</span>
            </div>
          </div>
          <button
            className="close-button"
            onClick={onClose}
          >
            ✕
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
                    <Circle className="h-5 w-5" />
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
                    <Check className="h-5 w-5" />
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
                    <AlertTriangle className="h-5 w-5" />
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
                    <XCircle className="h-5 w-5" />
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
                    <Star className="h-5 w-5" />
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
          </div>
        </div>
      </div>
    </div>
  );
};