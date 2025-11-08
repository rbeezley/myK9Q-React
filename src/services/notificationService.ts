/**
 * Comprehensive Notification Service
 *
 * Handles all notification types, permissions, scheduling, queueing, and delivery tracking.
 * Integrates with settings to respect user preferences including Do Not Disturb mode.
 */

import { useSettingsStore } from '@/stores/settingsStore';
import voiceAnnouncementService from './voiceAnnouncementService';

export type NotificationType =
  | 'class_starting'
  | 'your_turn'
  | 'results_posted'
  | 'sync_error'
  | 'system_update'
  | 'announcement'
  | 'urgent_announcement';

export interface NotificationPayload {
  id?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  icon?: string;
  badge?: string;
  image?: string;
  vibrate?: number[];
  sound?: string;
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPermissionStatus {
  permission: NotificationPermission;
  supported: boolean;
  canRequestPermission: boolean;
}

export interface NotificationQueueItem {
  id: string;
  payload: NotificationPayload;
  scheduledFor: number; // timestamp
  retryCount: number;
  maxRetries: number;
  createdAt: number;
}

export interface NotificationDeliveryRecord {
  id: string;
  type: NotificationType;
  sentAt: number;
  delivered: boolean;
  clicked: boolean;
  dismissed: boolean;
  error?: string;
  licenseKey?: string;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // "22:00" (24-hour format)
  endTime: string; // "08:00"
  allowUrgent: boolean; // Allow urgent notifications during quiet hours
}

export interface DoNotDisturbConfig {
  enabled: boolean;
  until?: number; // timestamp - when to auto-disable
  allowUrgent: boolean; // Allow urgent notifications
  allowedTypes: NotificationType[]; // Specific types allowed during DND
}

/**
 * Comprehensive Notification Service
 */
class NotificationService {
  private static instance: NotificationService;
  private queue: NotificationQueueItem[] = [];
  private deliveryRecords: NotificationDeliveryRecord[] = [];
  private queueProcessingInterval: number | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  // Sound files (to be added to public directory)
  private sounds: Record<string, string> = {
    default: '/sounds/notification-default.mp3',
    urgent: '/sounds/notification-urgent.mp3',
    success: '/sounds/notification-success.mp3',
    warning: '/sounds/notification-warning.mp3',
  };

