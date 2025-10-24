/**
 * Rage Click Detector Service
 *
 * Detects and reports user frustration indicators including:
 * - Rapid repeated clicks on same element
 * - Multiple rapid clicks without success
 * - Double/triple tap patterns
 * - Rapid keyboard interactions
 * - Failed attempt patterns
 */

export interface RageClickEvent {
  type: 'click' | 'tap' | 'keyboard' | 'scroll';
  element?: string;
  timestamp: number;
  x?: number;
  y?: number;
  count: number;
  duration: number;
}

export interface RagePattern {
  type: 'rapid_clicks' | 'rapid_taps' | 'keyboard_mashing' | 'scroll_thrashing';
  count: number;
  duration: number;
  timestamp: number;
  confidence: number; // 0-1, higher = more confident it's rage
  metadata?: Record<string, any>;
}

export class RageClickDetector {
  private static instance: RageClickDetector;
  private clickBuffer: RageClickEvent[] = [];
  private ragePatterns: RagePattern[] = [];
  private elementClickCounts: Map<string, number> = new Map();
  private lastClickTime: number = 0;
  private lastClickElement: string | null = null;
  private enabled: boolean = true;
  private pageLoadTime: number = Date.now();
  private readonly PAGE_LOAD_GRACE_PERIOD = 2000; // ms to ignore events after page load

  // Configuration thresholds
  private readonly RAPID_CLICK_THRESHOLD = 300; // ms between clicks to be considered "rapid"
  private readonly MIN_RAPID_CLICKS = 3; // minimum clicks to constitute rage
  private readonly ELEMENT_CLICK_TIMEOUT = 5000; // ms to reset element click count
  private readonly RAPID_SCROLL_THRESHOLD = 100; // ms between scroll events
  private readonly MIN_RAPID_SCROLLS = 5; // minimum scrolls to constitute thrashing

  private scrollBuffer: number[] = [];
  private keyPressBuffer: number[] = [];

  private constructor() {
    this.initializeListeners();
  }

  static getInstance(): RageClickDetector {
    if (!RageClickDetector.instance) {
      RageClickDetector.instance = new RageClickDetector();
    }
    return RageClickDetector.instance;
  }

  /**
   * Initialize event listeners
   */
  private initializeListeners(): void {
    // Click detection
    document.addEventListener('click', (e) => this.handleClick(e), true);
    document.addEventListener('dblclick', (e) => this.handleDoubleClick(e), true);

    // Touch detection (mobile)
    document.addEventListener('touchend', (e) => this.handleTouch(e), true);

    // Keyboard detection
    document.addEventListener('keydown', (e) => this.handleKeyDown(e), true);

    // Scroll detection
    window.addEventListener('scroll', () => this.handleScroll(), true);

    // Network error detection (indirectly causes rage)
    window.addEventListener('error', (e) => this.handleError(e), true);
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    if (!this.enabled) return;

    const now = performance.now();
    const target = event.target as HTMLElement;
    const elementId = this.getElementIdentifier(target);

    // Track click
    const clickEvent: RageClickEvent = {
      type: 'click',
      element: elementId,
      timestamp: now,
      x: event.clientX,
      y: event.clientY,
      count: 1,
      duration: now - this.lastClickTime,
    };

    this.clickBuffer.push(clickEvent);

    // Update element click count
    const currentCount = this.elementClickCounts.get(elementId) || 0;
    this.elementClickCounts.set(elementId, currentCount + 1);

    // Check for rapid clicks on same element
    if (
      elementId === this.lastClickElement &&
      now - this.lastClickTime < this.RAPID_CLICK_THRESHOLD
    ) {
      this.checkForRagePattern('rapid_clicks', elementId, now);
    }

    this.lastClickTime = now;
    this.lastClickElement = elementId;

    // Clear element click count after timeout
    setTimeout(() => {
      this.elementClickCounts.delete(elementId);
    }, this.ELEMENT_CLICK_TIMEOUT);

    // Keep buffer size manageable
    if (this.clickBuffer.length > 100) {
      this.clickBuffer.shift();
    }
  }

