import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Announcement } from '../stores/announcementStore';

export interface InAppNotification {
  id: string;
  announcementId: number;
  title: string;
  content: string;
  priority: 'normal' | 'high' | 'urgent';
  type: 'announcement' | 'dog-alert' | 'system';
  timestamp: string;
  isRead: boolean;
  url?: string;
  dogId?: number;
  dogName?: string;
  classId?: number;
  licenseKey: string;
  showName?: string;
}

interface NotificationContextValue {
  // Notification state
  notifications: InAppNotification[];
  unreadCount: number;

  // Panel state
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Notification actions
  addNotification: (notification: Omit<InAppNotification, 'id' | 'isRead' | 'timestamp'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;

  // Real-time connection
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const MAX_NOTIFICATIONS = 50; // Keep last 50 notifications in memory
const NOTIFICATION_STORAGE_KEY = 'myK9Q_in_app_notifications';
const AUTO_DISMISS_DELAY = 8000; // 8 seconds for non-urgent notifications

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showContext } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter to only show notifications from the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recent = parsed.filter((n: InAppNotification) => n.timestamp > oneDayAgo);
        setNotifications(recent);
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Add notification
  const addNotification = useCallback((notification: Omit<InAppNotification, 'id' | 'isRead' | 'timestamp'>) => {
    const newNotification: InAppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => {
      // Add to beginning of array (newest first)
      const updated = [newNotification, ...prev];

      // Keep only MAX_NOTIFICATIONS most recent
      return updated.slice(0, MAX_NOTIFICATIONS);
    });

    // Auto-dismiss non-urgent notifications after delay
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, AUTO_DISMISS_DELAY);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Panel controls
  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);

  // Listen for push notifications from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const data = event.data.data;
        console.log('📨 [NotificationContext] Push notification received from service worker:', data);

        // Determine notification type based on backend payload
        let type: 'announcement' | 'dog-alert' | 'system' = 'announcement';
        if (data.type === 'up_soon' || data.type === 'dog-alert') {
          type = 'dog-alert';
        } else if (data.type === 'come_to_gate') {
          type = 'dog-alert'; // Also a dog-specific alert
        } else if (data.type === 'announcement') {
          type = 'announcement';
        }

        // Add to notification center
        addNotification({
          announcementId: data.id || data.announcement_id || 0,
          title: data.title || 'Notification',
          content: data.body || data.content || '',
          priority: (data.priority || 'normal') as 'normal' | 'high' | 'urgent',
          type,
          url: data.url || '/announcements',
          dogId: data.dogId,
          dogName: data.dog_name || data.dogName,
          classId: data.class_id || data.classId,
          licenseKey: data.license_key || data.licenseKey || '',
          showName: data.show_name || data.showName
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      console.log('📡 [NotificationContext] Listening for push notifications from service worker');

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        console.log('🔌 [NotificationContext] Stopped listening for push notifications');
      };
    }
  }, [addNotification]);

  // Set up real-time subscription for announcements
  useEffect(() => {
    if (!showContext?.licenseKey) {
      // Clean up if no license key
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
        setRealtimeChannel(null);
        setIsConnected(false);
      }
      return;
    }

    const licenseKey = showContext.licenseKey;
    const showName = showContext.showName;

    console.log('📡 [NotificationContext] Setting up real-time subscription for:', licenseKey);

    // Create channel for announcements table
    const channel = supabase
      .channel(`in-app-notifications:${licenseKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: `license_key=eq.${licenseKey}`
        },
        (payload) => {
          console.log('🔔 [NotificationContext] New announcement received:', payload.new);

          const announcement = payload.new as Announcement;

          // Determine notification type
          const isDogAlert = false; // We'd need additional context to know if it's a dog alert
          const type = isDogAlert ? 'dog-alert' : 'announcement';

          // Add as in-app notification
          addNotification({
            announcementId: announcement.id,
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority,
            type,
            url: '/announcements',
            licenseKey: announcement.license_key,
            showName: showName
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 [NotificationContext] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setRealtimeChannel(channel);

    // Cleanup on unmount or license key change
    return () => {
      console.log('🔌 [NotificationContext] Cleaning up real-time subscription');
      channel.unsubscribe();
      setRealtimeChannel(null);
      setIsConnected(false);
    };
  }, [showContext?.licenseKey, showContext?.showName, addNotification]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isPanelOpen,
    openPanel,
    closePanel,
    togglePanel,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    isConnected
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
