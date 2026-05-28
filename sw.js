// ============================================================
// TASCO Driver — Service Worker (sw.js)
// Handles background Firebase Cloud Messaging (FCM) push notifications
// Deploy this file to the ROOT of your web server (/sw.js)
// It MUST be served from the same domain as driver.html
// ============================================================

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ── SAME Firebase config as driver.html ──────────────────────
firebase.initializeApp({
  apiKey:            "AIzaSyAaaR52bvyQfkxmZL16lcg4Bd4M76OtbI4",
  authDomain:        "lesgo-cd7f9.firebaseapp.com",
  projectId:         "lesgo-cd7f9",
  storageBucket:     "lesgo-cd7f9.firebasestorage.app",
  messagingSenderId: "618932234525",
  appId:             "1:618932234525:web:8eb0b934b1bfd1060059f4",
});

const messaging = firebase.messaging();

// ── BACKGROUND MESSAGE HANDLER ───────────────────────────────
// This fires when the browser tab is CLOSED or MINIMIZED
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message received:', payload);

  const n    = payload.notification || {};
  const data = payload.data         || {};

  const title = n.title || '🛵 TASCO — Nouvelle commande !';
  const body  = n.body  || (data.neighborhood ? data.neighborhood + ' · ' + (data.totalPrice || '') + ' DH' : 'Ouvrez l\'app pour voir les détails.');

  self.registration.showNotification(title, {
    body,
    icon:    'https://i.postimg.cc/rmmnn3XM/file-000000007624720ab6ae4d2993693772.png',
    badge:   'https://i.postimg.cc/rmmnn3XM/file-000000007624720ab6ae4d2993693772.png',
    vibrate: [200, 100, 200, 100, 400],
    requireInteraction: true,
    tag:     'tasco-order-' + (data.orderId || Date.now()),
    data:    { url: '/driver.html', orderId: data.orderId },
  });
});

// ── NOTIFICATION CLICK → open app ────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data || {}).url || '/driver.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('driver') && 'focus' in client) {
          client.postMessage({ type: 'NEW_ORDER_CLICK', orderId: event.notification.data?.orderId });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── INSTALL + ACTIVATE ────────────────────────────────────────
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(clients.claim()));