  /**
   * Handle double-click events
   */
  private handleDoubleClick(event: MouseEvent): void {
    if (!this.enabled) return;

    const target = event.target as HTMLElement;
    const elementId = this.getElementIdentifier(target);

    // Double-click on input, button, etc. might indicate frustration
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'A' ||
      target.classList.contains('clickable')
    ) {
      const confidence = 0.4; // Lower confidence for double-click
      this.recordRagePattern('rapid_clicks', 2, 0, confidence, {
        eventType: 'double_click',
        element: elementId,
      });
    }
  }

  /**
   * Handle touch events (mobile)
   */
  private handleTouch(event: TouchEvent): void {
    if (!this.enabled) return;

    const now = performance.now();
    const touch = event.changedTouches[0];
    const target = event.target as HTMLElement;
    const elementId = this.getElementIdentifier(target);

    // Check for rapid taps (multiple touches in short time)
    const recentTaps = this.clickBuffer.filter(
      (e) => e.type === 'tap' && now - e.timestamp < 1000
    );

    if (recentTaps.length >= this.MIN_RAPID_CLICKS) {
      this.checkForRagePattern('rapid_taps', elementId, now);
    }

    const tapEvent: RageClickEvent = {
      type: 'tap',
      element: elementId,
      timestamp: now,
      x: touch.clientX,
      y: touch.clientY,
      count: event.touches.length,
      duration: 0,
    };

    this.clickBuffer.push(tapEvent);
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(_event: KeyboardEvent): void {
    if (!this.enabled) return;

    const now = performance.now();

    // Track rapid key presses
    this.keyPressBuffer.push(now);

    // Keep only last 1 second of key presses
    this.keyPressBuffer = this.keyPressBuffer.filter(
      (t) => now - t < 1000
    );

    // Check for keyboard mashing (very rapid key presses)
    if (this.keyPressBuffer.length >= 10) {
      // 10+ keypresses per second is likely mashing
      const timespan =
        this.keyPressBuffer[this.keyPressBuffer.length - 1] -
        this.keyPressBuffer[0];
      const confidence = Math.min(
        this.keyPressBuffer.length / 20,
        1
      );

      this.recordRagePattern('keyboard_mashing', this.keyPressBuffer.length, timespan, confidence, {
        keysPerSecond: (this.keyPressBuffer.length / timespan) * 1000,
      });

      this.keyPressBuffer = [];
    }
  }

  /**
   * Handle scroll events
   */
  private handleScroll(): void {
    if (!this.enabled) return;

    // Ignore scroll events during page load grace period (prevents false positives from auto-scroll)
    const timeSincePageLoad = Date.now() - this.pageLoadTime;
    if (timeSincePageLoad < this.PAGE_LOAD_GRACE_PERIOD) {
      return;
    }

    const now = performance.now();
    this.scrollBuffer.push(now);

    // Keep only last 2 seconds of scroll events
    this.scrollBuffer = this.scrollBuffer.filter((t) => now - t < 2000);

    // Check for scroll thrashing (rapid scrolling without progress)
    if (this.scrollBuffer.length >= this.MIN_RAPID_SCROLLS) {
      const timespan = this.scrollBuffer[this.scrollBuffer.length - 1] - this.scrollBuffer[0];
      const frequency = (this.scrollBuffer.length / timespan) * 1000;

      // High frequency scrolling (5+ events per second) might indicate frustration
      if (frequency > 5) {
        const confidence = Math.min(frequency / 10, 1);
        this.recordRagePattern('scroll_thrashing', this.scrollBuffer.length, timespan, confidence);
      }
    }
  }

  /**
   * Handle error events
   */
  private handleError(event: ErrorEvent): void {
    if (!this.enabled) return;

    // Network/API errors can trigger rage patterns
    if (event.message.includes('Failed') || event.message.includes('timeout')) {
      // This is tracked separately via error metrics
    }
  }

  /**
   * Check for rage click patterns
   */
  private checkForRagePattern(
    type: 'rapid_clicks' | 'rapid_taps',
    elementId: string,
    now: number
  ): void {
    // Get recent clicks/taps on this element
    const recentEvents = this.clickBuffer.filter(
      (e) =>
        (e.type === 'click' || e.type === 'tap') &&
        e.element === elementId &&
        now - e.timestamp < 2000
    );

    if (recentEvents.length >= this.MIN_RAPID_CLICKS) {
      const duration =
        recentEvents[recentEvents.length - 1].timestamp -
        recentEvents[0].timestamp;
      const confidence = Math.min(recentEvents.length / 5, 1); // 5 clicks = max confidence

      this.recordRagePattern(type, recentEvents.length, duration, confidence, {
        element: elementId,
      });
    }
  }

  /**
   * Record a rage pattern
   */
  private recordRagePattern(
    type: RagePattern['type'],
    count: number,
    duration: number,
    confidence: number,
    metadata?: Record<string, any>
  ): void {
    const pattern: RagePattern = {
      type,
      count,
      duration,
      timestamp: Date.now(),
      confidence,
      metadata,
    };

    this.ragePatterns.push(pattern);

    // High confidence patterns should be logged
    if (confidence > 0.7) {
      console.warn(`😠 Rage pattern detected: ${type} (confidence: ${(confidence * 100).toFixed(0)}%)`);
      console.warn(`   Details:`, pattern);
    }

    // Keep buffer manageable
    if (this.ragePatterns.length > 100) {
      this.ragePatterns.shift();
    }
  }

  /**
   * Get element identifier for tracking
   */
  private getElementIdentifier(element: HTMLElement): string {
    // Try to get meaningful identifier
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    if (element.getAttribute('data-test')) {
      return `[data-test="${element.getAttribute('data-test')}"]`;
    }
    return element.tagName.toLowerCase();
  }

  /**
   * Get all detected rage patterns
   */
  getRagePatterns(): RagePattern[] {
    return [...this.ragePatterns];
  }

  /**
   * Get rage patterns filtered by type
   */
  getRagePatternsOfType(type: RagePattern['type']): RagePattern[] {
    return this.ragePatterns.filter((p) => p.type === type);
  }

  /**
   * Get high-confidence rage events
   */
  getHighConfidenceRageEvents(): RagePattern[] {
    return this.ragePatterns.filter((p) => p.confidence > 0.7);
  }

  /**
   * Get rage pattern statistics
   */
  getStatistics() {
    const patterns = this.ragePatterns;
    const highConfidence = patterns.filter((p) => p.confidence > 0.7);

    return {
      totalPatterns: patterns.length,
      highConfidenceCount: highConfidence.length,
      avgConfidence:
        patterns.length > 0
          ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
          : 0,
      byType: {
        rapid_clicks: patterns.filter((p) => p.type === 'rapid_clicks').length,
        rapid_taps: patterns.filter((p) => p.type === 'rapid_taps').length,
        keyboard_mashing: patterns.filter((p) => p.type === 'keyboard_mashing').length,
        scroll_thrashing: patterns.filter((p) => p.type === 'scroll_thrashing').length,
      },
      lastRageEvent: patterns[patterns.length - 1] || null,
      timestamp: Date.now(),
    };
  }

  /**
   * Enable/disable detection
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clear all recorded patterns
   */
  clearPatterns(): void {
    this.ragePatterns = [];
    this.clickBuffer = [];
    this.scrollBuffer = [];
    this.keyPressBuffer = [];
    this.elementClickCounts.clear();
  }

  /**
   * Export rage pattern report
   */
  exportReport() {
    return {
      sessionStart: Date.now(),
      statistics: this.getStatistics(),
      patterns: this.ragePatterns,
      clickBuffer: this.clickBuffer.slice(-50), // Last 50 clicks
    };
  }
}

export const rageClickDetector = RageClickDetector.getInstance();
