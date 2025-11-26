/**
 * AdminHeader Component
 *
 * Page header for CompetitionAdmin with navigation menu and show info.
 * Includes hamburger menu, title, and options dropdown.
 *
 * Extracted from CompetitionAdmin.tsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HamburgerMenu } from '../../../components/ui';
import { RefreshCw, Settings, History, MoreVertical } from 'lucide-react';
import type { ShowInfo } from '../hooks/useCompetitionAdminData';

export interface AdminHeaderProps {
  /** Show information to display */
  showInfo: ShowInfo | null | undefined;
  /** License key for navigation */
  licenseKey: string | undefined;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Callback to refresh data */
  onRefresh: () => void;
}

/**
 * AdminHeader Component
 *
 * Displays the page header with:
 * - Hamburger menu for navigation
 * - Page title and show info
 * - Options dropdown (refresh, audit log)
 */
export function AdminHeader({
  showInfo,
  licenseKey,
  isLoading,
  onRefresh
}: AdminHeaderProps): React.ReactElement {
  const navigate = useNavigate();
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowHeaderMenu(false);
      }
    };

    if (showHeaderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showHeaderMenu]);

  return (
    <header className="page-header admin-header">
      <div className="header-content">
        <HamburgerMenu currentPage="admin" />
        <div className="header-info">
          <div className="header-title">
            <Settings className="header-icon" />
            <span>Results Control</span>
          </div>
          <div className="header-subtitle">
            {showInfo ? (
              <>
                {showInfo.showName}
                {showInfo.organization && ` • ${showInfo.organization}`}
              </>
            ) : (
              'Loading...'
            )}
          </div>
        </div>
        <div className="dropdown-container">
          <button
            className="icon-button"
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
            aria-label="More options"
            title="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showHeaderMenu && (
            <div className="dropdown-menu" style={{ right: 0, minWidth: '180px' }}>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowHeaderMenu(false);
                  onRefresh();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`dropdown-icon ${isLoading ? 'rotating' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowHeaderMenu(false);
                  navigate(`/admin/${licenseKey}/audit-log`);
                }}
              >
                <History className="dropdown-icon" />
                <span>Audit Log</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
