// Custom Service Worker for Push Notifications
// This extends the Workbox-generated service worker

// Workbox precache manifest injection point
self.__WB_MANIFEST;

// Import Workbox if available
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

// Get current license key from localStorage or session
const getCurrentLicenseKey = async () => {
  // Try to get from various possible storage locations
  const keys = [
    'current_show_license',
    'auth_license_key',
    'licenseKey'
  ];

  for (const key of keys) {
    const value = await getFromStorage(key);
    if (value) return value;
  }

  return null;
};

// Helper to get data from storage (works in service worker)
const getFromStorage = async (key) => {
  return new Promise((resolve) => {
    // Service workers can't access localStorage directly
    // We'll need to communicate with the main thread
    resolve(null);
  });
};

// Push notification handler
self.addEventListener('push', (event) => {
  event.waitUntil(handlePushNotification(event));

  // Forward push notification to all open clients for notification center
  event.waitUntil(
    (async () => {
      try {
        const data = event.data ? event.data.json() : null;
        if (!data) return;

        // Get all active window clients
        const clientList = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        // Forward to each open client
        clientList.forEach(client => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            data: data
          });
        });

        console.log('📤 [ServiceWorker] Push notification forwarded to', clientList.length, 'clients');
      } catch (error) {
        console.error('❌ [ServiceWorker] Failed to forward push notification:', error);
      }
    })()
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.notification.data, 'Action:', event.action);

  event.notification.close();

  // Handle different action types
  if (event.action === 'dismiss') {
    // If summary notification dismissed, close all grouped notifications
    if (event.notification.data?.isSummary) {
      event.waitUntil(
        self.registration.getNotifications().then(notifications => {
          const licenseKey = event.notification.data.licenseKey;
          notifications.forEach(n => {
            if (n.data?.licenseKey === licenseKey && !n.data?.isUrgent && !n.data?.isDogAlert) {
              n.close();
            }
          });
        })
      );
    }
    return; // Just close the notification
  }

  if (event.action === 'acknowledge') {
    // User acknowledged urgent alert - just close without opening app
    console.log('✓ User acknowledged urgent notification');
    return;
  }

  // Determine URL based on action and notification data
  let urlToOpen = '/announcements'; // Default

  if (event.action === 'view-class' && event.notification.data?.classId) {
    // Navigate to entry list (running order for the class)
    urlToOpen = `/class/${event.notification.data.classId}/entries`;
  } else if (event.action === 'view' || !event.action) {
    // Default view action - use custom URL or announcements
    urlToOpen = event.notification.data?.url || '/announcements';
  }

  // If summary notification clicked, close all grouped notifications and navigate
  if (event.notification.data?.isSummary) {
    event.waitUntil(
      self.registration.getNotifications().then(notifications => {
        const licenseKey = event.notification.data.licenseKey;
        notifications.forEach(n => {
          if (n.data?.licenseKey === licenseKey && !n.data?.isUrgent && !n.data?.isDogAlert) {
            n.close();
          }
        });

        // Then open the app
        return clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then((clientList) => {
            // If app is already open, focus it and navigate
            for (const client of clientList) {
              if (client.url.includes(window.location.origin)) {
                client.focus();
                client.postMessage({
                  type: 'NOTIFICATION_CLICK',
                  url: urlToOpen,
                  data: event.notification.data
                });
                return;
              }
            }

            // If no existing window, open new one
            return clients.openWindow(urlToOpen);
          });
      })
    );
  } else {
    // Individual notification clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // If app is already open, focus it and navigate
          for (const client of clientList) {
            if (client.url.includes(window.location.origin)) {
              client.focus();
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: urlToOpen,
                data: event.notification.data
              });
              return;
            }
          }

          // If no existing window, open new one
          return clients.openWindow(urlToOpen);
        })
    );
  }
});

// Listen for messages from main thread (for tenant isolation)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_LICENSE_KEY') {
    // Store license key for tenant isolation
    self.currentLicenseKey = event.data.licenseKey;
    console.log('🔑 Service worker updated license key:', event.data.licenseKey);
  }

  // Handle simulated push notifications (for development)
  if (event.data && event.data.type === 'SIMULATE_PUSH') {
    console.log('🧪 Simulated push notification received:', event.data.data);

    // Create a simulated push event
    const simulatedEvent = {
      data: {
        json: () => event.data.data,
        text: () => JSON.stringify(event.data.data)
      },
      waitUntil: (promise) => promise
    };

    // Process the simulated push notification
    handlePushNotification(simulatedEvent);

    // Forward to all open clients for notification center
    (async () => {
      try {
        const clientList = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        clientList.forEach(client => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            data: event.data.data
          });
        });

        console.log('📤 [ServiceWorker] Simulated push forwarded to', clientList.length, 'clients');
      } catch (error) {
        console.error('❌ [ServiceWorker] Failed to forward simulated push:', error);
      }
    })();
  }
});

