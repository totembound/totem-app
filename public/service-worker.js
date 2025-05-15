// This is the service worker for TotemBound PWA
const CACHE_NAME = 'totembound-cache-v1';
const VERSION = '0.0.1';

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/totembound.png',
  '/tb-logo-180.png',
  '/tb-logo-540.png',
  // Add other critical assets here
];

// CDN URL patterns to cache
const CDN_CACHE_PATTERNS = [
  /\.json$/,  // JSON files
  /\.(png|jpg|jpeg|gif|svg|webp)$/,  // Images
  /\.(woff|woff2|ttf|otf)$/  // Fonts if needed
];

const EXCLUDE_PATTERNS = [
  /\.mp3$/,  // MP3 files
];

// Install event: cache precache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== CACHE_NAME;
          }).map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper to check if URL should be cached based on patterns
function shouldCacheUrl(url) {
  const urlObj = new URL(url);
  const excludesPattern = EXCLUDE_PATTERNS.some(pattern => pattern.test(urlObj.pathname));

  if (url?.includes('news/') || excludesPattern) {
    return false;
  }

  // Always cache localhost assets in development
  if (urlObj.hostname.includes('localhost')) {
    return true;
  }

  if (urlObj.hostname.includes('ipfs')) {
    return true;
  }

  // Check if it's a CDN URL (you may need to adjust this based on your actual CDN domains)
  const isCdnUrl = urlObj.hostname.includes('cdn') || 
                    urlObj.hostname.includes('assets') ||
                    urlObj.hostname.includes('static');

  // Check if file extension matches our patterns
  const matchesPattern = CDN_CACHE_PATTERNS.some(pattern => pattern.test(urlObj.pathname));
  
  return isCdnUrl && matchesPattern;
}

// Fetch event: implement caching strategy
self.addEventListener('fetch', event => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle CDN resources (JSON files and images)
  if (shouldCacheUrl(event.request.url)) {
    event.respondWith(
      // Try network first, then cache (but update cache in background)
      fetch(event.request)
        .then(response => {
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          // Cache the fresh response
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For other assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network and cache
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// Handle push notifications (if needed later)
self.addEventListener('push', event => {
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/')
  );
});
