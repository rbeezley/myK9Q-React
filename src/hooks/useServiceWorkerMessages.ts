import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook to handle messages from the service worker
 * Primarily used for notification click navigation
 */
export const useServiceWorkerMessages = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      const { type, url, data } = event.data;

      // Handle notification click messages from service worker
      if (type === 'NOTIFICATION_CLICK' && url) {
        console.log('📱 [ServiceWorker] Notification click - navigating to:', url);

        // Navigate to the URL
        navigate(url);

        // Optionally show an in-app toast as confirmation
        if (data) {
          addNotification({
            announcementId: data.announcementId || 0,
            title: data.title || 'Notification',
            content: `Navigating to ${url}`,
            priority: data.priority || 'normal',
            type: data.isDogAlert ? 'dog-alert' : 'announcement',
            url: url,
            licenseKey: data.licenseKey,
            showName: data.showName
          });
        }
      }
    };

    // Register the message handler
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);

      console.log('📡 [ServiceWorker] Message listener registered');

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        console.log('📡 [ServiceWorker] Message listener removed');
      };
    }
  }, [navigate, addNotification]);
};
