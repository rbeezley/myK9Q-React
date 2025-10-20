 
/**
 * useMonitoring Hook
 *
 * Integrates performance monitoring, analytics, and rage detection
 * into React components with minimal boilerplate.
 */

import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '@/services/performanceMonitor';
import { analyticsService } from '@/services/analyticsService';
import { rageClickDetector } from '@/services/rageClickDetector';

/**
 * Track component render performance
 */
   
export function useRenderMetrics(componentName: string): void {
  const renderStartRef = useRef(performance.now()); // eslint-disable-line react-hooks/purity

  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    performanceMonitor.recordMetric(
      `component.${componentName}.render`,
      renderTime,
      'ms'
    );
  });
}

/**
 * Track page view and navigation
 */
export function usePageView(pageName: string, metadata?: Record<string, any>): void {
  useEffect(() => {
    analyticsService.trackPageView(pageName, metadata);
    performanceMonitor.recordMetric(`page_view.${pageName}`, 0, 'ms');
  }, [pageName, metadata]);
}

/**
 * Track action with automatic timing
 */
export function useActionTracking(actionName: string) {
  const track = useCallback(
    async <T,>(action: () => Promise<T>, metadata?: Record<string, any>) => {
      const startTime = performance.now();

      try {
        const result = await action();
        const duration = performance.now() - startTime;

        analyticsService.trackAction(actionName, true, duration, metadata);
        performanceMonitor.recordMetric(
          `action.${actionName}.success`,
          duration,
          'ms',
          { ...metadata, status: 'success' }
        );

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        analyticsService.trackAction(actionName, false, duration, {
          ...metadata,
          error: (error as Error).message,
        });

        performanceMonitor.recordMetric(
          `action.${actionName}.error`,
          duration,
          'ms',
          {
            ...metadata,
            status: 'error',
            error: (error as Error).message,
          }
        );

        throw error;
      }
    },
    [actionName]
  );

  return { track };
}

/**
 * Track feature usage with automatic timing
 */
export function useFeatureTracking(featureName: string) {
  const startUsage = useCallback(() => {
    return analyticsService.startFeatureUsage(featureName);
  }, [featureName]);

  const getStats = useCallback(() => {
    return analyticsService.getFeatureStats(featureName);
  }, [featureName]);

  return {
    startUsage,
    getStats,
  };
}

/**
 * Track custom events
 */
export function useEventTracking() {
  const trackEvent = useCallback(
    (
      name: string,
      category: string,
      value?: number,
      metadata?: Record<string, any>
    ) => {
      analyticsService.trackEvent(name, category, value, metadata);
    },
    []
  );

  const trackTiming = useCallback((name: string, duration: number, category?: string) => {
    analyticsService.trackTiming(name, duration, category);
    performanceMonitor.recordMetric(`custom_timing.${name}`, duration, 'ms', {
      category,
    });
  }, []);

  return {
    trackEvent,
    trackTiming,
  };
}

/**
 * Measure component performance with mark/measure pattern
 */
export function usePerformanceMeasure() {
  const mark = useCallback((name: string) => {
    performanceMonitor.mark(name);
  }, []);

  const measure = useCallback(
    (markName: string, metricName?: string): number => {
      return performanceMonitor.measure(markName, metricName);
    },
    []
  );

  return { mark, measure };
}

/**
 * Monitor rage clicks on specific elements
 */
export function useRageClickMonitoring() {
  const getRagePatterns = useCallback(() => {
    return rageClickDetector.getRagePatterns();
  }, []);

  const getHighConfidenceRage = useCallback(() => {
    return rageClickDetector.getHighConfidenceRageEvents();
  }, []);

  const getStats = useCallback(() => {
    return rageClickDetector.getStatistics();
  }, []);

  return {
    getRagePatterns,
    getHighConfidenceRage,
    getStats,
  };
}

/**
 * Enable/disable monitoring on component mount/unmount
 */
export function useMonitoringControl(enabled = true): void {
  useEffect(() => {
    performanceMonitor.setEnabled(enabled);
    analyticsService.setEnabled(enabled);
    rageClickDetector.setEnabled(enabled);

    return () => {
      // Don't disable on unmount - monitoring should continue
    };
  }, [enabled]);
}

/**
 * Track component lifecycle
 */
export function useComponentLifecycle(componentName: string): void {
  useEffect(() => {
    analyticsService.trackEvent(`${componentName}_mounted`, 'lifecycle');

    return () => {
      analyticsService.trackEvent(`${componentName}_unmounted`, 'lifecycle');
    };
  }, [componentName]);
}

/**
 * Track async operation with automatic error handling
 */
export function useAsyncTracking(operationName: string) {
  const execute = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      metadata?: Record<string, any>
    ): Promise<T> => {
      return performanceMonitor.measureAction(
        operationName,
        asyncFn,
        metadata
      );
    },
    [operationName]
  );

  return { execute };
}

/**
 * Get current analytics session
 */
export function useAnalyticsSession() {
  const getSession = useCallback(() => {
    return analyticsService.getSessionSummary();
  }, []);

  const getEvents = useCallback(() => {
    return analyticsService.getEvents();
  }, []);

  return {
    getSession,
    getEvents,
  };
}

/**
 * Track network connectivity changes
 */
export function useNetworkMonitoring() {
  useEffect(() => {
    const handleOnline = () => {
      analyticsService.trackNetworkChange(true);
      performanceMonitor.recordMetric('network.online', 0, 'ms');
    };

    const handleOffline = () => {
      analyticsService.trackNetworkChange(false);
      performanceMonitor.recordMetric('network.offline', 0, 'ms');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}

/**
 * Combined monitoring hook - use this for most use cases
 */
export function useMonitoring(componentName: string) {
  useRenderMetrics(componentName);
  useComponentLifecycle(componentName);
  useNetworkMonitoring();

  const { track } = useActionTracking(componentName);
  const { trackEvent, trackTiming } = useEventTracking();
  const { mark, measure } = usePerformanceMeasure();
  const rageMonitoring = useRageClickMonitoring();
  const { getSession } = useAnalyticsSession();

  return {
    track,
    trackEvent,
    trackTiming,
    mark,
    measure,
    rageMonitoring,
    getSession,
  };
}
