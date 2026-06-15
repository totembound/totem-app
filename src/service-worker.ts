/// <reference types="vite/client" />
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { createHandlerBoundToURL } from 'workbox-precaching';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Workbox will inject the manifest of assets to precache
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache totem images from the IPFS gateway. CIDs are content-addressed
// (immutable), so CacheFirst is safe — once fetched, serve from cache and
// never hit the CDN again. Keeps totem images instant across navigation.
registerRoute(
  ({ url }) => url.hostname === 'ipfs.totembound.com',
  new CacheFirst({
    cacheName: 'totem-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// SPA navigation: serve index.html for all routes EXCEPT /docs
const navigationRoute = new NavigationRoute(
  createHandlerBoundToURL('/index.html'),
  { denylist: [/^\/docs/] }
);
registerRoute(navigationRoute);

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