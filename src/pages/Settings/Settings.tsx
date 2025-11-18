/**
 * Settings Page
 *
 * Comprehensive app settings organized into sections.
 * Users can control display, performance, mobile, sync, notifications, etc.
 */

import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  HamburgerMenu,
  CollapsibleSection,
  SettingsSearch,
  useSearchableSettings
} from '@/components/ui';
import { exportPersonalData, clearAllData, getStorageUsage, formatBytes } from '@/services/dataExportService';
import voiceAnnouncementService from '@/services/voiceAnnouncementService';
import { Download, AlertCircle, Database, Trash2, Volume2, MoreVertical, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import PushNotificationService from '@/services/pushNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import './Settings.css';

export function Settings() {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettingsStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageUsage, setStorageUsage] = useState<{ estimated: number; quota: number; percentUsed: number; localStorageSize: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchableSettings = useSearchableSettings();
  const { showContext, role } = useAuth();

  // State for header menu
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Push notification state
  const [_isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [browserCompatibility, setBrowserCompatibility] = useState<ReturnType<typeof PushNotificationService.getBrowserCompatibility> | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  // Load storage usage on mount
  useEffect(() => {
    getStorageUsage().then(setStorageUsage);
  }, []);

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

  // Configure voice announcement service when settings change
  useEffect(() => {
    voiceAnnouncementService.setEnabled(settings.voiceAnnouncements);

    // Get the selected voice by name
    const voices = voiceAnnouncementService.getAvailableVoices();
    const selectedVoice = settings.voiceName
      ? voices.find(v => v.name === settings.voiceName) || null
      : null;

    // Auto-detect browser language (fallback to en-US)
    const browserLang = navigator.language || 'en-US';

    voiceAnnouncementService.setDefaultConfig({
      voice: selectedVoice,
      lang: browserLang,
      rate: settings.voiceRate,
      pitch: 1.0, // Always use default pitch
      volume: 1.0, // Always use default volume (users control via device)
    });
  }, [settings.voiceAnnouncements, settings.voiceRate, settings.voiceName]);

  // Check push notification subscription status and browser compatibility on mount
  useEffect(() => {
    PushNotificationService.isSubscribed().then(setIsPushSubscribed);
    PushNotificationService.getPermissionState().then(setPermissionState);
    setBrowserCompatibility(PushNotificationService.getBrowserCompatibility());
  }, []);

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

  // Refresh function
  const handleRefresh = () => {
    window.location.reload();
  };

  // Show onboarding again
  const handleShowOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    showToast('Onboarding will show when you refresh or reopen the app', 'info');
    // Optional: Auto-reload after a delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="settings-container">
      <header className="page-header settings-header">
        <HamburgerMenu currentPage="settings" />
        <div className="header-content">
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

      {/* Theme Section */}
      <CollapsibleSection
        id="theme-section"
        title="Theme"
        description="Choose your primary accent color (Blue, Green, Orange, or Purple)"
        defaultExpanded={false}
        badge={1}
      >
        <ThemeToggle />
      </CollapsibleSection>

      {/* Mobile Section */}
      <CollapsibleSection
        id="mobile-section"
        title="Mobile"
        description="Touch and interaction preferences"
        defaultExpanded={false}
        badge={2}
      >

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="pullToRefresh">Pull to Refresh</label>
            <span className="setting-hint">Swipe down to reload lists</span>
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

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="hapticFeedback">Vibration on Touch</label>
            <span className="setting-hint">Vibrate when tapping buttons</span>
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

      {/* Notifications Section */}
      <CollapsibleSection
        id="notifications-section"
        title="Notifications"
        description="Manage alerts and reminders"
        defaultExpanded={false}
        badge={3}
      >

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="enableNotifications">Enable Notifications</label>
            <span className="setting-hint">Get notified when your favorited dogs (❤️) are up next and receive important announcements</span>
          </div>
          <label className="toggle-switch">
            <input
              id="enableNotifications"
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={async (e) => {
                const enabled = e.target.checked;
                updateSettings({ enableNotifications: enabled });

                // Automatically subscribe/unsubscribe to push notifications
                if (enabled) {
                  // Subscribe to push notifications
                  const licenseKey = showContext?.licenseKey;
                  if (!licenseKey || !role) {
                    showToast('Please log in to enable push notifications', 'error');
                    updateSettings({ enableNotifications: false });
                    return;
                  }

                  setIsSubscribing(true);
                  try {
                    // Get favorite armbands from localStorage
                    const favoritesKey = `dog_favorites_${licenseKey}`;
                    const savedFavorites = localStorage.getItem(favoritesKey);
                    let favoriteArmbands: number[] = [];

                    if (savedFavorites) {
                      try {
                        const parsed = JSON.parse(savedFavorites);
                        if (Array.isArray(parsed) && parsed.every(id => typeof id === 'number')) {
                          favoriteArmbands = parsed;
                        }
                      } catch (error) {
                        console.error('[Settings] Error parsing favorites:', error);
                      }
                    }

                    const success = await PushNotificationService.subscribe(role, licenseKey, favoriteArmbands);

                    // 🔄 Update permission state immediately so warnings show without refresh
                    const newPermission = await PushNotificationService.getPermissionState();
                    setPermissionState(newPermission);

                    if (success) {
                      setIsPushSubscribed(true);
                      showToast('Push notifications enabled!', 'success');
                    } else {
                      showToast('Failed to enable push notifications. Please check browser permissions.', 'error');
                      updateSettings({ enableNotifications: false });
                    }
                  } catch (error) {
                    console.error('[Settings] Subscribe error:', error);
                    showToast('Failed to enable push notifications', 'error');
                    updateSettings({ enableNotifications: false });

                    // 🔄 Update permission state to show appropriate warnings
                    const newPermission = await PushNotificationService.getPermissionState();
                    setPermissionState(newPermission);
                  } finally {
                    setIsSubscribing(false);
                  }
                } else {
                  // Unsubscribe from push notifications
                  setIsSubscribing(true);
                  try {
                    const success = await PushNotificationService.unsubscribe();
                    if (success) {
                      setIsPushSubscribed(false);
                      showToast('Push notifications disabled', 'info');
                    } else {
                      showToast('Failed to disable push notifications', 'error');
                      updateSettings({ enableNotifications: true });
                    }
                  } catch (error) {
                    console.error('[Settings] Unsubscribe error:', error);
                    showToast('Failed to disable push notifications', 'error');
                    updateSettings({ enableNotifications: true });
                  } finally {
                    setIsSubscribing(false);
                  }
                }
              }}
              disabled={isSubscribing}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Show Onboarding Again - Always visible so users can re-enable notifications */}
        <div className="setting-item">
          <div className="setting-info">
            <label>Show Onboarding Again</label>
            <span className="setting-hint">View the welcome tour and enable notifications</span>
          </div>
          <button
            onClick={handleShowOnboarding}
            className="btn btn-secondary"
            style={{ padding: 'var(--token-space-md) var(--token-space-xl)', fontSize: '0.875rem' }}
          >
            Show Onboarding
          </button>
        </div>

        {settings.enableNotifications && (
          <>

            {/* Browser Compatibility Warning */}
            {browserCompatibility && !browserCompatibility.supported && (
              <div className="setting-item indented" style={{ backgroundColor: '#ef444414', borderLeft: '3px solid #ef4444', padding: '1rem', borderRadius: '12px', margin: '0.5rem 0' }}>
                <div className="setting-info" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <AlertCircle size={20} color="#ef4444" />
                    <label style={{ fontWeight: 600, fontSize: '1rem', color: '#ef4444' }}>
                      Push Notifications Not Available
                    </label>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>Reason:</strong> {browserCompatibility.reason}
                    </p>
                    {browserCompatibility.browserName && browserCompatibility.browserVersion && (
                      <p style={{ marginBottom: '0.5rem', color: 'var(--token-text-muted)' }}>
                        <strong>Your Browser:</strong> {browserCompatibility.browserName} {browserCompatibility.browserVersion} on {browserCompatibility.platform}
                      </p>
                    )}
                  </div>
                  {browserCompatibility.recommendations && browserCompatibility.recommendations.length > 0 && (
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>What you can do:</strong>
                      <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                        {browserCompatibility.recommendations.map((rec, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Permission Denied Warning */}
            {permissionState === 'denied' && browserCompatibility?.supported && (
              <div className="setting-item indented" style={{ backgroundColor: '#f9731614', borderLeft: '3px solid #f97316', padding: '1rem', borderRadius: '12px', margin: '0.5rem 0' }}>
                <div className="setting-info" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <AlertCircle size={20} color="#f97316" />
                    <label style={{ fontWeight: 600, fontSize: '1rem', color: '#f97316' }}>
                      Notifications Blocked
                    </label>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                      You previously blocked notifications for this site. To enable push notifications, you'll need to update your browser settings.
                    </p>
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>How to fix this:</strong>
                    <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                      <li style={{ marginBottom: '0.25rem' }}>
                        <strong>Chrome/Edge:</strong> Click the lock icon (🔒) in the address bar → Site settings → Notifications → Allow
                      </li>
                      <li style={{ marginBottom: '0.25rem' }}>
                        <strong>Firefox:</strong> Click the lock icon (🔒) in the address bar → Permissions → Notifications → Allow
                      </li>
                      <li style={{ marginBottom: '0.25rem' }}>
                        <strong>Safari:</strong> Safari menu → Settings → Websites → Notifications → Find this site → Allow
                      </li>
                      <li style={{ marginBottom: '0.25rem' }}>
                        After allowing, refresh this page and try again
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Test Notifications Button - Shows when permission granted */}
            {permissionState === 'granted' && browserCompatibility?.supported && (
              <div className="setting-item indented" style={{ backgroundColor: '#10b98114', borderLeft: '3px solid #10b981', padding: '1rem', borderRadius: '12px', margin: '0.5rem 0' }}>
                <div className="setting-info" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: '#10b981' }}>
                        ✅ Notifications Enabled
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--token-text-muted)' }}>
                        You'll receive alerts when your favorited dogs are up next
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={async () => {
                          try {
                            // Send a test PUSH notification (system notification only)
                            if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                              const registration = await navigator.serviceWorker.ready;
                              console.log('[Settings] Sending test push notification...');
                              await registration.showNotification('myK9Q Push Test', {
                                body: 'This is a push notification (system only, not in notification center)',
                                icon: '/myK9Q-notification-icon-192.png',
                                badge: '/myK9Q-notification-badge-96.png',
                                tag: 'test-push-notification',
                                requireInteraction: false
                              });
                              showToast('Push notification sent!', 'success');
                            }
                          } catch (error) {
                            console.error('[Settings] Test push notification error:', error);
                            showToast('Failed to send push notification', 'error');
                          }
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Test Push
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Send a test notification via simulated push (appears in both system and notification center)
                            if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                              const registration = await navigator.serviceWorker.ready;
                              if (registration.active) {
                                console.log('[Settings] Sending simulated push notification...');
                                registration.active.postMessage({
                                  type: 'SIMULATE_PUSH',
                                  data: {
                                    id: `test-${Date.now()}`,
                                    licenseKey: showContext?.licenseKey || 'test-show',
                                    showName: showContext?.showName || 'Test Show',
                                    title: 'Test Notification',
                                    content: 'Your notifications are working! You\'ll be notified when your dogs are up next.',
                                    priority: 'normal',
                                    type: 'announcement',
                                    url: '/announcements'
                                  }
                                });
                                showToast('Simulated in-app sent!', 'success');
                              } else {
                                console.error('[Settings] No active service worker');
                                showToast('Service worker not ready', 'error');
                              }
                            }
                          } catch (error) {
                            console.error('[Settings] Test notification error:', error);
                            showToast('Failed to send test notification', 'error');
                          }
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Test In-App
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Test notification grouping by sending different notification types
                            if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                              const registration = await navigator.serviceWorker.ready;
                              const licenseKey = showContext?.licenseKey || 'test-show-123';

                              console.log('[Settings] Sending 4 test notifications with actions...');

                              // Simulate different notification types with different actions
                              const notifications = [
                                // Urgent alert (stays separate with "View Now" + "Got It" actions)
                                {
                                  title: 'Ring change',
                                  content: 'All classes moved to Ring 1 immediately',
                                  priority: 'urgent',
                                  type: 'announcement'
                                },
                                // Dog alert (stays separate with "View Entry" + "Class List" actions)
                                {
                                  title: 'Max is up soon',
                                  content: 'Your dog is up in 2 dogs',
                                  priority: 'high',
                                  type: 'dog-alert',
                                  dogId: 'test-dog-123',
                                  dogName: 'Max',
                                  classId: 'test-class-456',
                                  entryId: 'test-entry-789'
                                },
                                // General announcements (will group with "View" + "Dismiss" actions)
                                {
                                  title: 'Lunch break announced',
                                  content: 'Competition paused for 30 minutes',
                                  priority: 'normal',
                                  type: 'announcement'
                                },
                                {
                                  title: 'Weather update',
                                  content: 'Light rain expected around 2 PM',
                                  priority: 'normal',
                                  type: 'announcement'
                                }
                              ];

                              for (let i = 0; i < notifications.length; i++) {
                                const notif = notifications[i];
                                // Simulate push notification through service worker
                                if (registration.active) {
                                  registration.active.postMessage({
                                    type: 'SIMULATE_PUSH',
                                    data: {
                                      licenseKey: licenseKey,
                                      showName: showContext?.showName || 'Test Show',
                                      id: `test-${Date.now()}-${i}`,
                                      ...notif
                                    }
                                  });
                                }
                                // Small delay between notifications
                                await new Promise(r => setTimeout(r, 600));
                              }

                              showToast('Sent 4 test notifications!', 'success');
                            }
                          } catch (error) {
                            console.error('[Settings] Test grouping error:', error);
                            showToast('Failed to test notifications', 'error');
                          }
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Test Actions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dogs Ahead Setting - Simplified */}
            <div className="setting-item indented">
              <div className="setting-info">
                <label htmlFor="notifyYourTurnLeadDogs">Notify me when my dog is...</label>
                <span className="setting-hint">Get notified at the right time to prepare</span>
              </div>
              <select
                id="notifyYourTurnLeadDogs"
                value={settings.notifyYourTurnLeadDogs}
                onChange={(e) => updateSettings({ notifyYourTurnLeadDogs: parseInt(e.target.value) as any })}
              >
                <option value="1">Next in the ring</option>
                <option value="2">2nd in line</option>
                <option value="3">3rd in line (default)</option>
                <option value="4">4th in line</option>
                <option value="5">5th in line</option>
              </select>
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
                <label htmlFor="voiceNotifications">Voice Announcements</label>
                <span className="setting-hint">Speak notifications aloud (e.g., "Bella, number 25, you're up next")</span>
              </div>
              <label className="toggle-switch">
                <input
                  id="voiceNotifications"
                  type="checkbox"
                  checked={settings.voiceNotifications}
                  onChange={(e) => updateSettings({ voiceNotifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Scoring Section */}
      <CollapsibleSection
        id="scoring-section"
        title="Scoring"
        description="Scoresheet voice announcements and confirmations"
        defaultExpanded={false}
        badge={5}
      >

        <h3 className="subsection-title">Voice Announcements (Scoresheets)</h3>

        <div className="setting-item">
          <div className="setting-info">
            <label htmlFor="voiceAnnouncements">Enable Voice Announcements</label>
            <span className="setting-hint">Speak timer warnings and results aloud during scoring</span>
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
                <label htmlFor="voiceName">Voice</label>
                <span className="setting-hint">Choose which voice to use</span>
              </div>
              <select
                id="voiceName"
                value={settings.voiceName}
                onChange={(e) => {
                  const voiceName = e.target.value;
                  updateSettings({ voiceName });

                  // Update voice service with selected voice
                  const voices = voiceAnnouncementService.getAvailableVoices();
                  const selectedVoice = voices.find(v => v.name === voiceName) || null;
                  voiceAnnouncementService.setDefaultConfig({ voice: selectedVoice });
                }}
              >
                <option value="">Browser Default</option>
                {voiceAnnouncementService.getAvailableVoices()
                  .filter(voice => voice.lang.startsWith('en'))
                  .map((voice) => (
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
              <button
                className="secondary-button"
                onClick={() => {
                  console.log('[Settings] Test Voice button clicked');
                  voiceAnnouncementService.testVoice();
                }}
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
      </CollapsibleSection>

      {/* Privacy & Security Section */}
      <CollapsibleSection
        id="privacy-section"
        title="Privacy & Security"
        description="Privacy preferences"
        defaultExpanded={false}
        badge={2}
      >

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
      </CollapsibleSection>

      {/* Advanced Section - Admin Only */}
      {role === 'admin' && (
        <CollapsibleSection
          id="advanced-section"
          title="Advanced"
          description="Developer and experimental features"
          defaultExpanded={false}
          badge={12}
        >

        <h3 className="subsection-title">Data Management</h3>

        {/* Storage Usage Display */}
        {storageUsage && (
          <div className="setting-item" style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="setting-info" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Database size={18}  style={{ width: '18px', height: '18px', flexShrink: 0 }} />
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
            <Download size={16}  style={{ width: '16px', height: '16px', flexShrink: 0 }} />
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

        <h3 className="subsection-title">Developer Tools</h3>

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
      )}

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
