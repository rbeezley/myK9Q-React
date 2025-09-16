/**
 * Smart Information Rotation Scheduler for TV Dashboard
 * Manages priority-based content rotation with intelligent scheduling
 */

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
  };
  lastShown?: Date;
  showCount?: number;
}

export interface RotationState {
  currentItem: RotationItem | null;
  queue: RotationItem[];
  history: RotationItem[];
  isActive: boolean;
  startTime: Date;
}

class RotationScheduler {
  private state: RotationState;
  private rotationTimer: NodeJS.Timeout | null = null;
  private callbacks: Set<(state: RotationState) => void> = new Set();

  constructor() {
    this.state = {
      currentItem: null,
      queue: [],
      history: [],
      isActive: false,
      startTime: new Date()
    };
  }

  /**
   * Initialize the rotation scheduler with content items
   */
  initialize(items: Omit<RotationItem, 'lastShown' | 'showCount'>[]): void {
    this.state.queue = items.map(item => ({
      ...item,
      lastShown: undefined,
      showCount: 0
    }));
    
    this.state.startTime = new Date();
    this.updateQueue();
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
   * Force rotation to next item
   */
  rotateToNext(): void {
    const nextItem = this.getNextItem();
    
    if (nextItem) {
      // Update history
      if (this.state.currentItem) {
        this.state.history.unshift(this.state.currentItem);
        // Keep only last 10 items in history
        this.state.history = this.state.history.slice(0, 10);
      }

      // Set new current item
      this.state.currentItem = nextItem;
      nextItem.lastShown = new Date();
      nextItem.showCount = (nextItem.showCount || 0) + 1;

      // Schedule next rotation
      if (this.state.isActive) {
        this.scheduleNext(nextItem.duration * 1000);
      }

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
}

// Singleton instance
export const rotationScheduler = new RotationScheduler();

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