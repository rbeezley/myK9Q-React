/**
 * Analytics Service
 *
 * Tracks user behavior and events including:
 * - Navigation patterns
 * - Feature usage
 * - Action completion rates
 * - Error frequencies
 * - Session duration
 * - Device and network characteristics
 */

export interface AnalyticsEvent {
  name: string;
  category: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: AnalyticsEvent[];
  deviceInfo: DeviceInfo;
  navigationPath: string[];
  errorCount: number;
  offlineTime: number;
  syncConflicts: number;
}

export interface DeviceInfo {
  userAgent: string;
  deviceType: 'phone' | 'tablet' | 'desktop' | 'unknown';
  osType: string;
  osVersion: string;
  browserType: string;
  browserVersion: string;
  screenSize: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  networkType?: string;
}

export interface FeatureUsageStats {
  feature: string;
  usageCount: number;
  totalDuration: number; // in seconds
  averageDuration: number;
  lastUsed: number;
  errorRate: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private navigationPath: string[] = [];
  private sessionStart: number;
  private lastActivityTime: number;
  private enabled: boolean = true;
  private featureTimings: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();

  // Configuration
  private readonly MAX_EVENTS = 500;
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL = 30000; // 30 seconds

  private constructor() {
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStart = Date.now();
    this.lastActivityTime = Date.now();
    this.navigationPath.push(window.location.pathname);
    this.initializeListeners();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize event listeners
   */
  private initializeListeners(): void {
    // Track navigation
    window.addEventListener('popstate', () => this.trackNavigation());
    window.addEventListener('hashchange', () => this.trackNavigation());

    // Track visibility changes (for session end detection)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session_paused', 'session', undefined, {
          duration: Date.now() - this.sessionStart,
        });
      } else {
        this.trackEvent('session_resumed', 'session');
      }
    });

    // Track user activity
    document.addEventListener('mousedown', () => this.updateLastActivity());
    document.addEventListener('touchstart', () => this.updateLastActivity());
    document.addEventListener('keydown', () => this.updateLastActivity());

    // Track errors
    window.addEventListener('error', (e) => this.trackError(e));

    // Periodic batch send
    setInterval(() => this.batchSendEvents(), this.BATCH_INTERVAL);

    // Send on page unload
    window.addEventListener('beforeunload', () => this.sendPendingEvents());
  }

  /**
   * Track a generic event
   */
  trackEvent(
    name: string,
    category: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name,
      category,
      value,
      metadata,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep buffer manageable
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    this.updateLastActivity();
  }

  /**
   * Track feature usage with duration
   */
  startFeatureUsage(featureName: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      const timings = this.featureTimings.get(featureName) || [];
      timings.push(duration);
      this.featureTimings.set(featureName, timings);

      this.trackEvent(`${featureName}_used`, 'feature', duration, {
        feature: featureName,
      });
    };
  }

  /**
   * Track action with success/failure
   */
  trackAction(
    actionName: string,
    success: boolean,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    const status = success ? 'success' : 'error';
    this.trackEvent(`action_${actionName}`, 'action', duration || 0, {
      status,
      success,
      ...metadata,
    });

    if (!success) {
      const errorCount = this.errorCounts.get(actionName) || 0;
      this.errorCounts.set(actionName, errorCount + 1);
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, metadata?: Record<string, any>): void {
    this.trackEvent('page_view', 'navigation', undefined, {
      page: pageName,
      timestamp: Date.now(),
      ...metadata,
    });

    this.navigationPath.push(pageName);

    // Keep path manageable
    if (this.navigationPath.length > 50) {
      this.navigationPath.shift();
    }
  }

  /**
   * Track error
   */
  private trackError(event: ErrorEvent): void {
    this.trackEvent('error', 'error', undefined, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });

    const errorKey = `${event.filename}:${event.lineno}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
  }

  /**
   * Track custom timing
   */
  trackTiming(name: string, duration: number, category?: string): void {
    this.trackEvent(`timing_${name}`, category || 'performance', duration, {
      metric: name,
      duration,
    });
  }

  /**
   * Track offline usage
   */
  trackOfflineEvent(eventName: string, metadata?: Record<string, any>): void {
    this.trackEvent(eventName, 'offline', undefined, {
      ...metadata,
      offline: true,
    });
  }

  /**
   * Track sync conflict
   */
  trackSyncConflict(
    entityType: string,
    resolution: string,
    metadata?: Record<string, any>
  ): void {
    this.trackEvent('sync_conflict', 'data_sync', undefined, {
      entityType,
      resolution,
      ...metadata,
    });
  }

  /**
   * Track network change
   */
  trackNetworkChange(
    online: boolean,
    networkType?: string,
    effectiveType?: string
  ): void {
    this.trackEvent(online ? 'online' : 'offline', 'network', undefined, {
      networkType,
      effectiveType,
      timestamp: Date.now(),
    });
  }

  /**
   * Get feature usage statistics
   */
  getFeatureStats(featureName: string): FeatureUsageStats | null {
    const timings = this.featureTimings.get(featureName) || [];
    if (timings.length === 0) return null;

    const totalDuration = timings.reduce((a, b) => a + b, 0) / 1000; // Convert to seconds
    const errors = this.errorCounts.get(featureName) || 0;

    return {
      feature: featureName,
      usageCount: timings.length,
      totalDuration,
      averageDuration: totalDuration / timings.length,
      lastUsed: Date.now(),
      errorRate: timings.length > 0 ? errors / timings.length : 0,
    };
  }

  /**
   * Get all feature statistics
   */
  getAllFeatureStats(): FeatureUsageStats[] {
    const stats: FeatureUsageStats[] = [];

    this.featureTimings.forEach((timings, featureName) => {
      const stat = this.getFeatureStats(featureName);
      if (stat) {
        stats.push(stat);
      }
    });

    return stats;
  }

  /**
   * Get session summary
   */
  getSessionSummary(): UserSession {
    return {
      sessionId: this.sessionId,
      startTime: this.sessionStart,
      endTime: Date.now(),
      duration: Date.now() - this.sessionStart,
      events: [...this.events],
      deviceInfo: this.getDeviceInfo(),
      navigationPath: [...this.navigationPath],
      errorCount: this.errorCounts.size,
      offlineTime: this.calculateOfflineTime(),
      syncConflicts: this.events.filter((e) => e.name === 'sync_conflict').length,
    };
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const _match = ua.match(
      /([^/]+)\/([^ ]+).*?([\w.]+)$|.*?([A-Za-z]+[A-Za-z0-9_]*)[/ \s]([0-9.]+)/
    );

    return {
      userAgent: ua,
      deviceType: this.getDeviceType(),
      osType: this.getOSType(),
      osVersion: this.getOSVersion(),
      browserType: this.getBrowserType(),
      browserVersion: this.getBrowserVersion(),
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      networkType: (navigator as any).connection?.type,
    };
  }

  /**
   * Navigation tracking
   */
  private trackNavigation(): void {
    this.trackPageView(window.location.pathname);
  }

  /**
   * Update last activity time
   */
  private updateLastActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Calculate offline time
   */
  private calculateOfflineTime(): number {
    const offlineEvents = this.events.filter(
      (e) => e.metadata?.offline === true
    );
    return offlineEvents.length * 60; // Rough estimate (1 minute per event)
  }

  /**
   * Batch send events
   */
  private async batchSendEvents(): Promise<void> {
    if (this.events.length >= this.BATCH_SIZE) {
      await this.sendEvents(this.events.splice(0, this.BATCH_SIZE));
    }
  }

  /**
   * Send pending events on page unload
   */
  private async sendPendingEvents(): Promise<void> {
    if (this.events.length > 0) {
      await this.sendEvents(this.events);
    }
  }

  /**
   * Send events to analytics backend
   */
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      // This would send to your analytics backend
      // For now, log to console in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.debug('📊 Analytics batch:', events);
      }
    } catch (error) {
      console.error('Failed to send analytics events:', error);
    }
  }

  /**
   * Get all collected events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events filtered by category
   */
  getEventsByCategory(category: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.category === category);
  }

  /**
   * Get events filtered by name
   */
  getEventsByName(name: string): AnalyticsEvent[] {
    return this.events.filter((e) => e.name === name);
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
    this.featureTimings.clear();
    this.errorCounts.clear();
  }

  // Helper methods

  private getDeviceType(): 'phone' | 'tablet' | 'desktop' | 'unknown' {
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|android(?!.*mobile)/.test(ua)) return 'tablet';
    if (/iphone|android|blackberry|opera mini|windows phone/.test(ua))
      return 'phone';
    return 'desktop';
  }

  private getOSType(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('like Mac') > -1) return 'iOS';
    return 'Unknown';
  }

  private getOSVersion(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Windows') > -1) {
      const _match = ua.match(/Windows NT ([\d.]+)/);
      return _match ? _match[1] : 'Unknown';
    }
    return 'Unknown';
  }

  private getBrowserType(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1) return 'Opera';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const ua = navigator.userAgent;
    const chromeMatch = ua.match(/Chrome\/([\d.]+)/);
    const versionMatch = ua.match(/Version\/([\d.]+)/);
    const firefoxMatch = ua.match(/Firefox\/([\d.]+)/);
    return chromeMatch?.[1] || versionMatch?.[1] || firefoxMatch?.[1] || 'Unknown';
  }
}

export const analyticsService = AnalyticsService.getInstance();
