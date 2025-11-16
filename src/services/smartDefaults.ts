/**
 * Smart Defaults Service
 *
 * Provides intelligent default settings based on device capabilities,
 * network conditions, and user context. Applied on first launch or
 * when user requests to restore defaults.
 */

import { detectDeviceCapabilities, getPerformanceSettings } from '@/utils/deviceDetection';
import { networkDetectionService } from './networkDetectionService';
import type { AppSettings } from '@/stores/settingsStore';

export interface SmartDefaultsContext {
  /** Device capabilities */
  deviceTier: 'low' | 'medium' | 'high';

  /** Connection type */
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'unknown';

  /** Connection quality */
  connectionQuality: 'slow' | 'medium' | 'fast';

  /** Is first launch */
  isFirstLaunch: boolean;

  /** User role (from auth context) */
  userRole?: 'admin' | 'judge' | 'steward' | 'exhibitor';

  /** Battery level (if available) */
  batteryLevel?: number;

  /** Is charging */
  isCharging?: boolean;
}

/**
 * Detect context for smart defaults
 */
export async function detectDefaultsContext(userRole?: string): Promise<SmartDefaultsContext> {
  const capabilities = await detectDeviceCapabilities();
  const networkInfo = networkDetectionService.getNetworkInfo();

  // Check if this is first launch
  const isFirstLaunch = !localStorage.getItem('myK9Q_settings');

  // Get battery info if available
  let batteryLevel: number | undefined;
  let isCharging: boolean | undefined;

  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      batteryLevel = battery.level;
      isCharging = battery.charging;
    } catch {
      // Battery API not available
    }
  }

  // Map network info to context format
  let connectionQuality: 'slow' | 'medium' | 'fast' = 'medium';
  if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
    connectionQuality = 'slow';
  } else if (networkInfo.effectiveType === '4g') {
    connectionQuality = 'fast';
  }

  return {
    deviceTier: capabilities.tier,
    connectionType: networkInfo.connectionType,
    connectionQuality,
    isFirstLaunch,
    userRole: userRole as any,
    batteryLevel,
    isCharging,
  };
}

/**
 * Generate smart default settings based on context
 */
export async function generateSmartDefaults(
  context: SmartDefaultsContext
): Promise<Partial<AppSettings>> {
  const perfSettings = await getPerformanceSettings();

  const defaults: Partial<AppSettings> = {
    // Animations - based on device tier
    enableAnimations: perfSettings.animations,
    reduceMotion: context.deviceTier === 'low' || (context.batteryLevel !== undefined && context.batteryLevel < 0.2),

    // Visual Effects
    enableBlur: perfSettings.blurEffects,
    enableShadows: perfSettings.shadows,

    // Display Settings
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    fontSize: 'medium',
    density: context.deviceTier === 'low' ? 'compact' : 'comfortable',

    // Notification Settings
    enableNotifications: true,
    notificationSound: context.deviceTier !== 'low',
    showBadges: true,
    notifyYourTurnLeadDogs: 3,

    // Accessibility
    highContrast: window.matchMedia('(prefers-contrast: high)').matches,

    // Scoring
    voiceAnnouncements: false,

    // Privacy & Security
    autoLogout: 480, // Default: 8 hours

    // Mobile
    pullToRefresh: true,
    hapticFeedback: context.deviceTier !== 'low' && 'vibrate' in navigator,

    // Advanced
    developerMode: false,
    consoleLogging: 'errors' as const,
    enableBetaFeatures: false,
    enablePerformanceMonitoring: false,

    // Apply role-based defaults
    ...getRoleBasedDefaults(context.userRole),
  };

  return defaults;
}


/**
 * Get role-based defaults
 * Different user roles may have different default preferences
 */
function getRoleBasedDefaults(role?: string): Partial<AppSettings> {
  const defaults: Partial<AppSettings> = {};

  // Judges typically want voice announcements and notifications
  if (role === 'judge') {
    defaults.voiceAnnouncements = true;
    defaults.notificationSound = true;
  }

  // Stewards may prefer quieter notifications
  if (role === 'steward') {
    defaults.voiceAnnouncements = false;
    defaults.notificationSound = false;
  }

  // Exhibitors get simpler interface
  if (role === 'exhibitor') {
    defaults.density = 'comfortable';
  }

  return defaults;
}

/**
 * Apply smart defaults to settings store
 */
