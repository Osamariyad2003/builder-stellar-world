// Service Worker for Firebase Cloud Messaging
// This file must be in the public folder

importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDUR89i6kvh3bp51GCgBX0fTwh3bFt1Ksg",
  authDomain: "medjust-d26eb.firebaseapp.com",
  projectId: "medjust-d26eb",
  storageBucket: "medjust-d26eb.appspot.com",
  messagingSenderId: "631362355665",
  appId: "1:631362355665:web:4d7f8eadba1bca0969e0f0",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: payload.data || {},
    tag: payload.data?.newsId || 'notification',
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  const data = event.notification.data;
  const newsId = data?.newsId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          if (newsId) {
            return client.navigate(`/admin/news`).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        if (newsId) {
          return clients.openWindow(`/admin/news`);
        }
        return clients.openWindow('/');
      }
    })
  );
});
