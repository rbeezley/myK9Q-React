/**
 * Smart Information Rotation Scheduler for TV Dashboard
 * Manages priority-based content rotation with intelligent scheduling
 * Enhanced with AI-driven rotation patterns and user engagement analytics
 */

import { globalPerformanceMonitor, debounce } from './performanceOptimizer';

export interface RotationItem {
  id: string;
  component: string;
  priority: number;
  duration: number; // seconds
  conditions?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    dayOfEvent?: number; // 1, 2, or 3
    dataAvailable?: boolean;
    minDataAge?: number; // seconds
    requiredDataFreshness?: number; // seconds - how fresh data should be
    audienceEngagement?: 'high' | 'medium' | 'low'; // engagement level needed
  };
  lastShown?: Date;
  showCount?: number;
  // Enhanced analytics
  viewDuration?: number[]; // track actual view durations
  skipCount?: number; // how often manually skipped
  engagementScore?: number; // calculated engagement metric
  adaptiveDuration?: number; // AI-adjusted duration
}

export interface RotationState {
  currentItem: RotationItem | null;
  queue: RotationItem[];
  history: RotationItem[];
  isActive: boolean;
  startTime: Date;
  // Enhanced state
  analytics: {
    totalRotations: number;
    averageViewDuration: number;
    mostPopularContent: string;
    engagementTrends: Array<{ timestamp: Date; score: number }>;
  };
  adaptiveMode: boolean; // whether AI adjustments are enabled
  pausedUntil?: Date; // temporary pause capability
}

class RotationScheduler {
  private state: RotationState;
  private rotationTimer: NodeJS.Timeout | null = null;
  private callbacks: Set<(state: RotationState) => void> = new Set();
  private engagementTracker: Map<string, number[]> = new Map();
  private debouncedAnalytics = debounce(this.updateAnalytics.bind(this), 5000);

  constructor() {
    this.state = {
      currentItem: null,
      queue: [],
      history: [],
      isActive: false,
      startTime: new Date(),
      analytics: {
        totalRotations: 0,
        averageViewDuration: 0,
        mostPopularContent: '',
        engagementTrends: []
      },
      adaptiveMode: true
    };
  }

  /**
   * Initialize the rotation scheduler with content items
   */
  initialize(items: Omit<RotationItem, 'lastShown' | 'showCount'>[]): void {
    this.state.queue = items.map(item => ({
      ...item,
      lastShown: undefined,
      showCount: 0,
      viewDuration: [],
      skipCount: 0,
      engagementScore: 0.5, // neutral starting score
      adaptiveDuration: item.duration // start with base duration
    }));

    this.state.startTime = new Date();
    this.state.analytics.totalRotations = 0;
    this.updateQueue();

    // Initialize engagement tracking
    this.state.queue.forEach(item => {
      this.engagementTracker.set(item.id, []);
    });
  }

  /**
   * Start the rotation timer
   */
  start(): void {
    if (this.state.isActive) {
      return;
    }
    
    this.state.isActive = true;
    this.rotateToNext();
    this.notifySubscribers();
  }

