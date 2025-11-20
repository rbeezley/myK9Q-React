/**
 * Settings Page
 *
 * Comprehensive app settings organized into sections.
 * Users can control display, performance, mobile, sync, notifications, etc.
 */

import React from 'react';
import { HamburgerMenu, SettingsSearch, useSearchableSettings } from '@/components/ui';
import { Settings as SettingsIcon, MoreVertical, RefreshCw, AlertCircle } from 'lucide-react';
import { useSettingsLogic } from './hooks/useSettingsLogic';

// Sections
import { GeneralSettings } from './sections/GeneralSettings';
import { AppearanceSettings } from './sections/AppearanceSettings';
import { NotificationSettings } from './sections/NotificationSettings';
import { ScoringSettings } from './sections/ScoringSettings';
import { PrivacySettings } from './sections/PrivacySettings';
import { AdvancedSettings } from './sections/AdvancedSettings';

import './Settings.css';

export function Settings() {
  const {
    settings: _settings,
    toast,
    showResetConfirm,
    showClearDataConfirm,
    isClearing,
    searchQuery,
    storageUsage,
    isPushSubscribed,
    isSubscribing,
    permissionState,
    browserCompatibility,
    fileInputRef,
    role,

    setSearchQuery,
    setShowResetConfirm,
    setShowClearDataConfirm,

    resetSettings,
    handleDevModeTap,
    handlePushToggle,
    handleClearData,
    handleExportData,
    handleExportSettings,
    handleImportClick,
    handleImportFile,
    handleRefresh,
    handleShowOnboarding
  } = useSettingsLogic();

  const searchableSettings = useSearchableSettings();
  const [showHeaderMenu, setShowHeaderMenu] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('all'); // Added state

  // Close menu when clicking outside
  React.useEffect(() => {
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

  // Added shouldShowSection function
  const shouldShowSection = (category: string) => {
    if (selectedCategory === 'all') return true;
    return selectedCategory === category;
  };

  return (
    <div className="settings-container" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <header className="page-header settings-header" style={{ background: 'transparent', backdropFilter: 'none' }}>
        <HamburgerMenu currentPage="settings" />
        <div className="header-content" onClick={handleDevModeTap}>
          <h1>
            <SettingsIcon className="title-icon" />
            Settings
          </h1>
        </div>
        <div className="dropdown-container">
          <button
            className="header-menu-button"
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
            aria-label="Page options"
          >
            <MoreVertical size={20} />
          </button>
          {showHeaderMenu && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  handleRefresh();
                  setShowHeaderMenu(false);
                }}
              >
                <RefreshCw size={18} />
                <span>Refresh</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowResetConfirm(true);
                  setShowHeaderMenu(false);
                }}
              >
                <AlertCircle size={18} />
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="settings-content">
        <div className="settings-layout-wrapper">
          {/* Search Settings */}
          <SettingsSearch
            settings={searchableSettings}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            showCategoryFilter={true}
            placeholder="Search settings..."
            autoFocus={false}
            selectedCategory={selectedCategory} // Added selectedCategory prop
            onCategoryChange={setSelectedCategory} // Added onCategoryChange prop
          />

          {/* Sections */}
          {shouldShowSection('General') && ( // Conditional rendering
            <GeneralSettings onShowOnboarding={handleShowOnboarding} />
          )}

          {shouldShowSection('Appearance') && ( // Conditional rendering
            <AppearanceSettings />
          )}

          {shouldShowSection('Notifications') && ( // Conditional rendering
            <NotificationSettings
              isPushSubscribed={isPushSubscribed}
              isSubscribing={isSubscribing}
              permissionState={permissionState}
              onPushToggle={handlePushToggle}
              browserCompatibility={browserCompatibility}
            />
          )}

          {shouldShowSection('Scoring') && ( // Conditional rendering
            <ScoringSettings />
          )}

          {shouldShowSection('Privacy') && ( // Conditional rendering
            <PrivacySettings />
          )}

          {/* Admin Only Section */}
          {role === 'admin' && shouldShowSection('Advanced') && ( // Conditional rendering
            <AdvancedSettings
              storageUsage={storageUsage}
              onExportData={handleExportData}
              onClearData={() => setShowClearDataConfirm(true)}
              onExportSettings={handleExportSettings}
              onImportSettings={handleImportClick}
              isClearing={isClearing}
            />
          )}

          {/* Hidden File Input for Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearDataConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearDataConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Clear All Personal Data?</h3>
            <p style={{ marginBottom: '1rem' }}>
              This will permanently delete:
            </p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', lineHeight: '1.6' }}>
              <li>All favorited dogs (❤️)</li>
              <li>All app settings and preferences</li>
              <li>Scroll positions and UI state</li>
              <li>Notification preferences</li>
              <li>All locally cached data</li>
            </ul>
            <p className="modal-hint" style={{ fontWeight: 600, color: '#ef4444' }}>
              You will remain logged in, but all other data will be lost. This cannot be undone.
            </p>
            <p className="modal-hint">
              💡 Tip: Use "Export My Data" first if you want to keep a backup.
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowClearDataConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="danger-button"
                onClick={handleClearData}
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reset All Settings?</h3>
            <p>This will restore all settings to their default values. This cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="danger-button"
                onClick={() => {
                  resetSettings();
                  setShowResetConfirm(false);
                }}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
