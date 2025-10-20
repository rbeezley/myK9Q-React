/**
 * Settings Page
 *
 * Comprehensive app settings organized into sections.
 * Users can control display, performance, mobile, sync, notifications, etc.
 */

import { useState, useRef } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { PerformanceSettingsPanel, HamburgerMenu } from '@/components/ui';
import { clearAllCaches, clearScrollPositions, undoCacheClear, canUndoCacheClear } from '@/utils/cacheManager';
import './Settings.css';

export function Settings() {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettingsStore();
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Export settings
  const handleExport = () => {
    try {
      const json = exportSettings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `myK9Q-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Settings exported successfully!');
    } catch (error) {
      showToast('Failed to export settings', 'error');
      console.error('Export error:', error);
    }
  };

  // Import settings
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = importSettings(text);

      if (success) {
        showToast('Settings imported successfully!');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showToast('Failed to import settings - invalid file format', 'error');
      }
    } catch (error) {
      showToast('Failed to read settings file', 'error');
      console.error('Import error:', error);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    setShowClearCacheConfirm(false);
    setIsClearing(true);

    try {
      await clearAllCaches({ enableUndo: true, undoDuration: 5000 });
      showToast('Cache cleared successfully! Undo available for 5 seconds.', 'success');

      // Show undo option
      setTimeout(() => {
        if (canUndoCacheClear()) {
          // Still within undo window
        }
      }, 100);
    } catch (error) {
      showToast('Failed to clear cache', 'error');
      console.error('Clear cache error:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Undo cache clear
  const handleUndoCacheClear = () => {
    if (undoCacheClear()) {
      showToast('Cache clear undone!', 'info');
    }
  };

  // Clear scroll positions
  const handleClearScrollPositions = () => {
    try {
      clearScrollPositions();
      showToast('Scroll positions cleared!');
    } catch (error) {
      showToast('Failed to clear scroll positions', 'error');
      console.error('Clear scroll error:', error);
    }
  };

  return (
    <div className="settings-page">
      <HamburgerMenu currentPage="settings" />
      <div className="settings-header">
        <h1>Settings</h1>
        <button
          className="reset-all-btn"
          onClick={() => setShowResetConfirm(true)}
        >
          Reset All
        </button>
      </div>

      {/* Display Section */}
      <section className="settings-section">
        <h2>Display</h2>
        <p className="section-description">Customize how the app looks</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="theme">Theme</label>
            <span className="setting-hint">Choose light, dark, or automatic</span>
          </div>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as any })}
          >
            <option value="auto">Auto (System)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="fontSize">Font Size</label>
            <span className="setting-hint">Adjust text size for readability</span>
          </div>
          <select
            id="fontSize"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="density">Spacing</label>
            <span className="setting-hint">How much space between elements</span>
          </div>
          <select
            id="density"
            value={settings.density}
            onChange={(e) => updateSettings({ density: e.target.value as any })}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="reduceMotion">Reduce Motion</label>
            <span className="setting-hint">Minimize animations and transitions</span>
          </div>
          <label className="toggle-switch">
            <input
              id="reduceMotion"
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => updateSettings({ reduceMotion: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="highContrast">High Contrast</label>
            <span className="setting-hint">Increase color contrast for visibility</span>
          </div>
          <label className="toggle-switch">
            <input
              id="highContrast"
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => updateSettings({ highContrast: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>

      {/* Performance Section */}
      <section className="settings-section">
        <h2>Performance</h2>
        <p className="section-description">Optimize for your device</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="performanceMode">Performance Mode</label>
            <span className="setting-hint">Auto adapts to your device</span>
          </div>
          <select
            id="performanceMode"
            value={settings.performanceMode}
            onChange={(e) => updateSettings({ performanceMode: e.target.value as any })}
          >
            <option value="auto">Auto (Recommended)</option>
            <option value="high">High Performance</option>
            <option value="medium">Balanced</option>
            <option value="low">Power Saver</option>
          </select>
        </div>

        <button
          className="link-button"
          onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
        >
          {showPerformanceDetails ? 'Hide' : 'Show'} Performance Details
        </button>

        {showPerformanceDetails && (
          <div className="performance-details">
            <PerformanceSettingsPanel />
          </div>
        )}

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="imageQuality">Image Quality</label>
            <span className="setting-hint">Lower quality saves data</span>
          </div>
          <select
            id="imageQuality"
            value={settings.imageQuality}
            onChange={(e) => updateSettings({ imageQuality: e.target.value as any })}
          >
            <option value="low">Low (Saves Data)</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="original">Original</option>
          </select>
        </div>
      </section>

      {/* Mobile Section */}
      <section className="settings-section">
        <h2>Mobile</h2>
        <p className="section-description">One-handed use and touch optimizations</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="oneHandedMode">One-Handed Mode</label>
            <span className="setting-hint">Optimize for thumb reach</span>
          </div>
          <label className="toggle-switch">
            <input
              id="oneHandedMode"
              type="checkbox"
              checked={settings.oneHandedMode}
              onChange={(e) => updateSettings({ oneHandedMode: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.oneHandedMode && (
          <div className="setting-item indented">
            <div className="setting-info">
              <label htmlFor="handPreference">Hand Preference</label>
              <span className="setting-hint">Which hand do you use?</span>
            </div>
            <select
              id="handPreference"
              value={settings.handPreference}
              onChange={(e) => updateSettings({ handPreference: e.target.value as any })}
            >
              <option value="auto">Auto-Detect</option>
              <option value="right">Right Hand</option>
              <option value="left">Left Hand</option>
            </select>
          </div>
        )}

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="pullToRefresh">Pull to Refresh</label>
            <span className="setting-hint">Swipe down to reload</span>
          </div>
          <label className="toggle-switch">
            <input
              id="pullToRefresh"
              type="checkbox"
              checked={settings.pullToRefresh}
              onChange={(e) => updateSettings({ pullToRefresh: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.pullToRefresh && (
          <div className="setting-item indented">
            <div className="setting-info">
              <label htmlFor="pullSensitivity">Pull Sensitivity</label>
              <span className="setting-hint">How far to pull</span>
            </div>
            <select
              id="pullSensitivity"
              value={settings.pullSensitivity}
              onChange={(e) => updateSettings({ pullSensitivity: e.target.value as any })}
            >
              <option value="easy">Easy (Short Pull)</option>
              <option value="normal">Normal</option>
              <option value="firm">Firm (Long Pull)</option>
            </select>
          </div>
        )}

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="hapticFeedback">Haptic Feedback</label>
            <span className="setting-hint">Vibration on touch</span>
          </div>
          <label className="toggle-switch">
            <input
              id="hapticFeedback"
              type="checkbox"
              checked={settings.hapticFeedback}
              onChange={(e) => updateSettings({ hapticFeedback: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>

      {/* Data & Sync Section */}
      <section className="settings-section">
        <h2>Data & Sync</h2>
        <p className="section-description">Control how data syncs and stores</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="realTimeSync">Real-Time Sync</label>
            <span className="setting-hint">Instant updates from server</span>
          </div>
          <label className="toggle-switch">
            <input
              id="realTimeSync"
              type="checkbox"
              checked={settings.realTimeSync}
              onChange={(e) => updateSettings({ realTimeSync: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {!settings.realTimeSync && (
          <div className="setting-item indented">
            <div className="setting-info">
              <label htmlFor="syncFrequency">Sync Frequency</label>
              <span className="setting-hint">How often to check for updates</span>
            </div>
            <select
              id="syncFrequency"
              value={settings.syncFrequency}
              onChange={(e) => updateSettings({ syncFrequency: e.target.value as any })}
            >
              <option value="immediate">Immediate</option>
              <option value="5s">Every 5 Seconds</option>
              <option value="30s">Every 30 Seconds</option>
              <option value="manual">Manual Only</option>
            </select>
          </div>
        )}

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="wifiOnlySync">WiFi Only Sync</label>
            <span className="setting-hint">Don't sync on cellular data</span>
          </div>
          <label className="toggle-switch">
            <input
              id="wifiOnlySync"
              type="checkbox"
              checked={settings.wifiOnlySync}
              onChange={(e) => updateSettings({ wifiOnlySync: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="autoDownloadShows">Auto-Download Shows</label>
            <span className="setting-hint">Pre-download for offline use</span>
          </div>
          <label className="toggle-switch">
            <input
              id="autoDownloadShows"
              type="checkbox"
              checked={settings.autoDownloadShows}
              onChange={(e) => updateSettings({ autoDownloadShows: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="storageLimit">Storage Limit</label>
            <span className="setting-hint">Maximum offline storage</span>
          </div>
          <select
            id="storageLimit"
            value={settings.storageLimit}
            onChange={(e) => updateSettings({ storageLimit: parseInt(e.target.value) as any })}
          >
            <option value="100">100 MB</option>
            <option value="500">500 MB</option>
            <option value="1000">1 GB</option>
            <option value="-1">Unlimited</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="autoCleanup">Auto-Cleanup Old Data</label>
            <span className="setting-hint">Remove old cached data automatically</span>
          </div>
          <label className="toggle-switch">
            <input
              id="autoCleanup"
              type="checkbox"
              checked={settings.autoCleanup}
              onChange={(e) => updateSettings({ autoCleanup: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="settings-section">
        <h2>Notifications</h2>
        <p className="section-description">Manage alerts and reminders</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="enableNotifications">Enable Notifications</label>
            <span className="setting-hint">Show push notifications</span>
          </div>
          <label className="toggle-switch">
            <input
              id="enableNotifications"
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => updateSettings({ enableNotifications: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.enableNotifications && (
          <>
            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notificationSound">Sound</label>
                <span className="setting-hint">Play sound with notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="notificationSound"
                  type="checkbox"
                  checked={settings.notificationSound}
                  onChange={(e) => updateSettings({ notificationSound: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="showBadges">Badge Counter</label>
                <span className="setting-hint">Show number on app icon</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="showBadges"
                  type="checkbox"
                  checked={settings.showBadges}
                  onChange={(e) => updateSettings({ showBadges: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <h3 className="subsection-title">Notify Me About</h3>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notifyClassStarting">Class Starting Soon</label>
              </div>
              <label className="toggle-switch">
                <input
                  id="notifyClassStarting"
                  type="checkbox"
                  checked={settings.notifyClassStarting}
                  onChange={(e) => updateSettings({ notifyClassStarting: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notifyYourTurn">Your Turn to Compete</label>
              </div>
              <label className="toggle-switch">
                <input
                  id="notifyYourTurn"
                  type="checkbox"
                  checked={settings.notifyYourTurn}
                  onChange={(e) => updateSettings({ notifyYourTurn: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notifyResults">Results Posted</label>
              </div>
              <label className="toggle-switch">
                <input
                  id="notifyResults"
                  type="checkbox"
                  checked={settings.notifyResults}
                  onChange={(e) => updateSettings({ notifyResults: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notifyConflicts">Schedule Conflicts</label>
              </div>
              <label className="toggle-switch">
                <input
                  id="notifyConflicts"
                  type="checkbox"
                  checked={settings.notifyConflicts}
                  onChange={(e) => updateSettings({ notifyConflicts: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notifySyncErrors">Sync Errors</label>
              </div>
              <label className="toggle-switch">
                <input
                  id="notifySyncErrors"
                  type="checkbox"
                  checked={settings.notifySyncErrors}
                  onChange={(e) => updateSettings({ notifySyncErrors: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </>
        )}
      </section>

      {/* Scoring Section */}
      <section className="settings-section">
        <h2>Scoring</h2>
        <p className="section-description">Customize scoresheet behavior</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="voiceAnnouncements">Voice Announcements</label>
            <span className="setting-hint">Speak timer warnings aloud</span>
          </div>
          <label className="toggle-switch">
            <input
              id="voiceAnnouncements"
              type="checkbox"
              checked={settings.voiceAnnouncements}
              onChange={(e) => updateSettings({ voiceAnnouncements: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="autoSaveFrequency">Auto-Save Frequency</label>
            <span className="setting-hint">How often to save progress</span>
          </div>
          <select
            id="autoSaveFrequency"
            value={settings.autoSaveFrequency}
            onChange={(e) => updateSettings({ autoSaveFrequency: e.target.value as any })}
          >
            <option value="immediate">Immediately</option>
            <option value="30s">Every 30 Seconds</option>
            <option value="1m">Every Minute</option>
            <option value="5m">Every 5 Minutes</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="confirmationPrompts">Confirmation Prompts</label>
            <span className="setting-hint">When to ask "Are you sure?"</span>
          </div>
          <select
            id="confirmationPrompts"
            value={settings.confirmationPrompts}
            onChange={(e) => updateSettings({ confirmationPrompts: e.target.value as any })}
          >
            <option value="always">Always Confirm</option>
            <option value="errors-only">Only on Errors</option>
            <option value="never">Never Ask</option>
          </select>
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="settings-section">
        <h2>Privacy & Security</h2>
        <p className="section-description">Protect your data and account</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="autoLogout">Auto-Logout</label>
            <span className="setting-hint">Log out after inactivity</span>
          </div>
          <select
            id="autoLogout"
            value={settings.autoLogout}
            onChange={(e) => updateSettings({ autoLogout: parseInt(e.target.value) as any })}
          >
            <option value="0">Never</option>
            <option value="15">After 15 Minutes</option>
            <option value="30">After 30 Minutes</option>
            <option value="60">After 1 Hour</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="rememberMe">Remember Me</label>
            <span className="setting-hint">Stay logged in on this device</span>
          </div>
          <label className="toggle-switch">
            <input
              id="rememberMe"
              type="checkbox"
              checked={settings.rememberMe}
              onChange={(e) => updateSettings({ rememberMe: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="biometricLogin">Biometric Login</label>
            <span className="setting-hint">Use fingerprint/face ID</span>
          </div>
          <label className="toggle-switch">
            <input
              id="biometricLogin"
              type="checkbox"
              checked={settings.biometricLogin}
              onChange={(e) => updateSettings({ biometricLogin: e.target.checked })}
              disabled={!('credentials' in navigator)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-actions">
          <button
            className="secondary-button"
            onClick={() => setShowClearCacheConfirm(true)}
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear Cache'}
          </button>
          <button
            className="secondary-button"
            onClick={handleClearScrollPositions}
          >
            Clear Scroll Positions
          </button>
        </div>
      </section>

      {/* Advanced Section */}
      <section className="settings-section">
        <h2>Advanced</h2>
        <p className="section-description">Developer and experimental features</p>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="developerMode">Developer Mode</label>
            <span className="setting-hint">Enable debugging tools</span>
          </div>
          <label className="toggle-switch">
            <input
              id="developerMode"
              type="checkbox"
              checked={settings.developerMode}
              onChange={(e) => updateSettings({ developerMode: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.developerMode && (
          <>
            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="showFPS">Show FPS Counter</label>
              </div>
              <label className="toggle-switch">
                <input
                  id="showFPS"
                  type="checkbox"
                  checked={settings.showFPS}
                  onChange={(e) => updateSettings({ showFPS: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="showNetworkRequests">Show Network Requests</label>
              </div>
              <label className="toggle-switch">
                <input
                  id="showNetworkRequests"
                  type="checkbox"
                  checked={settings.showNetworkRequests}
                  onChange={(e) => updateSettings({ showNetworkRequests: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="consoleLogging">Console Logging</label>
              </div>
              <select
                id="consoleLogging"
                value={settings.consoleLogging}
                onChange={(e) => updateSettings({ consoleLogging: e.target.value as any })}
              >
                <option value="none">None</option>
                <option value="errors">Errors Only</option>
                <option value="all">Everything</option>
              </select>
            </div>
          </>
        )}

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="enableBetaFeatures">Beta Features</label>
            <span className="setting-hint">Try experimental features (may be unstable)</span>
          </div>
          <label className="toggle-switch">
            <input
              id="enableBetaFeatures"
              type="checkbox"
              checked={settings.enableBetaFeatures}
              onChange={(e) => updateSettings({ enableBetaFeatures: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="enablePerformanceMonitoring">Performance Monitoring</label>
            <span className="setting-hint">Track performance metrics to database (minimal cost)</span>
          </div>
          <label className="toggle-switch">
            <input
              id="enablePerformanceMonitoring"
              type="checkbox"
              checked={settings.enablePerformanceMonitoring}
              onChange={(e) => updateSettings({ enablePerformanceMonitoring: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-actions">
          <button
            className="secondary-button"
            onClick={handleExport}
          >
            Export Settings
          </button>
          <button
            className="secondary-button"
            onClick={handleImportClick}
          >
            Import Settings
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
          {toast.type === 'success' && toast.message.includes('Cache cleared') && canUndoCacheClear() && (
            <button onClick={handleUndoCacheClear} className="toast-action">
              Undo
            </button>
          )}
        </div>
      )}

      {/* Clear Cache Confirmation Modal */}
      {showClearCacheConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearCacheConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Clear All Caches?</h3>
            <p>
              This will clear service worker caches, IndexedDB data, and stored data.
              Your authentication and settings will be preserved.
            </p>
            <p className="modal-hint">You can undo this action within 5 seconds.</p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowClearCacheConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="danger-button"
                onClick={handleClearCache}
              >
                Clear Cache
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
