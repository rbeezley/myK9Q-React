/**
 * Settings Page
 *
 * Comprehensive app settings organized into sections.
 * Users can control display, performance, mobile, sync, notifications, etc.
 */

import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  PerformanceSettingsPanel,
  HamburgerMenu,
  CollapsibleSection,
  SettingsSearch,
  useSearchableSettings
} from '@/components/ui';
import { clearAllCaches, clearScrollPositions, undoCacheClear, canUndoCacheClear } from '@/utils/cacheManager';
import { useDNDToggle } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notificationService';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { exportPersonalData, clearAllData, getStorageUsage, formatBytes } from '@/services/dataExportService';
import voiceAnnouncementService from '@/services/voiceAnnouncementService';
import smartConfirmationService from '@/services/smartConfirmation';
import { Download, CheckCircle2, AlertCircle, Database, Trash2, Volume2, User } from 'lucide-react';
import './Settings.css';

export function Settings() {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettingsStore();
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageUsage, setStorageUsage] = useState<{ estimated: number; quota: number; percentUsed: number; localStorageSize: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchableSettings = useSearchableSettings();
  const { isActive: isDNDActive, setFor: setDNDFor, disable: disableDND } = useDNDToggle();
  const { isInstalled, canInstall, promptInstall, getInstallInstructions } = usePWAInstall();

  // Available voices for selection
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = voiceAnnouncementService.getAvailableVoices();
      setAvailableVoices(voices);
    };

    loadVoices();

    // Voices may load asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Quiet hours state
  const [quietHoursConfig, setQuietHoursConfigState] = useState(() => {
    const stored = localStorage.getItem('notification_quiet_hours');
    if (stored) {
      return JSON.parse(stored);
    }
    return { enabled: false, startTime: '22:00', endTime: '08:00', allowUrgent: true };
  });

  // Load storage usage on mount
  useEffect(() => {
    getStorageUsage().then(setStorageUsage);
  }, []);

  // Configure voice announcement service when settings change
  useEffect(() => {
    voiceAnnouncementService.setEnabled(settings.voiceAnnouncements);

    // Find the selected voice by name
    let selectedVoice: SpeechSynthesisVoice | null = null;
    if (settings.voiceName) {
      selectedVoice = availableVoices.find(v => v.name === settings.voiceName) || null;
    }

    voiceAnnouncementService.setDefaultConfig({
      voice: selectedVoice,
      lang: settings.voiceLanguage,
      rate: settings.voiceRate,
      pitch: settings.voicePitch,
      volume: settings.voiceVolume,
    });
  }, [settings.voiceAnnouncements, settings.voiceLanguage, settings.voiceName, settings.voiceRate, settings.voicePitch, settings.voiceVolume, availableVoices]);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Export personal data
  const handleExportData = async () => {
    try {
      const authData = localStorage.getItem('myK9Q_auth');
      const licenseKey = authData ? JSON.parse(authData).licenseKey : undefined;
      await exportPersonalData(licenseKey);
      showToast('Your data has been exported successfully!');
    } catch (error) {
      showToast('Failed to export your data', 'error');
      console.error('Export data error:', error);
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    setShowClearDataConfirm(false);
    setIsClearing(true);

    try {
      await clearAllData({ keepAuth: true, keepSettings: false, keepFavorites: false });
      showToast('All data cleared successfully! You remain logged in.', 'success');

      // Refresh storage usage
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      showToast('Failed to clear data', 'error');
      console.error('Clear data error:', error);
    } finally {
      setIsClearing(false);
    }
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

  // DND handlers
  const handleDNDToggle = () => {
    if (isDNDActive) {
      disableDND();
      showToast('Do Not Disturb disabled', 'info');
    } else {
      setDNDFor(60); // 1 hour default
      showToast('Do Not Disturb enabled for 1 hour', 'info');
    }
  };

  const handleDNDDurationChange = (minutes: number) => {
    setDNDFor(minutes);
    showToast(`Do Not Disturb enabled for ${minutes} minutes`, 'info');
  };

  // Quiet hours handlers
  const handleQuietHoursToggle = (enabled: boolean) => {
    const newConfig = { ...quietHoursConfig, enabled };
    setQuietHoursConfigState(newConfig);
    notificationService.setQuietHours(newConfig);
    showToast(enabled ? 'Quiet hours enabled' : 'Quiet hours disabled', 'info');
  };

  const handleQuietHoursChange = (startTime: string, endTime: string) => {
    const newConfig = { ...quietHoursConfig, startTime, endTime };
    setQuietHoursConfigState(newConfig);
    notificationService.setQuietHours(newConfig);
  };

  const handleQuietHoursAllowUrgent = (allowUrgent: boolean) => {
    const newConfig = { ...quietHoursConfig, allowUrgent };
    setQuietHoursConfigState(newConfig);
    notificationService.setQuietHours(newConfig);
  };

  return (
    <div className="settings-container page-container">
      <div className="settings-content">
        <div className="settings-header">
          <HamburgerMenu currentPage="settings" />
          <h1>Settings</h1>
          <button
            className="reset-all-btn"
            onClick={() => setShowResetConfirm(true)}
          >
            Reset All
          </button>
        </div>

      {/* Search Settings */}
      <SettingsSearch
        settings={searchableSettings}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        showCategoryFilter={true}
        placeholder="Search settings..."
        autoFocus={false}
      />

      {/* Display Section */}
      <CollapsibleSection
        id="display-section"
        title="Display"
        description="Customize how the app looks"
        defaultExpanded={true}
        badge={4}
      >
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
      </CollapsibleSection>

      {/* Performance Section */}
      <CollapsibleSection
        id="performance-section"
        title="Performance"
        description="Optimize for your device"
        defaultExpanded={false}
        badge={2}
      >

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
      </CollapsibleSection>

      {/* Mobile Section */}
      <CollapsibleSection
        id="mobile-section"
        title="Mobile"
        description="One-handed use and touch optimizations"
        defaultExpanded={false}
        badge={5}
      >

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
      </CollapsibleSection>

      {/* Data & Sync Section */}
      <CollapsibleSection
        id="sync-section"
        title="Data & Sync"
        description="Control how data syncs and stores"
        defaultExpanded={false}
        badge={6}
      >

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
      </CollapsibleSection>

      {/* Notifications Section */}
      <CollapsibleSection
        id="notifications-section"
        title="Notifications"
        description="Manage alerts and reminders"
        defaultExpanded={false}
        badge={8}
      >

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
            {/* PWA Installation Status */}
            <div className="setting-item indented" style={{ backgroundColor: isInstalled ? '#10b98114' : '#f9731614', borderLeft: '3px solid', borderColor: isInstalled ? '#22c55e' : '#f97316', padding: '1rem', borderRadius: '12px', margin: '0.5rem 0' }}>
              <div className="setting-info" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {isInstalled ? <CheckCircle2 size={20} color="#22c55e" /> : <AlertCircle size={20} color="#f97316" />}
                  <label style={{ fontWeight: 600, fontSize: '1rem', color: isInstalled ? '#22c55e' : '#f97316' }}>
                    {isInstalled ? 'App Installed' : 'App Not Installed'}
                  </label>
                </div>
                <span className="setting-hint notification-instructions-hint" style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {isInstalled
                    ? 'You\'ll receive notifications for your favorited dogs (❤️) when they\'re up next'
                    : 'Install the app and favorite your dogs (❤️) to receive notifications when they\'re up next'
                  }
                </span>
                {!isInstalled && canInstall && (
                  <button
                    className="primary-button"
                    onClick={promptInstall}
                    style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    <Download size={16} />
                    Install App
                  </button>
                )}
                {!isInstalled && !canInstall && (
                  <>
                    <div className="install-instructions-box">
                      <strong className="install-instructions-title">Manual Installation Required</strong>
                      <p className="install-instructions-text">To receive notifications, install this app through your browser's menu.</p>
                      <p className="install-instructions-hint">Click the button below for step-by-step instructions.</p>
                    </div>
                    <button
                      className="primary-button"
                      onClick={async () => {
                        const userAgent = navigator.userAgent.toLowerCase();
                        let instructions = getInstallInstructions();

                        if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
                          instructions = '1. Click the three dots menu (⋮) in the top-right corner\n2. Select "Save and Share" → "Install app"\n   OR look for an install icon (⊕) in the address bar\n3. Click "Install" in the popup\n\nOnce installed, favorite your dogs (❤️) to receive notifications when they\'re up next!';
                        } else if (userAgent.includes('edg')) {
                          instructions = '1. Click the three dots menu (...) in the top-right corner\n2. Select "Apps" → "Install myK9Q"\n   OR look for an install icon in the address bar\n3. Click "Install" in the popup\n\nOnce installed, favorite your dogs (❤️) to receive notifications when they\'re up next!';
                        }

                        alert(`📱 Install myK9Q for Notifications\n\n${instructions}`);
                      }}
                      style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem 1rem', width: '100%', justifyContent: 'center' }}
                    >
                      <Download size={16} />
                      How to Install
                    </button>
                  </>
                )}
              </div>
            </div>

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

            {settings.notifyYourTurn && (
              <div className="setting-item indented">
                <div className="setting-info">
                  <label htmlFor="notifyYourTurnLeadDogs">Notify When Dogs Ahead</label>
                  <span className="setting-hint">How many dogs before you to get notified</span>
                </div>
                <select
                  id="notifyYourTurnLeadDogs"
                  value={settings.notifyYourTurnLeadDogs}
                  onChange={(e) => updateSettings({ notifyYourTurnLeadDogs: parseInt(e.target.value) as any })}
                >
                  <option value="1">1 dog ahead (default)</option>
                  <option value="2">2 dogs ahead</option>
                  <option value="3">3 dogs ahead</option>
                  <option value="4">4 dogs ahead</option>
                  <option value="5">5 dogs ahead</option>
                </select>
              </div>
            )}

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notifyResults">Results Posted</label>
                <span className="setting-hint">When entire class is complete with placements</span>
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

            <h3 className="subsection-title">Do Not Disturb</h3>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="dnd-toggle">Do Not Disturb</label>
                <span className="setting-hint">Temporarily silence all notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="dnd-toggle"
                  type="checkbox"
                  checked={isDNDActive}
                  onChange={handleDNDToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {isDNDActive && (
              <div className="setting-item indented">
                <div className="setting-info">
                  <label htmlFor="dnd-duration">Duration</label>
                  <span className="setting-hint">Automatically disable DND after</span>
                </div>
                <select
                  id="dnd-duration"
                  onChange={(e) => handleDNDDurationChange(parseInt(e.target.value))}
                  defaultValue="60"
                >
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="120">2 Hours</option>
                  <option value="240">4 Hours</option>
                  <option value="480">8 Hours</option>
                </select>
              </div>
            )}

            <h3 className="subsection-title">Quiet Hours</h3>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="quiet-hours-toggle">Enable Quiet Hours</label>
                <span className="setting-hint">Schedule when to silence notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="quiet-hours-toggle"
                  type="checkbox"
                  checked={quietHoursConfig.enabled}
                  onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {quietHoursConfig.enabled && (
              <>
                <div className="setting-item indented">
                  <div className="setting-info">
                    <label htmlFor="quiet-hours-start">Start Time</label>
                  </div>
                  <input
                    id="quiet-hours-start"
                    type="time"
                    value={quietHoursConfig.startTime}
                    onChange={(e) => handleQuietHoursChange(e.target.value, quietHoursConfig.endTime)}
                  />
                </div>

                <div className="setting-item indented">
                  <div className="setting-info">
                    <label htmlFor="quiet-hours-end">End Time</label>
                  </div>
                  <input
                    id="quiet-hours-end"
                    type="time"
                    value={quietHoursConfig.endTime}
                    onChange={(e) => handleQuietHoursChange(quietHoursConfig.startTime, e.target.value)}
                  />
                </div>

                <div className="setting-item indented">
                  <div className="setting-info">
                    <label htmlFor="quiet-hours-allow-urgent">Allow Urgent Notifications</label>
                    <span className="setting-hint">Still show urgent alerts during quiet hours</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      id="quiet-hours-allow-urgent"
                      type="checkbox"
                      checked={quietHoursConfig.allowUrgent}
                      onChange={(e) => handleQuietHoursAllowUrgent(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </>
            )}
          </>
        )}
      </CollapsibleSection>

      {/* Scoring Section */}
      <CollapsibleSection
        id="scoring-section"
        title="Scoring"
        description="Customize scoresheet behavior"
        defaultExpanded={false}
        badge={11}
      >

        <h3 className="subsection-title">Voice Announcements</h3>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="voiceAnnouncements">Enable Voice Announcements</label>
            <span className="setting-hint">Speak timer warnings and results aloud</span>
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

        {settings.voiceAnnouncements && (
          <>
            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="voiceLanguage">Language</label>
                <span className="setting-hint">Voice language and accent</span>
              </div>
              <select
                id="voiceLanguage"
                value={settings.voiceLanguage}
                onChange={(e) => updateSettings({ voiceLanguage: e.target.value, voiceName: '' })}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="voiceName">Voice</label>
                <span className="setting-hint">Choose a specific voice</span>
              </div>
              <select
                id="voiceName"
                value={settings.voiceName ?? ''}
                onChange={(e) => updateSettings({ voiceName: e.target.value })}
              >
                <option value="">Default for language</option>
                {availableVoices
                  .filter(voice => {
                    const langPrefix = (settings.voiceLanguage ?? 'en-US').split('-')[0];
                    return voice.lang.startsWith(langPrefix);
                  })
                  .map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="voiceRate">Speed: {(settings.voiceRate ?? 1.0).toFixed(1)}x</label>
                <span className="setting-hint">How fast the voice speaks</span>
              </div>
              <input
                id="voiceRate"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.voiceRate ?? 1.0}
                onChange={(e) => updateSettings({ voiceRate: parseFloat(e.target.value) })}
              />
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="voicePitch">Pitch: {(settings.voicePitch ?? 1.0).toFixed(1)}</label>
                <span className="setting-hint">Voice tone (higher = higher pitched)</span>
              </div>
              <input
                id="voicePitch"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.voicePitch ?? 1.0}
                onChange={(e) => updateSettings({ voicePitch: parseFloat(e.target.value) })}
              />
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="voiceVolume">Volume: {Math.round((settings.voiceVolume ?? 1.0) * 100)}%</label>
                <span className="setting-hint">Voice loudness</span>
              </div>
              <input
                id="voiceVolume"
                type="range"
                min="0"
                max="1.0"
                step="0.1"
                value={settings.voiceVolume ?? 1.0}
                onChange={(e) => updateSettings({ voiceVolume: parseFloat(e.target.value) })}
              />
            </div>

            <div className="setting-item indented">
              <button
                className="secondary-button"
                onClick={() => voiceAnnouncementService.testVoice()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Volume2 size={16} />
                Test Voice
              </button>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="announceTimerCountdown">Announce Timer Countdown</label>
                <span className="setting-hint">Speak time warnings during runs</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="announceTimerCountdown"
                  type="checkbox"
                  checked={settings.announceTimerCountdown}
                  onChange={(e) => updateSettings({ announceTimerCountdown: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="announceRunNumber">Announce Run Number</label>
                <span className="setting-hint">Speak armband and dog name</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="announceRunNumber"
                  type="checkbox"
                  checked={settings.announceRunNumber}
                  onChange={(e) => updateSettings({ announceRunNumber: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="announceResults">Announce Results</label>
                <span className="setting-hint">Speak qualification and placement</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="announceResults"
                  type="checkbox"
                  checked={settings.announceResults}
                  onChange={(e) => updateSettings({ announceResults: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </>
        )}

        <h3 className="subsection-title">Auto-Save</h3>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="autoSaveEnabled">Enable Auto-Save</label>
            <span className="setting-hint">Automatically save scoresheet progress</span>
          </div>
          <label className="toggle-switch">
            <input
              id="autoSaveEnabled"
              type="checkbox"
              checked={settings.autoSaveEnabled}
              onChange={(e) => updateSettings({ autoSaveEnabled: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {settings.autoSaveEnabled && (
          <>
            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="autoSaveFrequency">Save Frequency</label>
                <span className="setting-hint">How often to auto-save</span>
              </div>
              <select
                id="autoSaveFrequency"
                value={settings.autoSaveFrequency}
                onChange={(e) => updateSettings({ autoSaveFrequency: e.target.value as any })}
              >
                <option value="immediate">Immediately</option>
                <option value="10s">Every 10 Seconds</option>
                <option value="30s">Every 30 Seconds</option>
                <option value="1m">Every Minute</option>
                <option value="5m">Every 5 Minutes</option>
              </select>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="maxDraftsPerEntry">Max Drafts Per Entry</label>
                <span className="setting-hint">Number of drafts to keep</span>
              </div>
              <input
                id="maxDraftsPerEntry"
                type="number"
                min="1"
                max="10"
                value={settings.maxDraftsPerEntry}
                onChange={(e) => updateSettings({ maxDraftsPerEntry: parseInt(e.target.value) || 3 })}
              />
            </div>
          </>
        )}

        <h3 className="subsection-title">Confirmation Prompts</h3>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="confirmationPrompts">Confirmation Mode</label>
            <span className="setting-hint">When to ask "Are you sure?"</span>
          </div>
          <select
            id="confirmationPrompts"
            value={settings.confirmationPrompts}
            onChange={(e) => updateSettings({ confirmationPrompts: e.target.value as any })}
          >
            <option value="always">Always Confirm</option>
            <option value="smart">Smart (Learn from Experience)</option>
            <option value="never">Never Ask</option>
          </select>
        </div>

        {settings.confirmationPrompts === 'smart' && (
          <>
            <div className="setting-item indented" style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="setting-info" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <User size={18} />
                  <label style={{ fontWeight: 600 }}>Your Experience Level</label>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {(() => {
                    const stats = smartConfirmationService.getStats();
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span>{stats.experienceLabel}</span>
                          <span>{stats.totalActions} actions completed</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(stats.experienceLevel, 100)}%`,
                              height: '100%',
                              background: '#6366f1',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          As you gain experience, confirmations will be reduced for routine actions.
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Privacy & Security Section */}
      <CollapsibleSection
        id="privacy-section"
        title="Privacy & Security"
        description="Protect your data and account"
        defaultExpanded={false}
        badge={6}
      >

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
            <option value="240">After 4 Hours</option>
            <option value="480">After 8 Hours (Default)</option>
            <option value="720">After 12 Hours</option>
            <option value="1440">After 24 Hours</option>
          </select>
        </div>

        <h3 className="subsection-title">Privacy Controls</h3>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="enablePerformanceMonitoring">Performance Analytics</label>
            <span className="setting-hint">Share anonymous usage data to help improve the app</span>
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

        {/* Storage Usage Display */}
        {storageUsage && (
          <div className="setting-item" style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="setting-info" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Database size={18} />
                <label style={{ fontWeight: 600 }}>Storage Usage</label>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>Local Storage:</span>
                  <span>{formatBytes(storageUsage.localStorageSize)}</span>
                </div>
                {storageUsage.quota > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span>Total Used:</span>
                      <span>{formatBytes(storageUsage.estimated)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      <span>Available:</span>
                      <span>{formatBytes(storageUsage.quota - storageUsage.estimated)}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(storageUsage.percentUsed, 100)}%`,
                          height: '100%',
                          background: storageUsage.percentUsed > 80 ? '#ef4444' : storageUsage.percentUsed > 60 ? '#f59e0b' : '#22c55e',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                      {storageUsage.percentUsed.toFixed(1)}% used
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="setting-actions" style={{ marginTop: '1rem' }}>
          <button
            className="secondary-button"
            onClick={handleExportData}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} />
            Export My Data
          </button>
          <button
            className="danger-button"
            onClick={() => setShowClearDataConfirm(true)}
            disabled={isClearing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Trash2 size={16} />
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </button>
        </div>

        <h3 className="subsection-title">Cache Management</h3>

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
      </CollapsibleSection>

      {/* Advanced Section */}
      <CollapsibleSection
        id="advanced-section"
        title="Advanced"
        description="Developer and experimental features"
        defaultExpanded={false}
        badge={12}
      >

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="developerMode">Developer Mode</label>
            <span className="setting-hint">Enable debugging tools (dev builds only)</span>
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
            <h3 className="subsection-title">Performance Monitors</h3>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="devShowFPS">FPS Counter</label>
                <span className="setting-hint">Real-time frames per second</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="devShowFPS"
                  type="checkbox"
                  checked={settings.devShowFPS}
                  onChange={(e) => updateSettings({ devShowFPS: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="devShowMemory">Memory Monitor</label>
                <span className="setting-hint">JS heap usage (Chrome only)</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="devShowMemory"
                  type="checkbox"
                  checked={settings.devShowMemory}
                  onChange={(e) => updateSettings({ devShowMemory: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <h3 className="subsection-title">Inspectors</h3>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="devShowNetwork">Network Inspector</label>
                <span className="setting-hint">Track HTTP requests</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="devShowNetwork"
                  type="checkbox"
                  checked={settings.devShowNetwork}
                  onChange={(e) => updateSettings({ devShowNetwork: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="devShowStateInspector">State Inspector</label>
                <span className="setting-hint">View Zustand store state</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="devShowStateInspector"
                  type="checkbox"
                  checked={settings.devShowStateInspector}
                  onChange={(e) => updateSettings({ devShowStateInspector: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <h3 className="subsection-title">Console Logging</h3>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="consoleLogging">Log Level</label>
                <span className="setting-hint">What to show in console</span>
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

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="devLogStateChanges">Log State Changes</label>
                <span className="setting-hint">Console log Zustand actions</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="devLogStateChanges"
                  type="checkbox"
                  checked={settings.devLogStateChanges}
                  onChange={(e) => updateSettings({ devLogStateChanges: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="devLogNetworkRequests">Log Network Requests</label>
                <span className="setting-hint">Console log HTTP requests</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="devLogNetworkRequests"
                  type="checkbox"
                  checked={settings.devLogNetworkRequests}
                  onChange={(e) => updateSettings({ devLogNetworkRequests: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="devLogPerformanceMarks">Log Performance Marks</label>
                <span className="setting-hint">Console log timing marks</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="devLogPerformanceMarks"
                  type="checkbox"
                  checked={settings.devLogPerformanceMarks}
                  onChange={(e) => updateSettings({ devLogPerformanceMarks: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
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
      </CollapsibleSection>

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
                onClick={handleClearAllData}
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
    </div>
  );
}
