import { useEffect } from 'react';
import { useSettingsStore, initializeSettings } from '../stores/settingsStore';
import { performanceMonitor } from '../services/performanceMonitor';
import { analyticsService } from '../services/analyticsService';
import { notificationIntegration } from '../services/notificationIntegration';
import developerModeService from '../services/developerMode';
import { subscriptionCleanup } from '../services/subscriptionCleanup';
import { metricsApiService } from '../services/metricsApiService';
import { scheduleAutoCleanup } from '../utils/cacheManager';
import { applyDeviceClasses, startPerformanceMonitoring } from '../utils/deviceDetection';

/**
 * Custom hook to handle application initialization
 *
 * Responsibilities:
 * - Initialize user settings
 * - Apply device-specific CSS classes
 * - Start performance monitoring
 * - Initialize analytics
 * - Set up notification integration
 * - Initialize developer tools
 * - Schedule auto-cleanup tasks
 * - Set up subscription auto-cleanup
 * - Handle performance report on page unload
 *
 * @returns void
 */
export function useAppInitialization() {
  useEffect(() => {
    let cancelled = false;

    // Initialize user settings
    if (!cancelled) {
      initializeSettings();
    }

    // Apply device-specific CSS classes
    applyDeviceClasses();

    // Start monitoring performance
    const stopMonitoring = startPerformanceMonitoring();

    // Initialize performance and analytics
    performanceMonitor.setEnabled(true);
    analyticsService.setEnabled(true);
    analyticsService.trackPageView(window.location.pathname);

    // Initialize notification integration
    notificationIntegration.initialize();

    // Initialize developer tools
    developerModeService.initialize();

    // Schedule auto-cleanup
    scheduleAutoCleanup();

    // Start subscription auto-cleanup (cleanup every 30 seconds)
    const stopAutoCleanup = subscriptionCleanup.startAutoCleanup(30);

    // Handle performance report on unload
    const handleBeforeUnload = async () => {
      const { settings } = useSettingsStore.getState();
      if (settings.enablePerformanceMonitoring && performanceMonitor.hasProblems()) {
        const report = performanceMonitor.generateReport();
        await metricsApiService.sendPerformanceReport(report, 'unknown');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      cancelled = true;
      stopMonitoring();
      stopAutoCleanup();
      notificationIntegration.destroy();
      subscriptionCleanup.cleanupAll();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
