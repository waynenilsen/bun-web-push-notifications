self.addEventListener('push', (event) => {
  console.log('Push event received');
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/img.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      clickTarget: 'https://localhost:4200' // Store the URL to open
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click event received');
  event.notification.close();

  const clickTarget = event.notification.data.clickTarget || 'https://localhost:4200';
  console.log('Attempting to open:', clickTarget);

  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then((clientList) => {
        console.log('Existing clients:', clientList.length);

        // Check if there's already a window open
        for (let client of clientList) {
          if (client.url === clickTarget && 'focus' in client) {
            console.log('Focusing existing client');
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          console.log('Opening new window');
          return clients.openWindow(clickTarget);
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});
