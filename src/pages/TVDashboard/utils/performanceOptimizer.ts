// Performance Optimization Utilities for TV Dashboard

/**
 * Debounce function to limit the rate of function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to limit function calls to once per specified interval
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

/**
 * Intersection Observer for lazy loading and visibility detection
 */
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
};

/**
 * Memory-conscious data structure for managing large datasets
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private size: number;
  private index: number;
  private count: number;

  constructor(size: number) {
    this.buffer = new Array(size);
    this.size = size;
    this.index = 0;
    this.count = 0;
  }

  push(item: T): void {
    this.buffer[this.index] = item;
    this.index = (this.index + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
  }

  getAll(): T[] {
    if (this.count < this.size) {
      return this.buffer.slice(0, this.count);
    }
    return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
  }

  clear(): void {
    this.index = 0;
    this.count = 0;
  }
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 100;

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.addMetric(name, duration);
    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.addMetric(name, duration);
    return result;
  }

  private addMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const samples = this.metrics.get(name)!;
    samples.push(duration);

    // Keep only the last N samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getMetrics(name: string): { avg: number; min: number; max: number; samples: number } | null {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) {
      return null;
    }

    const sum = samples.reduce((a, b) => a + b, 0);
    return {
      avg: sum / samples.length,
      min: Math.min(...samples),
      max: Math.max(...samples),
      samples: samples.length
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; samples: number }> {
    const result: Record<string, { avg: number; min: number; max: number; samples: number }> = {};

    for (const [name, samples] of this.metrics) {
      if (samples.length > 0) {
        const sum = samples.reduce((a, b) => a + b, 0);
        result[name] = {
          avg: sum / samples.length,
          min: Math.min(...samples),
          max: Math.max(...samples),
          samples: samples.length
        };
      }
    }

    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private samples: CircularBuffer<{ timestamp: number; usage: number }>;

  constructor(maxSamples = 50) {
    this.samples = new CircularBuffer(maxSamples);
  }

  sample(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.samples.push({
        timestamp: Date.now(),
        usage: memory.usedJSHeapSize / memory.totalJSHeapSize
      });
    }
  }

  getUsageHistory(): { timestamp: number; usage: number }[] {
    return this.samples.getAll();
  }

  getCurrentUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    return 0;
  }

  isMemoryPressure(): boolean {
    const currentUsage = this.getCurrentUsage();
    return currentUsage > 0.8; // 80% threshold
  }
}

/**
 * Request Animation Frame scheduler for smooth animations
 */
export class AnimationScheduler {
  private callbacks: Map<string, () => void> = new Map();
  private isScheduled = false;

  schedule(id: string, callback: () => void): void {
    this.callbacks.set(id, callback);

    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  cancel(id: string): void {
    this.callbacks.delete(id);
  }

  private flush(): void {
    for (const callback of this.callbacks.values()) {
      try {
        callback();
      } catch (error) {
        console.error('Animation callback error:', error);
      }
    }

    this.callbacks.clear();
    this.isScheduled = false;
  }
}

/**
 * Adaptive polling rate based on visibility and performance
 */
export class AdaptivePoller {
  private intervalId: NodeJS.Timeout | null = null;
  private baseInterval: number;
  private currentInterval: number;
  private callback: () => Promise<void> | void;
  private performanceMonitor: PerformanceMonitor;
  private isVisible = true;

  constructor(callback: () => Promise<void> | void, baseInterval = 30000) {
    this.callback = callback;
    this.baseInterval = baseInterval;
    this.currentInterval = baseInterval;
    this.performanceMonitor = new PerformanceMonitor();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      this.adjustPollingRate();
    });
  }

  start(): void {
    this.scheduleNext();
  }

  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  private async scheduleNext(): Promise<void> {
    try {
      await this.performanceMonitor.measureAsync('poll', async () => {
        const result = this.callback();
        if (result instanceof Promise) {
          await result;
        }
      });
      this.adjustPollingRate();
    } catch (error) {
      console.error('Polling error:', error);
    }

    if (this.intervalId !== null) {
      this.intervalId = setTimeout(() => this.scheduleNext(), this.currentInterval);
    }
  }

  private adjustPollingRate(): void {
    const pollMetrics = this.performanceMonitor.getMetrics('poll');

    if (!this.isVisible) {
      // Slower polling when not visible
      this.currentInterval = this.baseInterval * 4;
    } else if (pollMetrics && pollMetrics.avg > 5000) {
      // Slower polling if requests are taking too long
      this.currentInterval = Math.min(this.baseInterval * 2, 60000);
    } else if (pollMetrics && pollMetrics.avg < 1000) {
      // Faster polling if requests are quick
      this.currentInterval = Math.max(this.baseInterval * 0.8, 15000);
    } else {
      this.currentInterval = this.baseInterval;
    }
  }
}

/**
 * Image preloader for smooth transitions
 */
export const preloadImages = (imageUrls: string[]): Promise<void[]> => {
  return Promise.all(
    imageUrls.map(url =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      })
    )
  );
};

/**
 * Check if device supports hardware acceleration
 */
export const supportsHardwareAcceleration = (): boolean => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return !!gl;
};

/**
 * Device capability detection
 */
export const getDeviceCapabilities = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    cores: navigator.hardwareConcurrency || 4,
    memory: (navigator as any).deviceMemory || 4,
    connection: connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt
    } : null,
    supportsWebGL: supportsHardwareAcceleration(),
    touchSupport: 'ontouchstart' in window,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
};

// Global instances for easy access
export const globalPerformanceMonitor = new PerformanceMonitor();
export const globalMemoryTracker = new MemoryTracker();
export const globalAnimationScheduler = new AnimationScheduler();

// Auto-start memory sampling
setInterval(() => {
  globalMemoryTracker.sample();
}, 10000); // Sample every 10 seconds