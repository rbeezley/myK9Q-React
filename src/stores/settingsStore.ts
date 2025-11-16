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
  enableAnimations: boolean | null; // null = auto-detect
  enableBlur: boolean | null; // null = auto-detect
  enableShadows: boolean | null; // null = auto-detect

  // Mobile
  pullToRefresh: boolean;
  hapticFeedback: boolean;

  // Notifications
  enableNotifications: boolean;
  notificationSound: boolean;
  voiceNotifications: boolean; // Speak push notifications aloud (your turn, results, etc.)
  showBadges: boolean;
  notifyYourTurnLeadDogs: 1 | 2 | 3 | 4 | 5; // How many dogs ahead to notify

  // Scoring
  voiceAnnouncements: boolean;
  voiceName: string; // Voice name to use (empty = browser default)
  voiceRate: number; // 0.5 to 2.0 (speed)
  announceTimerCountdown: boolean; // Announce 30s, 10s, 5s, etc.
  announceRunNumber: boolean; // Announce armband number and dog name
  announceResults: boolean; // Announce qualification/placement

  // Privacy & Security
  autoLogout: 480; // minutes, fixed at 8 hours

  // Developer Tools
  developerMode: boolean;
  devShowFPS: boolean;
  devShowMemory: boolean;
  devShowNetwork: boolean;
  devShowStateInspector: boolean;
  devShowPerformanceProfiler: boolean;
  devLogStateChanges: boolean;
  devLogNetworkRequests: boolean;
  devLogPerformanceMarks: boolean;
  consoleLogging: 'none' | 'errors' | 'all';
  enableBetaFeatures: boolean;
  enablePerformanceMonitoring: boolean; // Track metrics to database

  // Legacy (deprecated)
  showFPS?: boolean;
  showNetworkRequests?: boolean;
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
  enableAnimations: null,
  enableBlur: null,
  enableShadows: null,

  // Mobile
  pullToRefresh: true,
  hapticFeedback: true,

  // Notifications
  enableNotifications: false, // Default: disabled (users must explicitly opt-in)
  notificationSound: true,
  voiceNotifications: false, // Default: disabled (users must opt-in)
  showBadges: true,
  notifyYourTurnLeadDogs: 3, // Default: notify when 3 dogs ahead

  // Scoring
  voiceAnnouncements: false,
  voiceName: '', // Empty = browser default
  voiceRate: 1.0,
  announceTimerCountdown: true,
  announceRunNumber: true,
  announceResults: true,

  // Privacy & Security
  autoLogout: 480, // Default: 8 hours (typical trial length)

  // Developer Tools
  developerMode: false,
  devShowFPS: false,
  devShowMemory: false,
  devShowNetwork: false,
  devShowStateInspector: false,
  devShowPerformanceProfiler: false,
  devLogStateChanges: false,
  devLogNetworkRequests: false,
  devLogPerformanceMarks: false,
  consoleLogging: 'errors',
  enableBetaFeatures: false,
  enablePerformanceMonitoring: true, // Auto-enabled to help improve the app
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

          // Apply high contrast immediately
          if (updates.highContrast !== undefined) {
            applyHighContrast(updates.highContrast);
          }
        },

        resetSettings: () => {
          set({ settings: defaultSettings });
          applyTheme('auto');
          applyFontSize('medium');
          applyDensity('comfortable');
          applyReduceMotion(false);
          applyHighContrast(false);
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
            applyHighContrast(newSettings.highContrast);

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
    { name: 'SettingsStore', enabled: import.meta.env.DEV }
  )
);

/**
 * Apply theme to document
 */
function applyTheme(theme: 'light' | 'dark' | 'auto') {
  const root = document.documentElement;

  if (theme === 'auto') {
    // Detect system preference and apply appropriate class
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
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
 * Apply high contrast mode to document
 */
function applyHighContrast(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}

/**
 * Initialize settings on app load
 * NOTE: Theme and theme color are initialized by blocking script in index.html
 * This only applies non-theme settings (font size, density, etc.)
 */
export function initializeSettings() {
  const { settings } = useSettingsStore.getState();
  // Theme and theme color already applied by blocking script in index.html
  // Only apply other visual settings here
  applyFontSize(settings.fontSize);
  applyDensity(settings.density);
  applyReduceMotion(settings.reduceMotion);
  applyHighContrast(settings.highContrast);
}
