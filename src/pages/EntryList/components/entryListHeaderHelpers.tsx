/**
 * EntryListHeader Helper Components
 *
 * Extracted from EntryListHeader.tsx to reduce complexity.
 * Contains actions menu, trial info, and status badge components.
 */

/* eslint-disable react-refresh/only-export-components */

import React, { useState } from 'react';
import {
  RefreshCw,
  MoreVertical,
  Printer,
  ClipboardCheck,
  ClipboardList,
  ListOrdered,
  Trophy,
  Settings,
  ChevronDown,
  ChevronUp,
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

export interface PrintOptionGroup {
  groupLabel: string;
  groupIcon: 'checkin' | 'results' | 'scoresheet';
  items: PrintOption[];
}

export interface ActionsMenuConfig {
  showRunOrder?: boolean;
  showRecalculatePlacements?: boolean;
  showClassSettings?: boolean;
  isRecalculatingPlacements?: boolean;
  onRunOrderClick?: () => void;
  onRecalculatePlacements?: () => void;
  onClassSettingsClick?: () => void;
  printOptions: (PrintOption | PrintOptionGroup)[];
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

/** Helper to render the icon for a given print option type */
const PrintIcon: React.FC<{ icon: 'checkin' | 'results' | 'scoresheet' }> = ({ icon }) => {
  if (icon === 'checkin') return <Printer className="h-4 w-4" />;
  if (icon === 'scoresheet') return <ClipboardList className="h-4 w-4" />;
  return <ClipboardCheck className="h-4 w-4" />;
};

/** Type guard: is this a group or a flat option? */
function isPrintOptionGroup(item: PrintOption | PrintOptionGroup): item is PrintOptionGroup {
  return 'groupLabel' in item;
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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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
    setExpandedGroup(null);
    option.onClick();
  };

  const toggleGroup = (label: string) => {
    setExpandedGroup(prev => prev === label ? null : label);
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

          {/* Print options — supports both flat items and expandable groups */}
          {actionsMenu.printOptions.map((item, index) =>
            isPrintOptionGroup(item) ? (
              <React.Fragment key={index}>
                <button
                  className="action-menu-group-header"
                  onClick={() => toggleGroup(item.groupLabel)}
                >
                  <PrintIcon icon={item.groupIcon} />
                  {item.groupLabel}
                  <span className="group-chevron">
                    {expandedGroup === item.groupLabel
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>
                {expandedGroup === item.groupLabel && item.items.map((sub, subIndex) => (
                  <button
                    key={subIndex}
                    onClick={() => handlePrintOption(sub)}
                    className="action-menu-item action-menu-subitem"
                    disabled={sub.disabled}
                  >
                    {sub.label}
                  </button>
                ))}
              </React.Fragment>
            ) : (
              <button
                key={index}
                onClick={() => handlePrintOption(item)}
                className="action-menu-item"
                disabled={item.disabled}
              >
                <PrintIcon icon={item.icon} />
                {item.label}
              </button>
            )
          )}
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

// ClassInfoPopup has been replaced by ClassDetailsPopover in @/components/dialogs/ClassDetailsPopover.tsx
