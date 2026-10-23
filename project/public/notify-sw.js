// Tabby Dashboard – notification helper.
// Only shows desktop pop-ups and opens the dashboard when one is clicked.
// It does not cache or intercept any page requests.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        client.postMessage({ type: 'tabby-notification-click', id: data.id, tab: data.tab });
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow('/') : undefined;
    })
  );
});
