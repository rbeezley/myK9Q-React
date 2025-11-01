/**
 * Push Notification Service
 *
 * Handles Web Push API subscription and management.
 *
 * User Identification Strategy:
 * - Since passcodes are shared (e.g., all exhibitors use 'e4b6c'),
 *   we generate a unique browser-based user ID per device
 * - Format: "{role}_{uuid}" (e.g., "exhibitor_a1b2c3d4-e5f6-...")
 * - Stored in localStorage and persists across sessions
 * - Each device/browser gets a unique subscription
 *
 * Multi-Show Strategy (Auto-Switch):
 * - User can only be subscribed to ONE show at a time
 * - When user opens a new show, subscription automatically switches to new show
 * - Zero user friction - completely transparent
 * - Call switchToShow() when license_key changes
 */

import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const PUSH_USER_ID_KEY = 'push_user_id'; // Browser-unique ID

interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
  user_role: string;
  license_key: string;
  user_agent: string;
  notification_preferences: {
    announcements: boolean;
    up_soon: boolean;
    results: boolean;
    spam_limit: number;
    favorite_armbands: number[];
  };
}

export class PushNotificationService {
  /**
   * Get or generate a unique browser-based user ID
   * This ID persists across sessions in localStorage
   */
  private static getBrowserUserId(role: string): string {
    // Check if we already have a user ID for this browser
    let userId = localStorage.getItem(PUSH_USER_ID_KEY);

    if (!userId) {
      // Generate a new unique ID for this browser/device
      userId = crypto.randomUUID();
      localStorage.setItem(PUSH_USER_ID_KEY, userId);
      console.log('[Push] Generated new browser user ID:', userId);
    }

    // Return format: "{role}_{uuid}"
    return `${role}_${userId}`;
  }

  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Check current permission state
   */
  static async getPermissionState(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[Push] Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[Push] Permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   *
   * @param role - User role (admin, judge, steward, exhibitor)
   * @param licenseKey - Show license key
   * @param favoriteArmbands - Array of armband numbers user has favorited
   */
  static async subscribe(
    role: string,
    licenseKey: string,
    favoriteArmbands: number[] = []
  ): Promise<boolean> {
    try {
      // 1. Check support
      if (!this.isSupported()) {
        throw new Error('Push notifications not supported');
      }

      // 2. Check/request permission
      const permission = await this.getPermissionState();
      if (permission === 'denied') {
        throw new Error('Notification permission denied');
      }
      if (permission === 'default') {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Notification permission not granted');
        }
      }

      // 3. Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service worker ready:', registration);

      // 4. Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
      });

      console.log('[Push] Browser subscription created:', subscription);

      // 5. Extract subscription data
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;
      const endpoint = subscriptionJson.endpoint;

      if (!p256dh || !auth || !endpoint) {
        throw new Error('Invalid subscription data');
      }

      // 6. Generate unique browser-based user ID
      const userId = this.getBrowserUserId(role);

      // 7. Save to database
      const subscriptionData: PushSubscriptionData = {
        endpoint,
        p256dh,
        auth,
        user_id: userId,
        user_role: role,
        license_key: licenseKey,
        user_agent: navigator.userAgent,
        notification_preferences: {
          announcements: true,
          up_soon: true,
          results: false,
          spam_limit: 10,
          favorite_armbands: favoriteArmbands
        }
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'endpoint', // Update if already exists
        });

      if (error) {
        console.error('[Push] Database save error:', error);
        throw error;
      }

      console.log('[Push] ✓ Successfully subscribed to push notifications');
      return true;

    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      // 1. Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('[Push] No active subscription found');
        return true;
      }

      // 2. Unsubscribe from browser
      await subscription.unsubscribe();
      console.log('[Push] Browser unsubscribed');

      // 3. Remove from database
      const endpoint = subscription.endpoint;
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (error) {
        console.error('[Push] Database delete error:', error);
        throw error;
      }

      console.log('[Push] ✓ Successfully unsubscribed from push notifications');
      return true;

    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      return false;
    }
  }

  /**
   * Update favorite armbands for current subscription
   */
  static async updateFavoriteArmbands(favoriteArmbands: number[]): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      // Get current subscription endpoint
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.warn('[Push] No active subscription - cannot update favorites');
        return false;
      }

      // Update database
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          notification_preferences: {
            announcements: true,
            up_soon: true,
            results: false,
            spam_limit: 10,
            favorite_armbands: favoriteArmbands
          }
        })
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('[Push] Update favorites error:', error);
        throw error;
      }

      console.log('[Push] ✓ Updated favorite armbands:', favoriteArmbands);
      return true;

    } catch (error) {
      console.error('[Push] Update favorites error:', error);
      return false;
    }
  }

  /**
   * Switch subscription to a new show (auto-switch strategy)
   *
   * This is called automatically when user opens a different show.
   * Updates the existing subscription's license_key and favorite_armbands.
   *
   * @param licenseKey - New show license key
   * @param favoriteArmbands - Favorite armbands for new show (from localStorage)
   */
  static async switchToShow(licenseKey: string, favoriteArmbands: number[] = []): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      // Get current subscription endpoint
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('[Push] No active subscription - cannot switch shows');
        return false;
      }

      // Update database with new show information
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          license_key: licenseKey,
          notification_preferences: {
            announcements: true,
            up_soon: true,
            results: false,
            spam_limit: 10,
            favorite_armbands: favoriteArmbands
          },
          updated_at: new Date().toISOString()
        })
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('[Push] Switch show error:', error);
        throw error;
      }

      console.log('[Push] ✓ Switched to show:', licenseKey, 'with favorites:', favoriteArmbands);
      return true;

    } catch (error) {
      console.error('[Push] Switch show error:', error);
      return false;
    }
  }

  /**
   * Check if currently subscribed
   */
  static async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      return subscription !== null;
    } catch (error) {
      console.error('[Push] Check subscription error:', error);
      return false;
    }
  }

  /**
   * Get current subscription details
   */
  static async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.isSupported()) {
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Push] Get subscription error:', error);
      return null;
    }
  }

  /**
   * Convert VAPID public key to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default PushNotificationService;
