import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { HamburgerMenu, CompactOfflineIndicator, SyncIndicator, RefreshIndicator, FilterTriggerButton } from '../../../components/ui';
import type { ClassInfo } from '../hooks';
import {
  ActionsDropdownMenu,
  ClassInfoPopup,
  getStatusBadge,
  type ActionsMenuConfig
} from './entryListHeaderHelpers';
import { formatTrialDate } from '../../../utils/dateUtils';

export interface EntryListHeaderProps {
  classInfo: ClassInfo | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasError: boolean;
  hasActiveFilters: boolean;
  onFilterClick: () => void;
  onRefresh: () => void;
  /** Actions menu items configuration */
  actionsMenu: ActionsMenuConfig;
  /** For combined view - show section badge */
  showSectionsBadge?: boolean;
  /** Long press handlers for hard refresh */
  refreshLongPressHandlers?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
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
  refreshLongPressHandlers,
}) => {
  const navigate = useNavigate();
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);
  const [showInfoPopup, setShowInfoPopup] = React.useState(false);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setShowActionsMenu(false);
      }
      if (!target.closest('.class-info-clickable')) {
        setShowInfoPopup(false);
      }
    };

    if (showActionsMenu || showInfoPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsMenu, showInfoPopup]);

  // Build trial info string
  const trialInfoParts: string[] = [];
  if (classInfo?.trialDate) {
    trialInfoParts.push(formatTrialDate(classInfo.trialDate));
  }
  if (classInfo?.trialNumber && classInfo.trialNumber !== '0') {
    trialInfoParts.push(`Trial ${classInfo.trialNumber}`);
  }
  const trialInfoText = trialInfoParts.join(' • ');

  // Check if there's extra info to show in popup
  const statusBadge = getStatusBadge(classInfo?.classStatus);
  const hasExtraInfo = classInfo?.judgeName || statusBadge || (showSectionsBadge && classInfo?.judgeNameB);

  return (
    <header className="page-header entry-list-header">
      <HamburgerMenu
        backNavigation={{
          label: "Back to Classes",
          action: () => navigate(-1)
        }}
        currentPage="entries"
      />
      <CompactOfflineIndicator />
      {/* Class info - hover/tap to show details popup */}
      <div
        className={`class-info ${hasExtraInfo ? 'class-info-clickable' : ''}`}
        onClick={hasExtraInfo ? () => setShowInfoPopup(!showInfoPopup) : undefined}
        onMouseEnter={hasExtraInfo ? () => setShowInfoPopup(true) : undefined}
        onMouseLeave={hasExtraInfo ? () => setShowInfoPopup(false) : undefined}
        role={hasExtraInfo ? 'button' : undefined}
        tabIndex={hasExtraInfo ? 0 : undefined}
        onKeyDown={hasExtraInfo ? (e) => e.key === 'Enter' && setShowInfoPopup(!showInfoPopup) : undefined}
      >
        {/* Class name with small info indicator */}
        <div className="class-name-wrapper">
          <h1 className="class-name">
            {classInfo?.className?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Loading...'}
          </h1>
          {hasExtraInfo && (
            <span className="info-indicator" aria-hidden="true">
              <Info size={12} />
            </span>
          )}
        </div>
        {/* Trial date and number */}
        {trialInfoText && (
          <div className="class-meta-row">
            <span className="trial-meta-text">{trialInfoText}</span>
          </div>
        )}
        {/* Popup positioned relative to class-info */}
        {hasExtraInfo && (
          <ClassInfoPopup
            isOpen={showInfoPopup}
            classInfo={classInfo}
            showSectionsBadge={showSectionsBadge}
            onClose={() => setShowInfoPopup(false)}
          />
        )}
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
        <ActionsDropdownMenu
          isOpen={showActionsMenu}
          onToggle={() => setShowActionsMenu(!showActionsMenu)}
          onClose={() => setShowActionsMenu(false)}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          actionsMenu={actionsMenu}
          refreshLongPressHandlers={refreshLongPressHandlers}
        />
      </div>
    </header>
  );
};

export default EntryListHeader;
