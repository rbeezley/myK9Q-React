 
/**
 * Developer Mode Service
 *
 * Provides debugging and monitoring capabilities for development.
 * All features are gated by developer mode setting and can be excluded from production builds.
 * Note: Console logging is intentional for developer debugging
 */

import { useSettingsStore } from '@/stores/settingsStore';
import { logger } from '@/utils/logger';

export interface DevToolsConfig {
  enabled: boolean;
  showFPS: boolean;
  showMemory: boolean;
  showNetwork: boolean;
  showStateInspector: boolean;
  showPerformanceProfiler: boolean;
  logStateChanges: boolean;
  logNetworkRequests: boolean;
  logPerformanceMarks: boolean;
}

/** Network request record for dev tools */
interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
}

/** State change record for dev tools */
interface StateChange {
  store: string;
  action: string;
  timestamp: number;
  data: unknown;
}

/** Dev tools exposed on window object */
interface DevToolsExport {
  getPerformanceMarks: () => [string, number][];
  getNetworkRequests: () => NetworkRequest[];
  getStateChanges: () => StateChange[];
  clearNetworkRequests: () => never[];
  clearStateChanges: () => never[];
  clearPerformanceMarks: () => void;
  exportData: () => {
    performanceMarks: [string, number][];
    networkRequests: NetworkRequest[];
    stateChanges: StateChange[];
  };
}

/** Window with dev tools attached */
interface DevToolsWindow extends Window {
  __DEV_TOOLS__?: DevToolsExport;
}

class DeveloperModeService {
  private initialized = false;
  private performanceMarks: Map<string, number> = new Map();
  private networkRequests: NetworkRequest[] = [];
  private stateChanges: StateChange[] = [];

  /**
   * Check if developer mode is enabled
   */
  public isEnabled(): boolean {
    if (import.meta.env.PROD) {
      return false; // Always disabled in production
    }
    const { settings } = useSettingsStore.getState();
    return settings.developerMode || false;
  }

  /**
   * Get current developer tools configuration
   */
  public getConfig(): DevToolsConfig {
    const { settings } = useSettingsStore.getState();
    return {
      enabled: this.isEnabled(),
      showFPS: settings.devShowFPS || false,
      showMemory: settings.devShowMemory || false,
      showNetwork: settings.devShowNetwork || false,
      showStateInspector: settings.devShowStateInspector || false,
      showPerformanceProfiler: settings.devShowPerformanceProfiler || false,
      logStateChanges: settings.devLogStateChanges || false,
      logNetworkRequests: settings.devLogNetworkRequests || false,
      logPerformanceMarks: settings.devLogPerformanceMarks || false,
    };
  }

  /**
   * Initialize developer tools
   */
  public initialize(): void {
    if (!this.isEnabled() || this.initialized) {
      return;
    }

logger.log('📊 Available Tools:', this.getConfig());

    this.initialized = true;

    // Expose developer tools to window for console access
    if (typeof window !== 'undefined') {
      const devWindow = window as DevToolsWindow;
      devWindow.__DEV_TOOLS__ = {
        getPerformanceMarks: () => Array.from(this.performanceMarks.entries()),
        getNetworkRequests: () => this.networkRequests,
        getStateChanges: () => this.stateChanges,
        clearNetworkRequests: () => this.networkRequests = [],
        clearStateChanges: () => this.stateChanges = [],
        clearPerformanceMarks: () => this.performanceMarks.clear(),
        exportData: () => ({
          performanceMarks: Array.from(this.performanceMarks.entries()),
          networkRequests: this.networkRequests,
          stateChanges: this.stateChanges,
        }),
      };
    }
  }

  /**
   * Mark performance timing
   */
  public mark(label: string): void {
    if (!this.isEnabled()) return;

    const timestamp = performance.now();
    this.performanceMarks.set(label, timestamp);
  }

  /**
   * Measure time between two marks
   */
  public measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.isEnabled()) return null;

    const start = this.performanceMarks.get(startMark);
    const end = endMark ? this.performanceMarks.get(endMark) : performance.now();

    if (start === undefined || end === undefined) {
      logger.warn(`⚠️ Performance: Missing mark(s) - ${startMark} or ${endMark}`);
      return null;
    }

    const duration = end - start;

    return duration;
  }

  /**
   * Log network request
   */
  public logNetworkRequest(
    url: string,
    method: string,
    status: number,
    duration: number
  ): void {
    if (!this.isEnabled()) return;

    const config = this.getConfig();
    const request = {
      url,
      method,
      status,
      duration,
      timestamp: Date.now(),
    };

    this.networkRequests.push(request);

    // Keep only last 100 requests
    if (this.networkRequests.length > 100) {
      this.networkRequests.shift();
    }

    if (config.logNetworkRequests) {
      // Network request logging disabled - statusColor was: status >= 200 && status < 300 ? '✅' : '❌'
    }
  }

  /**
   * Log state change
   */
  public logStateChange(
    store: string,
    action: string,
    data?: unknown
  ): void {
    if (!this.isEnabled()) return;

    const change = {
      store,
      action,
      timestamp: Date.now(),
      data,
    };

    this.stateChanges.push(change);

    // Keep only last 50 state changes
    if (this.stateChanges.length > 50) {
      this.stateChanges.shift();
    }
  }

  /**
   * Get network requests (for inspector UI)
   */
  public getNetworkRequests(): typeof this.networkRequests {
    if (!this.isEnabled()) return [];
    return this.networkRequests;
  }

  /**
   * Get state changes (for inspector UI)
   */
  public getStateChanges(): typeof this.stateChanges {
    if (!this.isEnabled()) return [];
    return this.stateChanges;
  }

  /**
   * Get performance marks (for profiler UI)
   */
  public getPerformanceMarks(): Array<[string, number]> {
    if (!this.isEnabled()) return [];
    return Array.from(this.performanceMarks.entries());
  }

  /**
   * Clear all tracking data
   */
  public clearAll(): void {
    this.networkRequests = [];
    this.stateChanges = [];
    this.performanceMarks.clear();
}

  /**
   * Export all tracking data as JSON
   */
  public exportData(): string {
    if (!this.isEnabled()) return '{}';

    const data = {
      performanceMarks: Array.from(this.performanceMarks.entries()),
      networkRequests: this.networkRequests,
      stateChanges: this.stateChanges,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }
}

// Singleton instance
const developerModeService = new DeveloperModeService();

// Auto-initialize in development
if (import.meta.env.DEV) {
  developerModeService.initialize();
}

export default developerModeService;
