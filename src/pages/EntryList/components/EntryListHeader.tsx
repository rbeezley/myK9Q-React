import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { HamburgerMenu, CompactOfflineIndicator, SyncIndicator, RefreshIndicator, FilterTriggerButton } from '../../../components/ui';
import type { ClassInfo } from '../hooks';
import {
  ActionsDropdownMenu,
  TrialInfo,
  ClassStatusBadge,
  SectionsBadge,
  type ActionsMenuConfig
} from './entryListHeaderHelpers';

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
      <CompactOfflineIndicator />
      <div className="class-info">
        <div className="class-title-row">
          <h1>
            <Users className="title-icon" />
            {classInfo?.className?.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
          <ClassStatusBadge classStatus={classInfo?.classStatus} />
          <SectionsBadge
            show={showSectionsBadge}
            judgeName={classInfo?.judgeName}
            judgeNameB={classInfo?.judgeNameB}
          />
        </div>
        <div className="class-subtitle">
          <TrialInfo
            trialDate={classInfo?.trialDate}
            trialNumber={classInfo?.trialNumber}
            judgeName={classInfo?.judgeName}
          />
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
        <ActionsDropdownMenu
          isOpen={showActionsMenu}
          onToggle={() => setShowActionsMenu(!showActionsMenu)}
          onClose={() => setShowActionsMenu(false)}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          actionsMenu={actionsMenu}
        />
      </div>
    </header>
  );
};

export default EntryListHeader;