// Helper function to update notification summary
async function updateNotificationSummary(licenseKey, showName) {
  try {
    // Get all current notifications
    const allNotifications = await self.registration.getNotifications();

    // Count grouped (non-urgent, non-dog) notifications for this show
    const groupedNotifications = allNotifications.filter(n =>
      n.data?.licenseKey === licenseKey &&
      !n.data?.isUrgent &&
      !n.data?.isDogAlert &&
      !n.data?.isSummary
    );

    const count = groupedNotifications.length;

    // Only show summary if we have 2+ grouped notifications
    if (count >= 2) {
      console.log(`📊 Showing summary notification for ${count} grouped alerts`);

      await self.registration.showNotification(
        `${showName || 'myK9Q'} - ${count} updates`,
        {
          body: `Tap to view all announcements`,
          icon: '/myK9Q-notification-icon-192.png',
          badge: '/myK9Q-notification-badge-96.png',
          tag: `show-${licenseKey}-summary`,
          group: `show-${licenseKey}`,
          renotify: true,
          data: {
            url: '/announcements',
            licenseKey: licenseKey,
            isSummary: true
          }
        }
      );
    } else {
      // Remove summary if we're down to 1 or 0 grouped notifications
      const summaryNotifications = allNotifications.filter(n =>
        n.data?.isSummary && n.data?.licenseKey === licenseKey
      );
      summaryNotifications.forEach(n => n.close());
    }
  } catch (error) {
    console.error('Error updating notification summary:', error);
  }
}

// Extract push notification logic into a reusable function
async function handlePushNotification(event) {
  console.log('🔔 Processing push notification:', event.data?.text());

  if (!event.data) {
    console.warn('Push event received but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📨 Push data:', data);

    // Validate required fields
    if (!data.licenseKey || !data.title) {
      console.warn('Invalid push data - missing required fields');
      return;
    }

    // Get current user's license key (tenant isolation)
    const currentLicense = self.currentLicenseKey;

    // Only show notification if it's for the current show
    if (currentLicense && data.licenseKey !== currentLicense) {
      console.log('🚫 Push notification ignored - different show');
      return;
    }

    // Determine notification type and priority
    const isUrgent = data.priority === 'urgent';
    const isHigh = data.priority === 'high';
    const isDogAlert = data.type === 'dog-alert' || data.dogId;

    // Smart grouping strategy:
    // - Urgent alerts: unique tag (no grouping, always visible)
    // - Dog alerts: unique tag (no grouping, important to user)
    // - Normal announcements: grouped by show (reduce clutter)
    const notificationTag = isUrgent || isDogAlert
      ? `${data.type || 'announcement'}-${data.licenseKey}-${data.id}`  // Unique = no grouping
      : `announcement-${data.licenseKey}-${data.id}`;  // Regular tag

    const notificationGroup = isUrgent || isDogAlert
      ? undefined  // No group = standalone notification
      : `show-${data.licenseKey}`;  // Grouped with other announcements

    // Build context-aware action buttons
    let actions = [];

    if (isDogAlert) {
      // Dog-specific actions: View class list to see position, Dismiss
      actions = [
        {
          action: 'view-class',
          title: '👁️ View Class',
          icon: '/myK9Q-notification-icon-192.png'
        },
        {
          action: 'dismiss',
          title: '✕ Dismiss',
          icon: '/myK9Q-notification-icon-192.png'
        }
      ];
    } else if (isUrgent) {
      // Urgent: View immediately, Acknowledge, Remind later
      actions = [
        {
          action: 'view',
          title: '👁️ View Now',
          icon: '/myK9Q-notification-icon-192.png'
        },
        {
          action: 'acknowledge',
          title: '✓ Got It',
          icon: '/myK9Q-notification-icon-192.png'
        }
      ];
    } else {
      // General announcements: View, Dismiss
      actions = [
        {
          action: 'view',
          title: '👁️ View',
          icon: '/myK9Q-notification-icon-192.png'
        },
        {
          action: 'dismiss',
          title: '✕ Dismiss',
          icon: '/myK9Q-notification-icon-192.png'
        }
      ];
    }

    const notificationOptions = {
      body: data.content || data.title,
      icon: '/myK9Q-notification-icon-512.png',
      badge: '/myK9Q-notification-badge-96.png',
      tag: notificationTag,
      group: notificationGroup,  // Enables grouping on Android/Chrome
      requireInteraction: isUrgent, // Persistent for urgent
      renotify: !isUrgent && notificationGroup !== undefined, // Re-alert for grouped notifications
      silent: false,
      vibrate: isUrgent ? [200, 100, 200, 100, 200] : [100],
      data: {
        url: data.url || '/announcements',
        licenseKey: data.licenseKey,
        announcementId: data.id,
        priority: data.priority,
        isUrgent: isUrgent,
        isDogAlert: isDogAlert,
        dogId: data.dogId,
        dogName: data.dogName,
        classId: data.classId,
        entryId: data.entryId
      },
      actions: actions
    };

    // Customize title based on priority and show info
    let title = data.title || 'Show Update';

    // Add show name if available (but not if title already contains it)
    if (data.showName && !title.includes(data.showName)) {
      title = `${data.showName}: ${title}`;
    }

    // Add priority indicators
    if (isUrgent) {
      title = `🚨 ${title}`;
    } else if (isHigh) {
      title = `⚠️ ${title}`;
    } else if (isDogAlert) {
      title = `🐕 ${title}`;
    }

    console.log(`📬 Showing notification - Tag: ${notificationTag}, Group: ${notificationGroup || 'none'}`);
    await self.registration.showNotification(title, notificationOptions);

    // Update summary notification for grouped announcements
    if (notificationGroup && !isUrgent && !isDogAlert) {
      await updateNotificationSummary(data.licenseKey, data.showName);
    }

  } catch (error) {
    console.error('Error handling push notification:', error);
  }
}

// Background sync for offline announcements (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'announcement-sync') {
    console.log('🔄 Background sync for announcements');
    // Could sync offline-created announcements here
  }
});

console.log('📱 Custom service worker with push notifications loaded');