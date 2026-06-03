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
// Fires when the app is CLOSED or in the BACKGROUND.
//
// IMPORTANT: to avoid the "two notifications" problem, the SENDER must send a
// DATA-ONLY message (no `notification` key). When a `notification` key is
// present, the browser auto-displays it AND this handler runs -> duplicates.
// We read from payload.data first, falling back to payload.notification so
// nothing breaks during the transition to data-only sends.
messaging.onBackgroundMessage(payload => {
  const data = payload.data || {};
  const n    = payload.notification || {};

  const title      = data.title || n.title || '🛵 New Order!';
  const body       = data.body  || n.body  || 'A new delivery is available.';
  const targetPage = data.targetPage || 'driver.html';
  const orderId    = data.orderId || '';

  self.registration.showNotification(title, {
    body,
    icon:     data.icon || '/icon-192.png',
    badge:    '/iconBar-96.png',          // monochrome status-bar icon
    vibrate:  [200, 100, 200, 100, 400],
    // Per-order tag so multiple new orders don't overwrite each other.
    tag:      data.tag || ('tasco-' + (orderId || Date.now())),
    renotify: true,
    data:     { url: '/' + targetPage, orderId }
  });
});

// ── NOTIFICATION CLICK HANDLER ───────────────────────────────
// Focus the right page if it's already open (and tell it to refresh),
// otherwise open it fresh.
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/driver.html';
  const orderId   = event.notification.data?.orderId || '';
  const pageMatch = targetUrl.replace(/^\//, '');   // e.g. "driver.html"

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if (client.url.includes(pageMatch) && 'focus' in client) {
        await client.focus();
        // Tell the page to re-render immediately so the new order shows.
        client.postMessage({ type: 'NOTIF_CLICK', orderId });
        return;
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});

// ── INSTALL & ACTIVATE ───────────────────────────────────────
// Take control immediately without waiting for old tabs to close
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', event => { event.waitUntil(clients.claim()); });
self.addEventListener('message',  event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
