import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage immediately (not in useEffect)
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter to only show notifications from the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recent = parsed.filter((n: InAppNotification) => n.timestamp > oneDayAgo);
return recent;
      }
    } catch (error) {
      logger.error('Error loading notifications from storage:', error);
    }
    return [];
  });

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // isConnected now reflects service worker availability (for push notifications)
  // rather than Supabase real-time subscription status
  const [isConnected, setIsConnected] = useState(false);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      logger.error('Error saving notifications to storage:', error);
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

    // Note: Removed auto-dismiss behavior - notifications stay in center until manually dismissed
    // Users can clear individual notifications or use "Clear all" button
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
  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);

  // Listen for push notifications from service worker
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        const data = event.data.data;
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
      // Check if service worker is ready (indicates push notifications can work)
      navigator.serviceWorker.ready.then(() => {
        setIsConnected(true);
      });
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [addNotification]);

  // Note: Real-time subscription on announcements table was REMOVED to prevent duplicate notifications.
  // Push notifications (via database trigger → Edge function → service worker) are the single source of truth.
  // The service worker forwards push notifications to this context via the message handler above.
  // If you need real-time updates without push notifications, re-enable this subscription,
  // but be aware it will cause duplicates if push notifications are also enabled.

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

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
