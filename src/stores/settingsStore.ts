/**
 * Settings Store
 *
 * Manages user preferences and app settings.
 * Persists to localStorage.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { importSettingsWithMigration } from '@/utils/settingsMigration';

export const SETTINGS_VERSION = '1.0.0';

export interface AppSettings {
  // Display
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  highContrast: boolean;
  density: 'compact' | 'comfortable' | 'spacious';

  // Performance
  performanceMode: 'auto' | 'low' | 'medium' | 'high';
  imageQuality: 'low' | 'medium' | 'high' | 'original';
  enableAnimations: boolean | null; // null = auto-detect
  enableBlur: boolean | null; // null = auto-detect
  enableShadows: boolean | null; // null = auto-detect

  // Mobile
  oneHandedMode: boolean;
  handPreference: 'left' | 'right' | 'auto';
  pullToRefresh: boolean;
  pullSensitivity: 'easy' | 'normal' | 'firm';
  hapticFeedback: boolean;

  // Data & Sync
  realTimeSync: boolean;
  syncFrequency: 'immediate' | '5s' | '30s' | 'manual';
  wifiOnlySync: boolean;
  autoDownloadShows: boolean;
  storageLimit: 100 | 500 | 1000 | -1; // MB, -1 = unlimited
  autoCleanup: boolean;

  // Notifications
  enableNotifications: boolean;
  notificationSound: boolean;
  showBadges: boolean;
  notifyClassStarting: boolean;
  notifyYourTurn: boolean;
  notifyResults: boolean;
  notifyConflicts: boolean;
  notifySyncErrors: boolean;

  // Scoring
  voiceAnnouncements: boolean;
  autoSaveFrequency: 'immediate' | '30s' | '1m' | '5m';
  confirmationPrompts: 'always' | 'errors-only' | 'never';

  // Privacy & Security
  autoLogout: 0 | 15 | 30 | 60; // minutes, 0 = never
  rememberMe: boolean;
  biometricLogin: boolean;

  // Advanced
  developerMode: boolean;
  showFPS: boolean;
  showNetworkRequests: boolean;
  consoleLogging: 'none' | 'errors' | 'all';
  enableBetaFeatures: boolean;
  enablePerformanceMonitoring: boolean; // Track metrics to database
}

interface SettingsState {
  settings: AppSettings;

  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  resetSection: (section: keyof typeof defaultSettings) => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
}

const defaultSettings: AppSettings = {
  // Display
  theme: 'auto',
  fontSize: 'medium',
  reduceMotion: false,
  highContrast: false,
  density: 'comfortable',

  // Performance
  performanceMode: 'auto',
  imageQuality: 'high',
  enableAnimations: null,
  enableBlur: null,
  enableShadows: null,

  // Mobile
  oneHandedMode: false,
  handPreference: 'auto',
  pullToRefresh: true,
  pullSensitivity: 'normal',
  hapticFeedback: true,

  // Data & Sync
  realTimeSync: true,
  syncFrequency: 'immediate',
  wifiOnlySync: false,
  autoDownloadShows: false,
  storageLimit: 500,
  autoCleanup: true,

  // Notifications
  enableNotifications: true,
  notificationSound: true,
  showBadges: true,
  notifyClassStarting: true,
  notifyYourTurn: true,
  notifyResults: true,
  notifyConflicts: true,
  notifySyncErrors: true,

  // Scoring
  voiceAnnouncements: false,
  autoSaveFrequency: '30s',
  confirmationPrompts: 'errors-only',

  // Privacy & Security
  autoLogout: 30,
  rememberMe: true,
  biometricLogin: false,

  // Advanced
  developerMode: false,
  showFPS: false,
  showNetworkRequests: false,
  consoleLogging: 'errors',
  enableBetaFeatures: false,
  enablePerformanceMonitoring: false, // Disabled by default to minimize database costs
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        settings: defaultSettings,

        updateSettings: (updates) => {
          set((state) => ({
            settings: {
              ...state.settings,
              ...updates,
            },
          }));

          // Apply theme immediately
          if (updates.theme) {
            applyTheme(updates.theme);
          }

          // Apply font size immediately
          if (updates.fontSize) {
            applyFontSize(updates.fontSize);
          }

          // Apply density immediately
          if (updates.density) {
            applyDensity(updates.density);
          }

          // Apply reduce motion immediately
          if (updates.reduceMotion !== undefined) {
            applyReduceMotion(updates.reduceMotion);
          }
        },

        resetSettings: () => {
          set({ settings: defaultSettings });
          applyTheme('auto');
          applyFontSize('medium');
          applyDensity('comfortable');
          applyReduceMotion(false);
        },

        resetSection: (section) => {
          // This would reset specific sections - implement as needed
          console.log('Reset section:', section);
        },

        exportSettings: () => {
          const exportData = {
            version: SETTINGS_VERSION,
            exportedAt: new Date().toISOString(),
            settings: get().settings,
          };
          return JSON.stringify(exportData, null, 2);
        },

        importSettings: (json) => {
          try {
            const imported = JSON.parse(json);

            // Use migration system to handle version differences
            const result = importSettingsWithMigration(imported, defaultSettings);

            if (!result.success) {
              console.error('Failed to import settings');
              return false;
            }

            // Apply imported settings
            set({ settings: result.settings });

            // Log if migration occurred
            if (result.migrated) {
              console.log('Settings were migrated to current version');
            }

            // Apply settings immediately
            const newSettings = get().settings;
            applyTheme(newSettings.theme);
            applyFontSize(newSettings.fontSize);
            applyDensity(newSettings.density);
            applyReduceMotion(newSettings.reduceMotion);

            return true;
          } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
          }
        },
      }),
      {
        name: 'myK9Q_settings',
      }
    ),
    { name: 'SettingsStore' }
  )
);

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const root = document.documentElement;

  if (theme === 'auto') {
    // Remove manual theme class, let system preference take over
    root.classList.remove('theme-light', 'theme-dark');
  } else {
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${theme}`);
  }
}

/**
 * Apply font size to document
 */
function applyFontSize(size: 'small' | 'medium' | 'large') {
  const root = document.documentElement;
  root.classList.remove('font-small', 'font-medium', 'font-large');
  root.classList.add(`font-${size}`);
}

/**
 * Apply density to document
 */
function applyDensity(density: 'compact' | 'comfortable' | 'spacious') {
  const root = document.documentElement;
  root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
  root.classList.add(`density-${density}`);
}

/**
 * Apply reduce motion to document
 */
function applyReduceMotion(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

/**
 * Initialize settings on app load
 */
export function initializeSettings() {
  const { settings } = useSettingsStore.getState();
  applyTheme(settings.theme);
  applyFontSize(settings.fontSize);
  applyDensity(settings.density);
  applyReduceMotion(settings.reduceMotion);
}