  private constructor() {
    this.initializeServiceWorker();
    this.startQueueProcessing();
    this.setupVisibilityChangeListener();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        console.log('✅ Service worker ready for notifications');
      } catch (error) {
        console.error('Failed to initialize service worker:', error);
      }
    }
  }

  /**
   * Check notification permission status
   */
  getPermissionStatus(): NotificationPermissionStatus {
    const supported = 'Notification' in window;

    return {
      permission: supported ? Notification.permission : 'denied',
      supported,
      canRequestPermission: supported && Notification.permission === 'default',
    };
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log(`📱 Notification permission ${permission}`);

      // If permission granted, update settings
      if (permission === 'granted') {
        useSettingsStore.getState().updateSettings({ enableNotifications: true });
      }

      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are enabled in settings
   */
  private areNotificationsEnabled(): boolean {
    const { settings } = useSettingsStore.getState();
    return settings.enableNotifications && Notification.permission === 'granted';
  }

  /**
   * Check if a specific notification type is enabled
   */
  private isNotificationTypeEnabled(_type: NotificationType): boolean {
    // In-app notifications are always enabled
    // (Previously had user-configurable toggles, but those have been removed for simplicity)
    return true;
  }

  /**
   * Get quiet hours configuration from settings
   */
  private getQuietHoursConfig(): QuietHoursConfig {
    // Get from localStorage or settings
    const stored = localStorage.getItem('notification_quiet_hours');
    if (stored) {
      return JSON.parse(stored);
    }

    // Default quiet hours: 10 PM to 8 AM
    return {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      allowUrgent: true,
    };
  }

  /**
   * Set quiet hours configuration
   */
  setQuietHours(config: QuietHoursConfig): void {
    localStorage.setItem('notification_quiet_hours', JSON.stringify(config));
    console.log('🌙 Quiet hours updated:', config);
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    const config = this.getQuietHoursConfig();
    if (!config.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { startTime, endTime } = config;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    // Handle same-day quiet hours (e.g., 13:00 to 17:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Get Do Not Disturb configuration
   */
  private getDNDConfig(): DoNotDisturbConfig {
    const stored = localStorage.getItem('notification_dnd');
    if (stored) {
      const config: DoNotDisturbConfig = JSON.parse(stored);

      // Check if DND has expired
      if (config.until && config.until < Date.now()) {
        config.enabled = false;
        this.setDND(config);
      }

      return config;
    }

    return {
      enabled: false,
      allowUrgent: true,
      allowedTypes: [],
    };
  }

  /**
   * Set Do Not Disturb mode
   */
  setDND(config: DoNotDisturbConfig): void {
    localStorage.setItem('notification_dnd', JSON.stringify(config));
    console.log('🔕 Do Not Disturb updated:', config);
  }

  /**
   * Enable Do Not Disturb for a duration
   */
  enableDNDFor(minutes: number, allowUrgent = true): void {
    this.setDND({
      enabled: true,
      until: Date.now() + (minutes * 60 * 1000),
      allowUrgent,
      allowedTypes: [],
    });
  }

  /**
   * Disable Do Not Disturb
   */
  disableDND(): void {
    this.setDND({
      enabled: false,
      allowUrgent: true,
      allowedTypes: [],
    });
  }

  /**
   * Check if DND is active
   */
  isDNDActive(): boolean {
    return this.getDNDConfig().enabled;
  }

  /**
   * Check if notification should be blocked by DND or quiet hours
   */
  private shouldBlockNotification(payload: NotificationPayload): boolean {
    const isUrgent = payload.priority === 'urgent';

    // Check DND
    const dndConfig = this.getDNDConfig();
    if (dndConfig.enabled) {
      // Allow if it's urgent and DND allows urgent
      if (isUrgent && dndConfig.allowUrgent) {
        return false;
      }

      // Allow if type is in allowed list
      if (dndConfig.allowedTypes.includes(payload.type)) {
        return false;
      }

      console.log('🔕 Notification blocked by DND:', payload.type);
      return true;
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      const quietConfig = this.getQuietHoursConfig();

      // Allow urgent notifications during quiet hours if configured
      if (isUrgent && quietConfig.allowUrgent) {
        return false;
      }

      console.log('🌙 Notification blocked by quiet hours:', payload.type);
      return true;
    }

    return false;
  }

  /**
   * Send a notification immediately
   */
  async send(payload: NotificationPayload): Promise<string | null> {
    // Check if notifications are globally enabled
    if (!this.areNotificationsEnabled()) {
      console.log('📱 Notifications disabled in settings');
      return null;
    }

    // Check if this notification type is enabled
    if (!this.isNotificationTypeEnabled(payload.type)) {
      console.log(`📱 Notification type ${payload.type} disabled in settings`);
      return null;
    }

    // Check DND and quiet hours
    if (this.shouldBlockNotification(payload)) {
      // Queue for later if it's important
      if (payload.priority === 'high' || payload.priority === 'urgent') {
        return this.queueNotification(payload);
      }
      return null;
    }

    const notificationId = payload.id || this.generateNotificationId();
    const { settings } = useSettingsStore.getState();

    try {
      // Play sound if enabled
      if (settings.notificationSound && !payload.silent) {
        this.playNotificationSound(payload.priority || 'normal');
      }

      // Trigger haptic feedback if enabled
      if (settings.hapticFeedback && 'vibrate' in navigator) {
        const vibrationPattern = this.getVibrationPattern(payload.priority || 'normal');
        navigator.vibrate(vibrationPattern);
      }

      // Voice announcement if enabled (use voiceNotifications for push notifications)
      // Suppress voice notifications if actively scoring to prevent interrupting timer announcements
      if (settings.voiceNotifications && !payload.silent && !voiceAnnouncementService.isScoringInProgress()) {
        this.announceNotification(payload);
      }

      // Create notification options
      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/myK9Q-notification-icon-512.png',
        badge: payload.badge || '/myK9Q-notification-icon-512.png',
        tag: payload.tag || `notification-${notificationId}`,
        data: {
          ...payload.data,
          id: notificationId,
          type: payload.type,
          timestamp: payload.timestamp || Date.now(),
        },
        requireInteraction: payload.requireInteraction || payload.priority === 'urgent',
        silent: payload.silent || false,
        ...(payload.vibrate ? { vibrate: payload.vibrate } : {}),
        ...(payload.image ? { image: payload.image } : {}),
        ...(payload.actions ? { actions: payload.actions } : {}),
      };

      // Send notification
      if (this.registration) {
        await this.registration.showNotification(payload.title, options);
      } else {
        new Notification(payload.title, options);
      }

      // Update badge count if enabled
      if (settings.showBadges) {
        this.updateBadgeCount(1);
      }

      // Record delivery
      this.recordDelivery({
        id: notificationId,
        type: payload.type,
        sentAt: Date.now(),
        delivered: true,
        clicked: false,
        dismissed: false,
      });

      console.log('📱 Notification sent:', payload.title);
      return notificationId;

    } catch (error) {
      console.error('Failed to send notification:', error);

      // Record failed delivery
      this.recordDelivery({
        id: notificationId,
        type: payload.type,
        sentAt: Date.now(),
        delivered: false,
        clicked: false,
        dismissed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return null;
    }
  }

  /**
   * Queue a notification for later delivery
   */
  queueNotification(payload: NotificationPayload, scheduledFor?: number): string {
    const id = payload.id || this.generateNotificationId();
    const queueItem: NotificationQueueItem = {
      id,
      payload: { ...payload, id },
      scheduledFor: scheduledFor || Date.now(),
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
    };

    this.queue.push(queueItem);
    console.log(`📬 Notification queued (${this.queue.length} in queue):`, payload.title);

    return id;
  }

  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const now = Date.now();
    const readyItems = this.queue.filter(item => item.scheduledFor <= now);

    for (const item of readyItems) {
      try {
        const sent = await this.send(item.payload);

        if (sent) {
          // Remove from queue
          this.queue = this.queue.filter(q => q.id !== item.id);
        } else {
          // Retry later if not sent
          item.retryCount++;

          if (item.retryCount >= item.maxRetries) {
            console.error('Max retries reached for notification:', item.id);
            this.queue = this.queue.filter(q => q.id !== item.id);
          } else {
            // Exponential backoff: 1min, 2min, 4min
            item.scheduledFor = now + (Math.pow(2, item.retryCount) * 60 * 1000);
          }
        }
      } catch (error) {
        console.error('Error processing queued notification:', error);
      }
    }
  }

  /**
   * Start queue processing interval
   */
  private startQueueProcessing(): void {
    if (this.queueProcessingInterval) return;

    // Process queue every 30 seconds
    this.queueProcessingInterval = window.setInterval(() => {
      this.processQueue();
    }, 30000);
  }

  /**
   * Stop queue processing
   */
  private stopQueueProcessing(): void {
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
      this.queueProcessingInterval = null;
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { count: number; items: NotificationQueueItem[] } {
    return {
      count: this.queue.length,
      items: [...this.queue],
    };
  }

  /**
   * Clear notification queue
   */
  clearQueue(): void {
    this.queue = [];
    console.log('📭 Notification queue cleared');
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(priority: string): void {
    try {
      const soundFile = priority === 'urgent' ? this.sounds.urgent : this.sounds.default;
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.warn('Could not play notification sound:', err);
      });
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  /**
   * Get vibration pattern for priority
   */
  private getVibrationPattern(priority: string): number[] {
    switch (priority) {
      case 'urgent':
        return [200, 100, 200, 100, 200]; // Triple pulse
      case 'high':
        return [200, 100, 200]; // Double pulse
      case 'low':
        return [100]; // Single short pulse
      default:
        return [150]; // Single medium pulse
    }
  }

  /**
   * Announce notification using voice synthesis
   */
  private announceNotification(payload: NotificationPayload): void {
    try {
      // Create concise voice announcement based on notification type
      let text = '';

      switch (payload.type) {
        case 'your_turn': {
          // Extract dog name and armband from data or title
          const dogName = payload.data?.callName || '';
          const armband = payload.data?.armbandNumber || '';
          const dogsAhead = payload.data?.dogsAhead || 1;

          if (dogsAhead === 1) {
            text = dogName ? `${dogName}, number ${armband}, you're up next` : 'You\'re up next';
          } else {
            text = dogName ? `${dogName}, number ${armband}, you're ${dogsAhead} dogs away` : `You're ${dogsAhead} dogs away`;
          }
          break;
        }

        case 'results_posted': {
          const dogName = payload.data?.callName as string || '';
          const placement = payload.data?.placement as number | undefined;
          const qualified = payload.data?.qualified as boolean | undefined;

          if (placement && typeof placement === 'number' && placement <= 4) {
            const ordinals = ['', 'first', 'second', 'third', 'fourth'];
            text = `${dogName}, ${ordinals[placement]} place`;
            if (qualified) {
              text += ', qualified';
            }
          } else {
            text = dogName ? `Results posted for ${dogName}` : 'Results posted';
          }
          break;
        }

        case 'class_starting': {
          const className = payload.data?.className || '';
          text = className ? `${className} starting soon` : 'Class starting soon';
          break;
        }

        case 'announcement':
        case 'urgent_announcement': {
          // For announcements, just announce the title (body might be too long)
          text = payload.title.replace(/🚨/g, '').replace(/URGENT:/g, 'Urgent announcement,');
          break;
        }

        case 'system_update': {
          text = 'App update available';
          break;
        }

        case 'sync_error': {
          text = 'Sync error occurred';
          break;
        }

        default:
          // For unknown types, use title
          text = payload.title;
      }

      if (text) {
        voiceAnnouncementService.announce({
          text,
          priority: payload.priority === 'urgent' ? 'high' : 'normal',
        });
      }
    } catch (error) {
      console.error('Failed to announce notification:', error);
      // Don't throw - voice announcement failure shouldn't break notifications
    }
  }

  /**
   * Update PWA badge count
   */
  private async updateBadgeCount(increment: number): Promise<void> {
    if ('setAppBadge' in navigator) {
      try {
        const currentBadge = await this.getBadgeCount();
        const newBadge = Math.max(0, currentBadge + increment);

        if (newBadge > 0) {
          await (navigator as any).setAppBadge(newBadge);
        } else {
          await (navigator as any).clearAppBadge();
        }
      } catch (error) {
        console.warn('Could not update badge count:', error);
      }
    }
  }

  /**
   * Get current badge count
   */
  private async getBadgeCount(): Promise<number> {
    // Get from local storage as Badge API doesn't provide getter
    const stored = localStorage.getItem('notification_badge_count');
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Clear badge count
   */
  async clearBadge(): Promise<void> {
    if ('clearAppBadge' in navigator) {
      try {
        await (navigator as any).clearAppBadge();
        localStorage.setItem('notification_badge_count', '0');
      } catch (error) {
        console.warn('Could not clear badge:', error);
      }
    }
  }

  /**
   * Record notification delivery
   */
  private recordDelivery(record: NotificationDeliveryRecord): void {
    this.deliveryRecords.push(record);

    // Keep only last 100 records
    if (this.deliveryRecords.length > 100) {
      this.deliveryRecords = this.deliveryRecords.slice(-100);
    }
  }

  /**
   * Get delivery analytics
   */
  getDeliveryAnalytics(): {
    total: number;
    delivered: number;
    failed: number;
    clicked: number;
    dismissed: number;
    deliveryRate: number;
    clickRate: number;
  } {
    const total = this.deliveryRecords.length;
    const delivered = this.deliveryRecords.filter(r => r.delivered).length;
    const failed = total - delivered;
    const clicked = this.deliveryRecords.filter(r => r.clicked).length;
    const dismissed = this.deliveryRecords.filter(r => r.dismissed).length;

    return {
      total,
      delivered,
      failed,
      clicked,
      dismissed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    };
  }

  /**
   * Mark notification as clicked
   */
  markAsClicked(notificationId: string): void {
    const record = this.deliveryRecords.find(r => r.id === notificationId);
    if (record) {
      record.clicked = true;
    }
  }

  /**
   * Mark notification as dismissed
   */
  markAsDismissed(notificationId: string): void {
    const record = this.deliveryRecords.find(r => r.id === notificationId);
    if (record) {
      record.dismissed = true;
    }
  }

  /**
   * Setup visibility change listener to process queue when page becomes visible
   */
  private setupVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.processQueue();
      }
    });
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
      console.log(`🗑️ Cleared ${notifications.length} notifications`);
    }

    await this.clearBadge();
  }

  /**
   * Test notification (for debugging)
   */
  async sendTestNotification(): Promise<void> {
    await this.send({
      type: 'system_update',
      title: '🧪 Test Notification',
      body: 'This is a test notification from the notification service',
      priority: 'normal',
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