export async function applySmartDefaults(
  currentSettings: AppSettings,
  userRole?: string,
  forceReset = false
): Promise<AppSettings> {
  const context = await detectDefaultsContext(userRole);
  const smartDefaults = await generateSmartDefaults(context);

  // If force reset, replace all settings
  if (forceReset) {
    return {
      ...currentSettings,
      ...smartDefaults,
    } as AppSettings;
  }

  // Otherwise, only fill in undefined/null values
  const mergedSettings: any = { ...currentSettings };

  Object.keys(smartDefaults).forEach((key) => {
    if (mergedSettings[key] === undefined || mergedSettings[key] === null) {
      mergedSettings[key] = smartDefaults[key as keyof AppSettings];
    }
  });

  return mergedSettings as AppSettings;
}

/**
 * Get recommended settings for a specific scenario
 */
export async function getRecommendedSettings(
  scenario: 'battery-saver' | 'performance' | 'data-saver' | 'balanced'
): Promise<Partial<AppSettings>> {
  const context = await detectDefaultsContext();

  switch (scenario) {
    case 'battery-saver':
      return {
        enableAnimations: false,
        reduceMotion: true,
        enableBlur: false,
        enableShadows: false,
        notificationSound: false,
        hapticFeedback: false,
        voiceAnnouncements: false,
      };

    case 'performance':
      return {
        enableAnimations: true,
        reduceMotion: false,
        enableBlur: true,
        enableShadows: true,
        notificationSound: true,
        hapticFeedback: true,
        density: 'spacious',
      };

    case 'data-saver':
      // Data-saver mode no longer disables auto-download
      // Offline-first architecture requires data sync for app to function
      return {};

    case 'balanced':
    default:
      return await generateSmartDefaults(context);
  }
}

/**
 * Validate settings against device capabilities
 */
export async function validateSettings(
  settings: AppSettings
): Promise<{
  valid: boolean;
  warnings: string[];
  recommendations: Partial<AppSettings>;
}> {
  const context = await detectDefaultsContext();
  const warnings: string[] = [];
  const recommendations: Partial<AppSettings> = {};

  // Check if animations are enabled on low-end device
  if (context.deviceTier === 'low' && settings.enableAnimations) {
    warnings.push('Animations may cause performance issues on this device');
    recommendations.enableAnimations = false;
  }

  // Check if sync is on cellular
  if (context.connectionType === 'cellular') {
    warnings.push('Syncing on cellular may use significant data - consider using WiFi when possible');
  }

  // Check if blur effects are enabled on low-end GPU
  const capabilities = await detectDeviceCapabilities();
  if (capabilities.gpu === 'low' && settings.enableBlur) {
    warnings.push('Blur effects may cause performance issues with this GPU');
    recommendations.enableBlur = false;
  }

  return {
    valid: warnings.length === 0,
    warnings,
    recommendations,
  };
}

/**
 * Get settings optimization suggestions
 */
export async function getOptimizationSuggestions(
  currentSettings: AppSettings
): Promise<Array<{
  category: string;
  suggestion: string;
  setting: keyof AppSettings;
  currentValue: any;
  recommendedValue: any;
  impact: 'low' | 'medium' | 'high';
}>> {
  const validation = await validateSettings(currentSettings);
  const suggestions: Array<{
    category: string;
    suggestion: string;
    setting: keyof AppSettings;
    currentValue: any;
    recommendedValue: any;
    impact: 'low' | 'medium' | 'high';
  }> = [];

  // Convert validation warnings to suggestions
  Object.entries(validation.recommendations).forEach(([key, value]) => {
    const setting = key as keyof AppSettings;
    const currentValue = currentSettings[setting];

    let category = 'General';
    let impact: 'low' | 'medium' | 'high' = 'medium';
    let suggestion = '';

    // Categorize and describe suggestions
    if (setting === 'enableAnimations' || setting === 'enableBlur' || setting === 'enableShadows') {
      category = 'Performance';
      impact = 'high';
      suggestion = `Disabling ${setting.replace('enable', '').toLowerCase()} will improve performance`;
    }

    suggestions.push({
      category,
      suggestion,
      setting,
      currentValue,
      recommendedValue: value,
      impact,
    });
  });

  return suggestions;
}

/**
 * Auto-optimize settings based on current conditions
 */
export async function autoOptimizeSettings(
  currentSettings: AppSettings,
  scenario?: 'battery-saver' | 'performance' | 'data-saver'
): Promise<AppSettings> {
  // If scenario specified, apply preset
  if (scenario) {
    const recommended = await getRecommendedSettings(scenario);
    return {
      ...currentSettings,
      ...recommended,
    } as AppSettings;
  }

  // Otherwise, apply smart recommendations
  const validation = await validateSettings(currentSettings);
  return {
    ...currentSettings,
    ...validation.recommendations,
  } as AppSettings;
}