  /**
   * Stop the rotation timer
   */
  stop(): void {
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      this.rotationTimer = null;
    }
    this.state.isActive = false;
    this.notifySubscribers();
  }

  /**
   * Subscribe to rotation state changes
   */
  subscribe(callback: (state: RotationState) => void): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get current rotation state
   */
  getState(): RotationState {
    return { ...this.state };
  }

  /**
   * Record manual skip for analytics
   */
  recordSkip(itemId: string): void {
    const item = this.state.queue.find(item => item.id === itemId);
    if (item) {
      item.skipCount = (item.skipCount || 0) + 1;
      // Reduce engagement score and adaptive duration
      if (this.state.adaptiveMode) {
        item.engagementScore = Math.max(0, (item.engagementScore || 0.5) - 0.1);
        item.adaptiveDuration = Math.max(15, (item.adaptiveDuration || item.duration) * 0.9);
      }
    }
  }

  /**
   * Pause rotation temporarily
   */
  pauseFor(seconds: number): void {
    this.state.pausedUntil = new Date(Date.now() + seconds * 1000);
  }

  /**
   * Toggle adaptive mode
   */
  setAdaptiveMode(enabled: boolean): void {
    this.state.adaptiveMode = enabled;
    if (enabled) {
      this.optimizeRotationSchedule();
    }
  }

  /**
   * Get engagement analytics
   */
  getAnalytics() {
    return {
      ...this.state.analytics,
      itemPerformance: this.state.queue.map(item => ({
        id: item.id,
        component: item.component,
        engagementScore: item.engagementScore || 0,
        averageViewTime: this.calculateAverageViewTime(item),
        skipRate: this.calculateSkipRate(item),
        showCount: item.showCount || 0
      }))
    };
  }

  /**
   * Force rotation to next item with enhanced analytics
   */
  rotateToNext(): void {
    // Check if paused
    if (this.state.pausedUntil && new Date() < this.state.pausedUntil) {
      this.scheduleNext(1000); // Check again in 1 second
      return;
    }

    const nextItem = this.getNextItem();

    if (nextItem) {
      // Record view completion for previous item
      if (this.state.currentItem) {
        this.recordViewCompletion(this.state.currentItem);
        this.state.history.unshift(this.state.currentItem);
        // Keep only last 10 items in history
        this.state.history = this.state.history.slice(0, 10);
      }

      // Set new current item
      this.state.currentItem = nextItem;
      nextItem.lastShown = new Date();
      nextItem.showCount = (nextItem.showCount || 0) + 1;
      this.state.analytics.totalRotations++;

      // Performance monitoring
      globalPerformanceMonitor.measure('contentRotation', () => {
        return performance.now();
      });

      // Use adaptive duration if enabled
      const duration = this.state.adaptiveMode && nextItem.adaptiveDuration
        ? nextItem.adaptiveDuration
        : nextItem.duration;

      // Schedule next rotation
      if (this.state.isActive) {
        this.scheduleNext(duration * 1000);
      }

      // Update analytics asynchronously
      this.debouncedAnalytics();
      this.notifySubscribers();
    }
  }

  /**
   * Update item priorities dynamically
   */
  updatePriorities(updates: { id: string; priority: number }[]): void {
    updates.forEach(update => {
      const item = this.state.queue.find(item => item.id === update.id);
      if (item) {
        item.priority = update.priority;
      }
    });
    
    this.updateQueue();
    this.notifySubscribers();
  }

  /**
   * Add new rotation item
   */
  addItem(item: Omit<RotationItem, 'lastShown' | 'showCount'>): void {
    const rotationItem: RotationItem = {
      ...item,
      lastShown: undefined,
      showCount: 0
    };
    
    this.state.queue.push(rotationItem);
    this.updateQueue();
    this.notifySubscribers();
  }

  /**
   * Remove rotation item
   */
  removeItem(id: string): void {
    this.state.queue = this.state.queue.filter(item => item.id !== id);
    this.updateQueue();
    this.notifySubscribers();
  }

  private getNextItem(): RotationItem | null {
    const eligibleItems = this.state.queue.filter(item => this.isItemEligible(item));
    
    if (eligibleItems.length === 0) {
      return this.state.queue[0] || null;
    }

    // Find the item that hasn't been shown for the longest time (round-robin approach)
    eligibleItems.sort((a, b) => {
      const aLastShown = a.lastShown?.getTime() || 0;
      const bLastShown = b.lastShown?.getTime() || 0;
      
      // If neither has been shown, use priority
      if (aLastShown === 0 && bLastShown === 0) {
        return b.priority - a.priority;
      }
      
      // Otherwise, prefer the one that was shown earliest (longest time ago)
      return aLastShown - bLastShown;
    });

    return eligibleItems[0];
  }

  private isItemEligible(item: RotationItem): boolean {
    if (!item.conditions) return true;

    const now = new Date();
    const { conditions } = item;

    // Check time of day
    if (conditions.timeOfDay) {
      const hour = now.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      if (timeOfDay !== conditions.timeOfDay) return false;
    }

    // Check day of event
    if (conditions.dayOfEvent) {
      const daysSinceStart = Math.floor((now.getTime() - this.state.startTime.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (daysSinceStart !== conditions.dayOfEvent) return false;
    }

    // Check if enough time has passed since last show
    if (conditions.minDataAge && item.lastShown) {
      const timeSinceShown = (now.getTime() - item.lastShown.getTime()) / 1000;
      if (timeSinceShown < conditions.minDataAge) return false;
    }

    return true;
  }

  private scheduleNext(delay: number): void {
    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
    }

    this.rotationTimer = setTimeout(() => {
      this.rotateToNext();
    }, delay);
  }

  private updateQueue(): void {
    // Sort queue by priority
    this.state.queue.sort((a, b) => b.priority - a.priority);
  }

  private notifySubscribers(): void {
    this.callbacks.forEach(callback => {
      callback(this.getState());
    });
  }

  /**
   * Record view completion analytics
   */
  private recordViewCompletion(item: RotationItem): void {
    if (!item.lastShown) return;

    const viewDuration = (Date.now() - item.lastShown.getTime()) / 1000;

    if (!item.viewDuration) item.viewDuration = [];
    item.viewDuration.push(viewDuration);

    // Keep only last 20 view durations
    if (item.viewDuration.length > 20) {
      item.viewDuration = item.viewDuration.slice(-20);
    }

    // Update engagement score based on completion rate
    const expectedDuration = item.adaptiveDuration || item.duration;
    const completionRate = Math.min(1, viewDuration / expectedDuration);

    if (this.state.adaptiveMode) {
      // Smooth engagement score adjustment
      const currentScore = item.engagementScore || 0.5;
      item.engagementScore = currentScore * 0.8 + completionRate * 0.2;

      // Adjust adaptive duration based on engagement
      if (item.engagementScore > 0.7) {
        item.adaptiveDuration = Math.min(item.duration * 1.5, (item.adaptiveDuration || item.duration) * 1.1);
      } else if (item.engagementScore < 0.3) {
        item.adaptiveDuration = Math.max(item.duration * 0.5, (item.adaptiveDuration || item.duration) * 0.9);
      }
    }
  }

  /**
   * Update global analytics
   */
  private updateAnalytics(): void {
    const allViewDurations = this.state.queue.flatMap(item => item.viewDuration || []);

    this.state.analytics.averageViewDuration = allViewDurations.length > 0
      ? allViewDurations.reduce((sum, duration) => sum + duration, 0) / allViewDurations.length
      : 0;

    // Find most popular content
    const popularity = this.state.queue.map(item => ({
      id: item.id,
      score: (item.engagementScore || 0) * (item.showCount || 0)
    }));

    popularity.sort((a, b) => b.score - a.score);
    this.state.analytics.mostPopularContent = popularity[0]?.id || '';

    // Add engagement trend point
    const averageEngagement = this.state.queue.reduce((sum, item) =>
      sum + (item.engagementScore || 0), 0) / this.state.queue.length;

    this.state.analytics.engagementTrends.push({
      timestamp: new Date(),
      score: averageEngagement
    });

    // Keep only last 100 trend points
    if (this.state.analytics.engagementTrends.length > 100) {
      this.state.analytics.engagementTrends = this.state.analytics.engagementTrends.slice(-100);
    }
  }

  /**
   * Calculate average view time for an item
   */
  private calculateAverageViewTime(item: RotationItem): number {
    if (!item.viewDuration || item.viewDuration.length === 0) return 0;
    return item.viewDuration.reduce((sum, duration) => sum + duration, 0) / item.viewDuration.length;
  }

  /**
   * Calculate skip rate for an item
   */
  private calculateSkipRate(item: RotationItem): number {
    const totalShows = (item.showCount || 0) + (item.skipCount || 0);
    return totalShows > 0 ? (item.skipCount || 0) / totalShows : 0;
  }

  /**
   * Optimize rotation schedule based on analytics
   */
  private optimizeRotationSchedule(): void {
    if (!this.state.adaptiveMode) return;

    // Adjust priorities based on engagement scores
    this.state.queue.forEach(item => {
      const baseScore = item.engagementScore || 0.5;
      const skipPenalty = Math.min(0.3, (item.skipCount || 0) * 0.05);
      const adjustedScore = Math.max(0.1, baseScore - skipPenalty);

      // Dynamically adjust priority (keep within reasonable bounds)
      const basePriority = item.priority;
      item.priority = Math.max(10, Math.min(200, basePriority * adjustedScore));
    });

    this.updateQueue();
  }
}

