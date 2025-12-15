/**
 * EntryListHeader Helper Components
 *
 * Extracted from EntryListHeader.tsx to reduce complexity.
 * Contains actions menu, trial info, and status badge components.
 */

/* eslint-disable react-refresh/only-export-components */

import React from 'react';
import {
  RefreshCw,
  MoreVertical,
  Printer,
  ClipboardCheck,
  ClipboardList,
  ListOrdered,
  Trophy,
  Settings
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface PrintOption {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: 'checkin' | 'results' | 'scoresheet';
}

export interface ActionsMenuConfig {
  showRunOrder?: boolean;
  showRecalculatePlacements?: boolean;
  showClassSettings?: boolean;
  isRecalculatingPlacements?: boolean;
  onRunOrderClick?: () => void;
  onRecalculatePlacements?: () => void;
  onClassSettingsClick?: () => void;
  printOptions: PrintOption[];
}

// ============================================================================
// Actions Dropdown Menu
// ============================================================================

interface ActionsDropdownMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  actionsMenu: ActionsMenuConfig;
  /** Long press handlers for hard refresh */
  refreshLongPressHandlers?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export const ActionsDropdownMenu: React.FC<ActionsDropdownMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  isRefreshing,
  onRefresh,
  actionsMenu,
  refreshLongPressHandlers
}) => {
  const handleRefresh = () => {
    onClose();
    onRefresh();
  };

  const handleRunOrder = () => {
    onClose();
    actionsMenu.onRunOrderClick?.();
  };

  const handleRecalculate = () => {
    onClose();
    actionsMenu.onRecalculatePlacements?.();
  };

  const handleClassSettings = () => {
    onClose();
    actionsMenu.onClassSettingsClick?.();
  };

  const handlePrintOption = (option: PrintOption) => {
    onClose();
    option.onClick();
  };

  return (
    <div className="actions-menu-container">
      <button
        className="icon-button actions-button"
        onClick={onToggle}
        aria-label="Actions menu"
        title="More Actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="actions-dropdown-menu">
          {/* Refresh - Primary action (long press for full page reload) */}
          <button
            onClick={handleRefresh}
            className="action-menu-item"
            disabled={isRefreshing}
            title="Refresh (long press for full reload)"
            {...refreshLongPressHandlers}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'rotating' : ''}`} />
            Refresh
          </button>

          {/* Divider after primary action */}
          <div className="menu-divider" />

          {/* Secondary actions */}
          {actionsMenu.showRunOrder && actionsMenu.onRunOrderClick && (
            <button
              onClick={handleRunOrder}
              className="action-menu-item"
            >
              <ListOrdered className="h-4 w-4" />
              Set Run Order
            </button>
          )}
          {actionsMenu.showRecalculatePlacements && actionsMenu.onRecalculatePlacements && (
            <button
              onClick={handleRecalculate}
              className="action-menu-item"
              disabled={actionsMenu.isRecalculatingPlacements}
            >
              <Trophy className={`h-4 w-4 ${actionsMenu.isRecalculatingPlacements ? 'rotating' : ''}`} />
              Recalculate Placements
            </button>
          )}
          {actionsMenu.showClassSettings && actionsMenu.onClassSettingsClick && (
            <button
              onClick={handleClassSettings}
              className="action-menu-item"
            >
              <Settings className="h-4 w-4" />
              Class Options
            </button>
          )}

          {/* Divider before print options */}
          <div className="menu-divider" />

          {/* Print options */}
          {actionsMenu.printOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handlePrintOption(option)}
              className="action-menu-item"
              disabled={option.disabled}
            >
              {option.icon === 'checkin' ? (
                <Printer className="h-4 w-4" />
              ) : option.icon === 'scoresheet' ? (
                <ClipboardList className="h-4 w-4" />
              ) : (
                <ClipboardCheck className="h-4 w-4" />
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Trial Info Display
// ============================================================================

import { formatTrialDate } from '../../../utils/dateUtils';

interface TrialInfoProps {
  trialDate?: string | null;
  trialNumber?: string | null;
  judgeName?: string | null;
}

export const TrialInfo: React.FC<TrialInfoProps> = ({ trialDate, trialNumber, judgeName }) => {
  const showDate = trialDate && trialDate !== '';
  const showNumber = trialNumber && trialNumber !== '' && trialNumber !== '0';
  const showJudge = judgeName && judgeName !== '' && judgeName !== 'TBD';

  // Build items array for clean separator handling
  const items: React.ReactNode[] = [];

  if (showDate) {
    items.push(
      <span key="date" className="trial-date-text">{formatTrialDate(trialDate)}</span>
    );
  }
  if (showNumber) {
    items.push(
      <span key="number" className="trial-number-text">Trial {trialNumber}</span>
    );
  }
  if (showJudge) {
    items.push(
      <span key="judge" className="trial-judge-text">Judge: {judgeName}</span>
    );
  }

  return (
    <div className="trial-info-simple">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="trial-separator">•</span>}
          {item}
        </React.Fragment>
      ))}
    </div>
  );
};

// ============================================================================
// Status Badge
// ============================================================================

interface StatusBadgeInfo {
  text: string;
  className: string;
}

export function getStatusBadge(classStatus?: string): StatusBadgeInfo | null {
  switch (classStatus) {
    case 'in_progress':
      return { text: 'IN PROGRESS', className: 'status-in-progress' };
    case 'briefing':
      return { text: 'BRIEFING NOW', className: 'status-briefing' };
    case 'start_time':
    case 'setup':
      return { text: 'UPCOMING', className: 'status-upcoming' };
    default:
      return null;
  }
}

interface ClassStatusBadgeProps {
  classStatus?: string;
}

export const ClassStatusBadge: React.FC<ClassStatusBadgeProps> = ({ classStatus }) => {
  const statusBadge = getStatusBadge(classStatus);

  if (!statusBadge) return null;

  return (
    <>
      <span className="trial-separator">•</span>
      <span className={`class-status-badge ${statusBadge.className}`}>
        {statusBadge.text}
      </span>
    </>
  );
};

// ============================================================================
// Sections Badge (for combined view)
// ============================================================================

interface SectionsBadgeProps {
  show: boolean;
  judgeName?: string | null;
  judgeNameB?: string | null;
}

export const SectionsBadge: React.FC<SectionsBadgeProps> = ({ show, judgeName, judgeNameB }) => {
  if (!show || !judgeNameB || judgeNameB === judgeName) {
    return null;
  }

  return (
    <>
      <span className="trial-separator">•</span>
      <span className="class-status-badge sections-badge">Section A & B</span>
    </>
  );
};

// ============================================================================
// Class Info Popup - Shows additional details on tap
// ============================================================================

import type { ClassInfo } from '../hooks';
import { User, Activity, Users } from 'lucide-react';

interface ClassInfoPopupProps {
  isOpen: boolean;
  classInfo: ClassInfo | null;
  showSectionsBadge?: boolean;
  onClose: () => void;
}

export const ClassInfoPopup: React.FC<ClassInfoPopupProps> = ({
  isOpen,
  classInfo,
  showSectionsBadge = false,
  onClose
}) => {
  if (!isOpen || !classInfo) return null;

  const statusBadge = getStatusBadge(classInfo.classStatus);
  const hasJudgeB = showSectionsBadge && classInfo.judgeNameB && classInfo.judgeNameB !== classInfo.judgeName;

  return (
    <div className="class-info-popup">
      <div className="popup-header">
        <span className="popup-title">Class Details</span>
        <button className="popup-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="popup-content">
        {/* Status */}
        {statusBadge && (
          <div className="popup-row">
            <Activity className="popup-icon" />
            <span className="popup-label">Status:</span>
            <span className={`class-status-badge ${statusBadge.className}`}>
              {statusBadge.text}
            </span>
          </div>
        )}

        {/* Judge */}
        {classInfo.judgeName && classInfo.judgeName !== 'TBD' && (
          <div className="popup-row">
            <User className="popup-icon" />
            <span className="popup-label">Judge:</span>
            <span className="popup-value">{classInfo.judgeName}</span>
          </div>
        )}

        {/* Judge B (for combined sections) */}
        {hasJudgeB && (
          <div className="popup-row">
            <Users className="popup-icon" />
            <span className="popup-label">Judge B:</span>
            <span className="popup-value">{classInfo.judgeNameB}</span>
          </div>
        )}

        {/* Entry counts */}
        {classInfo.totalEntries !== undefined && (
          <div className="popup-row">
            <span className="popup-label">Entries:</span>
            <span className="popup-value">
              {classInfo.completedEntries || 0} / {classInfo.totalEntries} completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
