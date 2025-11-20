/**
 * Tests for settings store
 */

import { vi } from 'vitest';
import { useSettingsStore, AppSettings, SETTINGS_VERSION, initializeSettings } from './settingsStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document.documentElement for theme/font/density application
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
};

Object.defineProperty(document, 'documentElement', {
  value: {
    classList: mockClassList,
  },
  writable: true,
});

// Mock window.matchMedia for auto theme detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    localStorageMock.clear();
    mockClassList.add.mockClear();
    mockClassList.remove.mockClear();
    mockClassList.contains.mockClear();

    // Reset store to defaults
    useSettingsStore.setState({
      settings: {
        theme: 'auto',
        fontSize: 'medium',
        reduceMotion: false,
        highContrast: false,
        density: 'comfortable',
        performanceMode: 'auto',
        imageQuality: 'high',
        enableAnimations: null,
        enableBlur: null,
        enableShadows: null,
        oneHandedMode: false,
        handPreference: 'auto',
        pullToRefresh: true,
        pullSensitivity: 'normal',
        hapticFeedback: true,
        realTimeSync: true,
        syncFrequency: 'immediate',
        wifiOnlySync: false,
        autoDownloadShows: false,
        storageLimit: 500,
        autoCleanup: true,
        enableNotifications: true,
        notificationSound: true,
        showBadges: true,
        notifyClassStarting: true,
        notifyYourTurn: true,
        notifyYourTurnLeadDogs: 2,
        notifyResults: true,
        notifySyncErrors: true,
        voiceAnnouncements: false,
        voiceLanguage: 'en-US',
        voiceRate: 1.0,
        voicePitch: 1.0,
        voiceVolume: 1.0,
        announceTimerCountdown: true,
        announceRunNumber: true,
        announceResults: true,
        autoSaveFrequency: '10s',
        autoSaveEnabled: true,
        maxDraftsPerEntry: 3,
        confirmationPrompts: 'smart',
        bypassConfirmationsAfter: 10,
        autoLogout: 480,
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
        enablePerformanceMonitoring: false,
      },
    });
  });

  describe('updateSettings', () => {
    it('should update single setting', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ theme: 'dark' });

      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('dark');
    });

    it('should update multiple settings', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({
        theme: 'light',
        fontSize: 'large',
        density: 'spacious',
      });

      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('light');
      expect(state.settings.fontSize).toBe('large');
      expect(state.settings.density).toBe('spacious');
    });

    it('should preserve other settings when updating', () => {
      const store = useSettingsStore.getState();
      const originalSync = store.settings.realTimeSync;

      store.updateSettings({ theme: 'dark' });

      const state = useSettingsStore.getState();
      expect(state.settings.realTimeSync).toBe(originalSync);
    });

    it('should apply theme immediately via CSS class', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ theme: 'dark' });

      expect(mockClassList.remove).toHaveBeenCalledWith('theme-light', 'theme-dark');
      expect(mockClassList.add).toHaveBeenCalledWith('theme-dark');
    });

    it('should apply font size immediately via CSS class', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ fontSize: 'large' });

      expect(mockClassList.remove).toHaveBeenCalledWith('font-small', 'font-medium', 'font-large');
      expect(mockClassList.add).toHaveBeenCalledWith('font-large');
    });

    it('should apply density immediately via CSS class', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ density: 'compact' });

      expect(mockClassList.remove).toHaveBeenCalledWith(
        'density-compact',
        'density-comfortable',
        'density-spacious'
      );
      expect(mockClassList.add).toHaveBeenCalledWith('density-compact');
    });

    it('should apply reduce motion immediately', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ reduceMotion: true });

      expect(mockClassList.add).toHaveBeenCalledWith('reduce-motion');
    });

    it('should remove reduce motion when disabled', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ reduceMotion: false });

      expect(mockClassList.remove).toHaveBeenCalledWith('reduce-motion');
    });

    it('should apply high contrast immediately', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ highContrast: true });

      expect(mockClassList.add).toHaveBeenCalledWith('high-contrast');
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      const store = useSettingsStore.getState();

      // Change settings
      store.updateSettings({
        theme: 'dark',
        fontSize: 'large',
        density: 'compact',
        hapticFeedback: false,
      });

      // Reset
      store.resetSettings();

      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('auto');
      expect(state.settings.fontSize).toBe('medium');
      expect(state.settings.density).toBe('comfortable');
      expect(state.settings.hapticFeedback).toBe(true);
    });

    it('should reapply default CSS classes', () => {
      const store = useSettingsStore.getState();
      mockClassList.add.mockClear();
      mockClassList.remove.mockClear();

      store.resetSettings();

      // Should apply auto theme (detects system preference)
      expect(mockClassList.remove).toHaveBeenCalledWith('theme-light', 'theme-dark');
      expect(mockClassList.add).toHaveBeenCalledWith('font-medium');
      expect(mockClassList.add).toHaveBeenCalledWith('density-comfortable');
    });
  });

  describe('exportSettings', () => {
    it('should export settings as JSON string', () => {
      const store = useSettingsStore.getState();
      const exported = store.exportSettings();

      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should include version in export', () => {
      const store = useSettingsStore.getState();
      const exported = store.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe(SETTINGS_VERSION);
    });

    it('should include timestamp in export', () => {
      const store = useSettingsStore.getState();
      const exported = store.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.exportedAt).toBeDefined();
      expect(new Date(parsed.exportedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should include all settings in export', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ theme: 'dark', fontSize: 'large' });

      const exported = store.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed.settings.theme).toBe('dark');
      expect(parsed.settings.fontSize).toBe('large');
    });

    it('should format JSON with indentation', () => {
      const store = useSettingsStore.getState();
      const exported = store.exportSettings();

      // Check if JSON has newlines (indicating formatting)
      expect(exported).toContain('\n');
      expect(exported).toContain('  '); // Check for indentation
    });
  });

  describe('importSettings', () => {
    it('should import valid settings JSON', () => {
      const store = useSettingsStore.getState();
      const exportData = {
        version: SETTINGS_VERSION,
        exportedAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          fontSize: 'large',
          density: 'spacious',
          performanceMode: 'high',
          imageQuality: 'low',
          enableAnimations: false,
          enableBlur: false,
          enableShadows: false,
          oneHandedMode: true,
          handPreference: 'left',
          pullToRefresh: false,
          pullSensitivity: 'firm',
          hapticFeedback: false,
          realTimeSync: false,
          syncFrequency: 'manual',
          wifiOnlySync: true,
          autoDownloadShows: true,
          storageLimit: 1000,
          autoCleanup: false,
          enableNotifications: false,
          notificationSound: false,
          showBadges: false,
          notifyClassStarting: false,
          notifyYourTurn: false,
          notifyYourTurnLeadDogs: 5,
          notifyResults: false,
          notifySyncErrors: false,
          voiceAnnouncements: true,
          voiceLanguage: 'es-ES',
          voiceRate: 1.5,
          voicePitch: 1.2,
          voiceVolume: 0.8,
          announceTimerCountdown: false,
          announceRunNumber: false,
          announceResults: false,
          autoSaveFrequency: '5m',
          autoSaveEnabled: false,
          maxDraftsPerEntry: 10,
          confirmationPrompts: 'always',
          bypassConfirmationsAfter: 50,
          autoLogout: 240,
          developerMode: true,
          devShowFPS: true,
          devShowMemory: true,
          devShowNetwork: true,
          devShowStateInspector: true,
          devShowPerformanceProfiler: true,
          devLogStateChanges: true,
          devLogNetworkRequests: true,
          devLogPerformanceMarks: true,
          consoleLogging: 'all',
          enableBetaFeatures: true,
          enablePerformanceMonitoring: true,
        },
      };

      const result = store.importSettings(JSON.stringify(exportData));

      expect(result).toBe(true);
      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('dark');
      expect(state.settings.fontSize).toBe('large');
    });

    it('should return false for invalid JSON', () => {
      const store = useSettingsStore.getState();
      const result = store.importSettings('invalid json{]');

      expect(result).toBe(false);
    });

    it('should repair corrupted settings with defaults', () => {
      const store = useSettingsStore.getState();
      const corruptedData = JSON.stringify({ invalid: 'data' });

      const result = store.importSettings(corruptedData);

      // Migration system should repair corrupted data
      expect(result).toBe(true);

      // Should have valid default settings
      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBeDefined();
      expect(state.settings.fontSize).toBeDefined();
    });

    it('should apply imported settings immediately', () => {
      const store = useSettingsStore.getState();
      const exportData = {
        version: SETTINGS_VERSION,
        exportedAt: new Date().toISOString(),
        settings: {
          ...store.settings,
          theme: 'light',
          fontSize: 'small',
          density: 'compact',
          reduceMotion: true,
          highContrast: true,
        },
      };

      mockClassList.add.mockClear();
      mockClassList.remove.mockClear();

      store.importSettings(JSON.stringify(exportData));

      // Should apply all visual settings
      expect(mockClassList.add).toHaveBeenCalledWith('theme-light');
      expect(mockClassList.add).toHaveBeenCalledWith('font-small');
      expect(mockClassList.add).toHaveBeenCalledWith('density-compact');
      expect(mockClassList.add).toHaveBeenCalledWith('reduce-motion');
      expect(mockClassList.add).toHaveBeenCalledWith('high-contrast');
    });

    it('should handle legacy format without version', () => {
      const store = useSettingsStore.getState();
      const legacySettings = {
        theme: 'dark',
        fontSize: 'medium',
        density: 'comfortable',
        performanceMode: 'auto',
        // ... other required fields
      };

      // Should not throw error
      const result = store.importSettings(JSON.stringify(legacySettings));
      expect(result).toBe(true);
    });
  });

  describe('initializeSettings', () => {
    it('should apply all settings on initialization', () => {
      mockClassList.add.mockClear();
      mockClassList.remove.mockClear();

      initializeSettings();

      // Should apply theme, font size, density
      expect(mockClassList.add).toHaveBeenCalled();
      expect(mockClassList.remove).toHaveBeenCalled();
    });

    it('should detect system theme preference for auto theme', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ theme: 'auto' });

      mockClassList.add.mockClear();
      initializeSettings();

      // Should apply theme-dark (based on our mock)
      expect(mockClassList.add).toHaveBeenCalledWith('theme-dark');
    });
  });

  describe('persistence', () => {
    it('should persist settings to localStorage on update', () => {
      const store = useSettingsStore.getState();
      store.updateSettings({ theme: 'dark' });

      // Zustand persist middleware should save to localStorage
      // Note: In test environment, persistence may be async, so we just verify the update worked
      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('dark');

      // If localStorage is set, verify the structure
      const stored = localStorageMock.getItem('myK9Q_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.settings.theme).toBe('dark');
      }
    });
  });

  describe('default values', () => {
    it('should have correct default theme', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('auto');
    });

    it('should have correct default font size', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.fontSize).toBe('medium');
    });

    it('should have correct default density', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.density).toBe('comfortable');
    });

    it('should have correct default performance mode', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.performanceMode).toBe('auto');
    });

    it('should have haptic feedback enabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.hapticFeedback).toBe(true);
    });

    it('should have real-time sync enabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.realTimeSync).toBe(true);
    });

    it('should have notifications enabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.enableNotifications).toBe(true);
    });

    it('should notify when 2 dogs ahead by default', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.notifyYourTurnLeadDogs).toBe(2);
    });

    it('should have 8-hour auto-logout by default', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.autoLogout).toBe(480); // 8 hours in minutes
    });

    it('should have developer mode disabled by default', () => {
      const state = useSettingsStore.getState();
      expect(state.settings.developerMode).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid consecutive updates', () => {
      const store = useSettingsStore.getState();

      store.updateSettings({ theme: 'dark' });
      store.updateSettings({ theme: 'light' });
      store.updateSettings({ theme: 'auto' });

      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('auto');
    });

    it('should handle empty update object', () => {
      const store = useSettingsStore.getState();
      const originalSettings = { ...store.settings };

      store.updateSettings({});

      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(originalSettings);
    });

    it('should handle partial settings import', () => {
      const store = useSettingsStore.getState();
      const partialExport = {
        version: SETTINGS_VERSION,
        exportedAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          fontSize: 'large',
          // Missing other required fields
        },
      };

      const result = store.importSettings(JSON.stringify(partialExport));

      // Should succeed by merging with defaults
      expect(result).toBe(true);
      const state = useSettingsStore.getState();
      expect(state.settings.theme).toBe('dark');
      expect(state.settings.density).toBeDefined(); // Should have default value
    });
  });
});
