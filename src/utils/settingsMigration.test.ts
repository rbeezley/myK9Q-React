/**
 * Tests for settings migration system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  migrateSettings,
  needsMigration,
  validateSettings,
  repairSettings,
  createRollback,
  createSettingsExport,
  importSettingsWithMigration,
  SettingsExport,
} from './settingsMigration';
import { AppSettings, SETTINGS_VERSION } from '@/stores/settingsStore';

// Mock logger to suppress console output during tests
vi.mock('./logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const createMockSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
  theme: 'dark',
  fontSize: 'medium',
  density: 'comfortable',
  performanceMode: 'auto',
  reduceMotion: false,
  highContrast: false,
  realTimeSync: true,
  syncFrequency: 'immediate',
  offlineMode: false,
  wifiOnlySync: false,
  cloudSync: true,
  imagePriority: 'auto',
  animationIntensity: 'normal',
  hapticFeedback: true,
  pullToRefresh: true,
  pullSensitivity: 'medium',
  oneHandedMode: false,
  handPreference: 'auto',
  autoLogout: 480,
  consoleLogging: 'errors',
  betaFeatures: false,
  notifications: true,
  notificationSound: true,
  notificationBadge: true,
  dogsAheadNotify: 2,
  notifyYourTurn: true,
  notifyResults: true,
  notifySyncErrors: true,
  notifyClassStarting: false,
  doNotDisturb: false,
  doNotDisturbUntil: null,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  quietHoursAllowUrgent: true,
  voiceEnabled: false,
  voiceLanguage: 'en-US',
  voiceRate: 1.0,
  voicePitch: 1.0,
  voiceVolume: 100,
  autoSaveEnabled: true,
  autoSaveFrequency: 30,
  maxDraftsPerEntry: 5,
  confirmationMode: 'smart',
  developerMode: false,
  devShowFPS: false,
  devShowMemory: false,
  devShowNetwork: false,
  devShowState: false,
  devLogStateChanges: false,
  devLogNetworkRequests: false,
  devLogPerformanceMarks: false,
  devPerformanceMonitor: false,
  devNetworkInspector: false,
  ...overrides,
});

describe('settingsMigration', () => {
  describe('migrateSettings', () => {
    it('should return settings unchanged when versions match', () => {
      const settings = createMockSettings();
      const result = migrateSettings(settings, SETTINGS_VERSION, SETTINGS_VERSION);
      expect(result).toEqual(settings);
    });

    it('should throw error for unknown source version', () => {
      const settings = createMockSettings();
      expect(() => migrateSettings(settings, '0.5.0', SETTINGS_VERSION)).toThrow(
        'Cannot migrate from unknown version: 0.5.0'
      );
    });

    it('should throw error for unknown target version', () => {
      const settings = createMockSettings();
      expect(() => migrateSettings(settings, '1.0.0', '9.9.9')).toThrow(
        'Cannot migrate to unknown version: 9.9.9'
      );
    });

    it('should handle downgrade gracefully by returning settings as-is', () => {
      const settings = createMockSettings();
      const result = migrateSettings(settings, '1.0.0', '1.0.0');
      expect(result).toEqual(settings);
    });

    it('should apply migrations sequentially from 1.0.0 to current', () => {
      const settings = createMockSettings();
      const result = migrateSettings(settings, '1.0.0', SETTINGS_VERSION);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('needsMigration', () => {
    it('should return false for current version', () => {
      expect(needsMigration(SETTINGS_VERSION)).toBe(false);
    });

    it('should return true for older versions', () => {
      expect(needsMigration('0.9.0')).toBe(true);
    });

    it('should return false for future versions', () => {
      expect(needsMigration('9.9.9')).toBe(false);
    });
  });

  describe('validateSettings', () => {
    it('should validate complete settings object', () => {
      const settings = createMockSettings();
      expect(validateSettings(settings)).toBe(true);
    });

    it('should reject null settings', () => {
      expect(validateSettings(null)).toBe(false);
    });

    it('should reject undefined settings', () => {
      expect(validateSettings(undefined)).toBe(false);
    });

    it('should reject non-object settings', () => {
      expect(validateSettings('invalid')).toBe(false);
      expect(validateSettings(123)).toBe(false);
      expect(validateSettings([])).toBe(false);
    });

    it('should reject settings missing required fields', () => {
      const incomplete = { theme: 'dark' }; // Missing other required fields
      expect(validateSettings(incomplete)).toBe(false);
    });

    it('should accept settings with all required fields', () => {
      const minimal = {
        theme: 'dark',
        fontSize: 'medium',
        density: 'comfortable',
        performanceMode: 'auto',
      };
      expect(validateSettings(minimal)).toBe(true);
    });
  });

  describe('repairSettings', () => {
    const defaults = createMockSettings();

    it('should return valid settings unchanged', () => {
      const validSettings = createMockSettings({ theme: 'light' });
      const result = repairSettings(validSettings, defaults);
      expect(result.theme).toBe('light');
    });

    it('should merge invalid settings with defaults', () => {
      const invalid = { theme: 'dark' }; // Missing required fields
      const result = repairSettings(invalid, defaults);
      expect(result.theme).toBe('dark'); // Preserved from invalid
      expect(result.fontSize).toBe(defaults.fontSize); // From defaults
      expect(result.density).toBe(defaults.density); // From defaults
    });

    it('should preserve valid fields and fill missing ones', () => {
      const partial = {
        theme: 'light',
        fontSize: 'large',
        // Missing other required fields
      };
      const result = repairSettings(partial, defaults);
      expect(result.theme).toBe('light');
      expect(result.fontSize).toBe('large');
      expect(result.density).toBe(defaults.density);
      expect(result.performanceMode).toBe(defaults.performanceMode);
    });
  });

  describe('createRollback', () => {
    it('should create a rollback function that restores settings', () => {
      const originalSettings = createMockSettings({ theme: 'dark' });
      const rollback = createRollback(originalSettings);

      const restoredSettings = rollback();
      expect(restoredSettings).toEqual(originalSettings);
    });

    it('should create an independent copy for rollback', () => {
      const originalSettings = createMockSettings({ theme: 'dark' });
      const rollback = createRollback(originalSettings);

      // Modify original
      originalSettings.theme = 'light';

      // Rollback should restore original state
      const restoredSettings = rollback();
      expect(restoredSettings.theme).toBe('dark');
    });
  });

  describe('createSettingsExport', () => {
    it('should create export with version and timestamp', () => {
      const settings = createMockSettings();
      const exportData = createSettingsExport(settings);

      expect(exportData.version).toBe(SETTINGS_VERSION);
      expect(exportData.settings).toEqual(settings);
      expect(exportData.exportedAt).toBeDefined();
      expect(new Date(exportData.exportedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should include platform metadata', () => {
      const settings = createMockSettings();
      const exportData = createSettingsExport(settings);

      expect(exportData.metadata).toBeDefined();
      expect(exportData.metadata?.platform).toBeDefined();
      expect(exportData.metadata?.deviceType).toMatch(/mobile|desktop/);
    });

    it('should create valid ISO timestamp', () => {
      const settings = createMockSettings();
      const exportData = createSettingsExport(settings);

      expect(() => new Date(exportData.exportedAt)).not.toThrow();
      expect(exportData.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('importSettingsWithMigration', () => {
    const defaults = createMockSettings();

    it('should import current version settings without migration', () => {
      const settings = createMockSettings({ theme: 'light' });
      const exportData = createSettingsExport(settings);

      const result = importSettingsWithMigration(exportData, defaults);

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(false);
      expect(result.settings.theme).toBe('light');
    });

    it('should handle legacy format (plain settings object)', () => {
      const legacySettings = createMockSettings({ theme: 'dark' });

      const result = importSettingsWithMigration(legacySettings, defaults);

      expect(result.success).toBe(true);
      expect(result.migrated).toBe(false);
      expect(result.settings.theme).toBe('dark');
    });

    it('should migrate older version settings', () => {
      const oldSettings: SettingsExport = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings: createMockSettings(),
      };

      const result = importSettingsWithMigration(oldSettings, defaults);

      expect(result.success).toBe(true);
      expect(result.settings).toBeDefined();
    });

    it('should repair invalid imported settings', () => {
      const invalidExport: SettingsExport = {
        version: SETTINGS_VERSION,
        exportedAt: new Date().toISOString(),
        settings: { theme: 'dark' } as any, // Missing required fields
      };

      const result = importSettingsWithMigration(invalidExport, defaults);

      expect(result.success).toBe(true);
      expect(result.settings.theme).toBe('dark'); // Preserved
      expect(result.settings.fontSize).toBe(defaults.fontSize); // From defaults
    });

    it('should repair severely corrupted data with defaults', () => {
      const corruptedData = { invalid: 'data' } as any;

      const result = importSettingsWithMigration(corruptedData, defaults);

      // System should repair even severely corrupted data
      expect(result.success).toBe(true);
      expect(result.settings).toBeDefined();
      expect(result.settings.theme).toBeDefined();
      expect(result.settings.fontSize).toBeDefined();
      expect(result.migrated).toBe(false); // No migration, just repair
    });

    it('should handle missing version field gracefully', () => {
      const noVersion = {
        exportedAt: new Date().toISOString(),
        settings: createMockSettings(),
      } as any;

      const result = importSettingsWithMigration(noVersion, defaults);

      expect(result.success).toBe(true);
      expect(result.settings).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty settings object', () => {
      const defaults = createMockSettings();
      const result = repairSettings({}, defaults);
      expect(result).toEqual(defaults);
    });

    it('should handle settings with extra fields', () => {
      const settingsWithExtra = {
        ...createMockSettings(),
        unknownField: 'value',
        anotherField: 123,
      } as any;

      expect(validateSettings(settingsWithExtra)).toBe(true);
    });

    it('should preserve extra fields during repair', () => {
      const defaults = createMockSettings();
      const settingsWithExtra = {
        theme: 'dark',
        customField: 'preserved',
      } as any;

      const result = repairSettings(settingsWithExtra, defaults);
      expect(result.customField).toBe('preserved');
    });
  });
});
