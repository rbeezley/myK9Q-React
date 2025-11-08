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
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.notification.data);

  event.notification.close();

  if (event.action === 'dismiss') {
    return; // Just close the notification
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/announcements';

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
  }
});

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

    // Determine notification options based on priority
    const isUrgent = data.priority === 'urgent';
    const isHigh = data.priority === 'high';

    const notificationOptions = {
      body: data.content || data.title,
      icon: '/myK9Q-logo-white.png',
      badge: '/myK9Q-logo-white.png',
      tag: `announcement-${data.licenseKey}-${data.id}`,
      requireInteraction: isUrgent, // Persistent for urgent
      silent: false,
      vibrate: isUrgent ? [200, 100, 200, 100, 200] : [100],
      data: {
        url: '/announcements',
        licenseKey: data.licenseKey,
        announcementId: data.id,
        priority: data.priority
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/myK9Q-logo-white.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/myK9Q-logo-white.png'
        }
      ]
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
    }

    await self.registration.showNotification(title, notificationOptions);

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