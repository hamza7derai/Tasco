// ============================================================
//  TASCO — Firebase Messaging Service Worker
//  Place this file at the ROOT of tasco.ma
//  Same level as index.html, driver.html, admin.html
// ============================================================

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ── FIREBASE CONFIG ──────────────────────────────────────────
// Must match exactly what's in your HTML files
firebase.initializeApp({
  apiKey:            "AIzaSyAaaR52bvyQfkxmZL16lcg4Bd4M76OtbI4",
  authDomain:        "lesgo-cd7f9.firebaseapp.com",
  projectId:         "lesgo-cd7f9",
  storageBucket:     "lesgo-cd7f9.firebasestorage.app",
  messagingSenderId: "618932234525",
  appId:             "1:618932234525:web:8eb0b934b1bfd1060059f4"
});

const messaging = firebase.messaging();

// ── BACKGROUND MESSAGE HANDLER ───────────────────────────────
// Fires when the app is CLOSED or in the BACKGROUND
// This is the whole point — foreground is handled in the app itself
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  const data = payload.data || {};

  // Which page sent this? Used to route the click correctly
  const targetPage = data.targetPage || 'driver.html';

  self.registration.showNotification(title || '🛵 New Order!', {
    body:     body || 'A new delivery is available.',
    icon:     '/icon-192.png',  // create a 192x192 PNG of your logo
    badge:    '/icon-96.png',   // small monochrome icon shown in status bar
    vibrate:  [200, 100, 200, 100, 400],
    tag:      'tasco-order',    // replaces previous notification instead of stacking
    renotify: true,             // vibrate again even if same tag
    data:     { url: '/' + targetPage, orderId: data.orderId || '' }
  });
});

// ── NOTIFICATION CLICK HANDLER ───────────────────────────────
// When driver/admin taps the notification, open the right page
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/driver.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If the page is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── INSTALL & ACTIVATE ───────────────────────────────────────
// Take control immediately without waiting for old tabs to close
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
