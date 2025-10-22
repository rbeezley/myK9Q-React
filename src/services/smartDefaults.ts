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
    // Performance Mode - default to auto
    performanceMode: 'auto',

    // Animations - based on device tier
    enableAnimations: perfSettings.animations,
    reduceMotion: context.deviceTier === 'low' || (context.batteryLevel !== undefined && context.batteryLevel < 0.2),

    // Visual Effects
    enableBlur: perfSettings.blurEffects,
    enableShadows: perfSettings.shadows,

    // Image Quality - based on device and connection
    imageQuality: getImageQualityDefault(context),

    // Sync Settings
    realTimeSync: getRealTimeSyncDefault(context),
    wifiOnlySync: context.connectionType === 'cellular',
    syncFrequency: getSyncFrequencyDefault(context),
    autoDownloadShows: context.deviceTier === 'high' && context.connectionQuality === 'fast',

    // Storage Settings
    storageLimit: getStorageLimitDefault(context),
    autoCleanup: true,

    // Display Settings
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    fontSize: 'medium',
    density: context.deviceTier === 'low' ? 'compact' : 'comfortable',

    // Notification Settings
    enableNotifications: true,
    notificationSound: context.deviceTier !== 'low',
    showBadges: true,
    notifyClassStarting: true,
    notifyYourTurn: true,
    notifyYourTurnLeadDogs: 2,
    notifyResults: true,
    notifySyncErrors: true,

    // Accessibility
    highContrast: window.matchMedia('(prefers-contrast: high)').matches,

    // Scoring
    voiceAnnouncements: false,
    autoSaveFrequency: getAutoSaveFrequencyDefault(context),
    confirmationPrompts: 'smart' as const,

    // Privacy & Security
    autoLogout: 480, // Default: 8 hours

    // Mobile
    oneHandedMode: false,
    handPreference: 'auto' as const,
    pullToRefresh: true,
    pullSensitivity: 'normal' as const,
    hapticFeedback: context.deviceTier !== 'low' && 'vibrate' in navigator,

    // Advanced
    developerMode: false,
    showFPS: false,
    showNetworkRequests: false,
    consoleLogging: 'errors' as const,
    enableBetaFeatures: false,
    enablePerformanceMonitoring: false,

    // Apply role-based defaults
    ...getRoleBasedDefaults(context.userRole),
  };

  return defaults;
}

/**
 * Get image quality default based on context
 */
function getImageQualityDefault(context: SmartDefaultsContext): 'low' | 'medium' | 'high' | 'original' {
  // If on cellular with slow connection, use low quality
  if (context.connectionType === 'cellular' && context.connectionQuality === 'slow') {
    return 'low';
  }

  // If low-end device, use medium quality
  if (context.deviceTier === 'low') {
    return 'medium';
  }

  // If high-end device with good connection, use high quality
  if (context.deviceTier === 'high' && context.connectionQuality === 'fast') {
    return 'high';
  }

  // Default to medium for most cases
  return 'medium';
}

/**
 * Get real-time sync default based on context
 */
function getRealTimeSyncDefault(context: SmartDefaultsContext): boolean {
  // Disable on low-end devices to save resources
  if (context.deviceTier === 'low') {
    return false;
  }

  // Disable on slow connections
  if (context.connectionQuality === 'slow') {
    return false;
  }

  // Disable if battery is low and not charging
  if (
    context.batteryLevel !== undefined &&
    context.batteryLevel < 0.2 &&
    context.isCharging === false
  ) {
    return false;
  }

  // Enable by default for good conditions
  return true;
}

/**
 * Get sync frequency default based on context
 */
function getSyncFrequencyDefault(context: SmartDefaultsContext): 'immediate' | '5s' | '30s' | 'manual' {
  // Low-end devices: 30 second intervals
  if (context.deviceTier === 'low') {
    return '30s';
  }

  // Slow connection: 30 second intervals
  if (context.connectionQuality === 'slow') {
    return '30s';
  }

  // Fast connection: immediate
  if (context.connectionQuality === 'fast' && context.deviceTier === 'high') {
    return 'immediate';
  }

  // Default: 5 second intervals
  return '5s';
}

