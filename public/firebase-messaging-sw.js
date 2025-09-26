// This file is intentionally left blank.
// It's presence is required for Firebase to detect a service worker and
// to enable the use of the VAPID key for push notifications.
// Firebase will automatically add its own logic to this file in the background.

// DO NOT DELETE: This file is essential for push notifications to work.
self.addEventListener('push', function(event) {
  if (event.data) {
    const payload = event.data.json();
    const title = payload.notification.title;
    const options = {
      body: payload.notification.body,
      icon: payload.notification.icon || '/logo-192x192.png',
      data: {
        url: payload.data ? payload.data.url : '/',
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