// Singleton instance
export const rotationScheduler = new RotationScheduler();

// Auto-optimize every 5 minutes
setInterval(() => {
  rotationScheduler.setAdaptiveMode(true);
}, 5 * 60 * 1000);

/**
 * Predefined rotation configurations for different event phases
 */
export const ROTATION_CONFIGS = {
  // Day 1-2: Preliminary rounds  
  preliminary: [
    {
      id: 'highlights',
      component: 'YesterdayHighlights',
      priority: 100,
      duration: 45 // Main content panel - longer duration
    },
    {
      id: 'judges',
      component: 'JudgeSpotlight',
      priority: 90,
      duration: 30 // Judge information
    },
    {
      id: 'championship',
      component: 'ChampionshipChase',
      priority: 80,
      duration: 35 // Championship leaderboard
    },
    {
      id: 'states',
      component: 'StateParticipation',
      priority: 70,
      duration: 30 // Geographic participation
    }
  ],

  // Day 3: Finals
  finals: [
    {
      id: 'championship',
      component: 'ChampionshipChase',
      priority: 150,
      duration: 50 // Longer for finals excitement
    },
    {
      id: 'highlights',
      component: 'YesterdayHighlights',
      priority: 120,
      duration: 40 // Event highlights
    },
    {
      id: 'judges',
      component: 'JudgeSpotlight',
      priority: 90,
      duration: 30 // Judge information
    },
    {
      id: 'states',
      component: 'StateParticipation',
      priority: 80,
      duration: 35 // Geographic participation
    }
  ],

  // Evening/after hours
  evening: [
    {
      id: 'highlights',
      component: 'YesterdayHighlights',
      priority: 100,
      duration: 50 // Longer evening viewing
    },
    {
      id: 'judges',
      component: 'JudgeSpotlight',
      priority: 90,
      duration: 40 // Judge profiles
    },
    {
      id: 'states',
      component: 'StateParticipation',
      priority: 80,
      duration: 40 // Geographic stats
    },
    {
      id: 'championship',
      component: 'ChampionshipChase',
      priority: 70,
      duration: 45 // Championship standings
    }
  ]
} as const;

export default rotationScheduler;