/**
 * Get storage limit default based on context
 */
function getStorageLimitDefault(context: SmartDefaultsContext): 100 | 500 | 1000 | -1 {
  // Low-end devices: 100MB
  if (context.deviceTier === 'low') {
    return 100;
  }

  // Medium devices: 500MB
  if (context.deviceTier === 'medium') {
    return 500;
  }

  // High-end devices: 1GB
  return 1000;
}

/**
 * Get auto-save frequency default based on context
 */
function getAutoSaveFrequencyDefault(context: SmartDefaultsContext): 'immediate' | '10s' | '30s' | '1m' | '5m' {
  // High-end devices with good connection: immediate
  if (context.deviceTier === 'high' && context.connectionQuality === 'fast') {
    return 'immediate';
  }

  // Low-end devices: 1 minute
  if (context.deviceTier === 'low') {
    return '1m';
  }

  // Default: 10 seconds
  return '10s';
}

/**
 * Get role-based defaults
 * Different user roles may have different default preferences
 */
function getRoleBasedDefaults(role?: string): Partial<AppSettings> {
  const defaults: Partial<AppSettings> = {};

  // Judges typically want immediate sync and voice announcements
  if (role === 'judge') {
    defaults.voiceAnnouncements = true;
    defaults.notificationSound = true;
    defaults.syncFrequency = 'immediate';
  }

  // Stewards may prefer quieter notifications
  if (role === 'steward') {
    defaults.voiceAnnouncements = false;
    defaults.notificationSound = false;
  }

  // Exhibitors get simpler interface
  if (role === 'exhibitor') {
    defaults.density = 'comfortable';
    defaults.confirmationPrompts = 'always';
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
        performanceMode: 'low',
        enableAnimations: false,
        reduceMotion: true,
        enableBlur: false,
        enableShadows: false,
        realTimeSync: false,
        syncFrequency: 'manual',
        imageQuality: 'low',
        notificationSound: false,
        hapticFeedback: false,
        voiceAnnouncements: false,
      };

    case 'performance':
      return {
        performanceMode: 'high',
        enableAnimations: true,
        reduceMotion: false,
        enableBlur: true,
        enableShadows: true,
        realTimeSync: true,
        syncFrequency: 'immediate',
        imageQuality: 'high',
        notificationSound: true,
        hapticFeedback: true,
        density: 'spacious',
      };

    case 'data-saver':
      return {
        imageQuality: 'low',
        wifiOnlySync: true,
        realTimeSync: false,
        syncFrequency: 'manual',
        autoDownloadShows: false,
        storageLimit: 100,
      };

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

  // Check if real-time sync is enabled on slow connection
  if (context.connectionQuality === 'slow' && settings.realTimeSync) {
    warnings.push('Real-time sync may be slow on this connection');
    recommendations.realTimeSync = false;
  }

  // Check if high image quality is used on cellular
  if (context.connectionType === 'cellular' && settings.imageQuality === 'high') {
    warnings.push('High image quality may use significant data on cellular');
    recommendations.imageQuality = 'medium';
  }

  // Check if sync is not WiFi-only on cellular
  if (context.connectionType === 'cellular' && !settings.wifiOnlySync) {
    warnings.push('Syncing on cellular may use significant data');
    recommendations.wifiOnlySync = true;
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
    } else if (setting === 'imageQuality') {
      category = 'Data Usage';
      impact = 'medium';
      suggestion = 'Reducing image quality will save data and improve loading times';
    } else if (setting === 'realTimeSync') {
      category = 'Sync';
      impact = 'medium';
      suggestion = 'Disabling real-time sync will reduce battery and data usage';
    } else if (setting === 'wifiOnlySync') {
      category = 'Data Usage';
      impact = 'high';
      suggestion = 'Enabling WiFi-only sync will prevent cellular data usage';
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
