/// <reference types="vite/client" />
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Workbox will inject the manifest of assets to precache
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Handle push notifications (if needed later)
self.addEventListener('push', (event: any) => {
  if (event.data) {
    const data = event.data.json();

    self.registration.showNotification('TotemBound', {
      body: data.message,
      icon: '/tb-logo-180.png',
      badge: '/favicon.ico',
      data: data
    });
  }
});

self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow('/')
  );
});