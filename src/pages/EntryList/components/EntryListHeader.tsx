import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw, MoreVertical, Printer, ClipboardCheck, ListOrdered, Trophy } from 'lucide-react';
import { HamburgerMenu, SyncIndicator, RefreshIndicator, FilterTriggerButton } from '../../../components/ui';
import { formatTrialDate } from '../../../utils/dateUtils';
import type { ClassInfo } from '../hooks';

export interface EntryListHeaderProps {
  classInfo: ClassInfo | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasError: boolean;
  hasActiveFilters: boolean;
  onFilterClick: () => void;
  onRefresh: () => void;
  /** Actions menu items configuration */
  actionsMenu: {
    showRunOrder?: boolean;
    showRecalculatePlacements?: boolean;
    isRecalculatingPlacements?: boolean;
    onRunOrderClick?: () => void;
    onRecalculatePlacements?: () => void;
    printOptions: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      icon: 'checkin' | 'results';
    }[];
  };
  /** For combined view - show section badge */
  showSectionsBadge?: boolean;
}

/**
 * Get status badge configuration based on class status
 */
function getStatusBadge(classStatus?: string): { text: string; className: string } | null {
  if (classStatus === 'in_progress') {
    return { text: 'IN PROGRESS', className: 'status-in-progress' };
  } else if (classStatus === 'briefing') {
    return { text: 'BRIEFING NOW', className: 'status-briefing' };
  } else if (classStatus === 'start_time') {
    return { text: 'UPCOMING', className: 'status-upcoming' };
  } else if (classStatus === 'setup') {
    return { text: 'UPCOMING', className: 'status-upcoming' };
  }
  return null;
}

/**
 * Shared header component for EntryList and CombinedEntryList.
 * Displays class information, status indicators, and action menus.
 */
export const EntryListHeader: React.FC<EntryListHeaderProps> = ({
  classInfo,
  isRefreshing,
  isSyncing,
  hasError,
  hasActiveFilters,
  onFilterClick,
  onRefresh,
  actionsMenu,
  showSectionsBadge = false,
}) => {
  const navigate = useNavigate();
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);

  const statusBadge = getStatusBadge(classInfo?.classStatus);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsMenu]);

  return (
    <header className="page-header entry-list-header">
      <HamburgerMenu
        backNavigation={{
          label: "Back to Classes",
          action: () => navigate(-1)
        }}
        currentPage="entries"
      />
      <div className="class-info">
        <div className="class-title-row">
          <h1>
            <Users className="title-icon" />
            {classInfo?.className?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
          {statusBadge && (
            <>
              <span className="trial-separator">•</span>
              <span className={`class-status-badge ${statusBadge.className}`}>
                {statusBadge.text}
              </span>
            </>
          )}
          {/* Show Section A/B indicator for combined view */}
          {showSectionsBadge && classInfo?.judgeNameB && classInfo.judgeNameB !== classInfo.judgeName && (
            <>
              <span className="trial-separator">•</span>
              <span className="class-status-badge sections-badge">Section A & B</span>
            </>
          )}
        </div>
        <div className="class-subtitle">
          <div className="trial-info-simple">
            {classInfo?.trialDate && classInfo.trialDate !== '' && (
              <span className="trial-date-text">{formatTrialDate(classInfo.trialDate)}</span>
            )}
            {classInfo?.trialDate && classInfo?.trialNumber && classInfo.trialNumber !== '' && classInfo.trialNumber !== '0' && (
              <span className="trial-separator">•</span>
            )}
            {classInfo?.trialNumber && classInfo.trialNumber !== '' && classInfo.trialNumber !== '0' && (
              <span className="trial-number-text">Trial {classInfo.trialNumber}</span>
            )}
          </div>
        </div>
      </div>

      <div className="header-buttons">
        {isRefreshing && <RefreshIndicator isRefreshing={isRefreshing} />}

        {isSyncing && (
          <SyncIndicator
            status="syncing"
            compact
          />
        )}
        {hasError && (
          <SyncIndicator
            status="error"
            compact
            errorMessage="Sync failed"
          />
        )}

        {/* Filter button */}
        <FilterTriggerButton
          onClick={onFilterClick}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Actions Menu (3-dot menu) */}
        <div className="actions-menu-container">
          <button
            className="icon-button actions-button"
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            aria-label="Actions menu"
            title="More Actions"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showActionsMenu && (
            <div className="actions-dropdown-menu">
              <button
                onClick={() => {
                  setShowActionsMenu(false);
                  onRefresh();
                }}
                className="action-menu-item"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'rotating' : ''}`} />
                Refresh
              </button>
              {actionsMenu.showRunOrder && actionsMenu.onRunOrderClick && (
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    actionsMenu.onRunOrderClick?.();
                  }}
                  className="action-menu-item"
                >
                  <ListOrdered className="h-4 w-4" />
                  Set Run Order
                </button>
              )}
              {actionsMenu.showRecalculatePlacements && actionsMenu.onRecalculatePlacements && (
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    actionsMenu.onRecalculatePlacements?.();
                  }}
                  className="action-menu-item"
                  disabled={actionsMenu.isRecalculatingPlacements}
                >
                  <Trophy className={`h-4 w-4 ${actionsMenu.isRecalculatingPlacements ? 'rotating' : ''}`} />
                  Recalculate Placements
                </button>
              )}
              <div className="menu-divider" />
              {actionsMenu.printOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setShowActionsMenu(false);
                    option.onClick();
                  }}
                  className="action-menu-item"
                  disabled={option.disabled}
                >
                  {option.icon === 'checkin' ? (
                    <Printer className="h-4 w-4" />
                  ) : (
                    <ClipboardCheck className="h-4 w-4" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default EntryListHeader;
