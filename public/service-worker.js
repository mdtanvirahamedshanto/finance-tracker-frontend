// Service Worker for Personal Finance Tracker PWA - Online Only Mode
const CACHE_NAME = 'finance-tracker-v3-online';

// Assets to cache on install - minimal for faster loading
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg'
];

// Install event - cache only essential static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - minimal caching for essential assets only
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  // For API requests, always go to network
  if (event.request.url.includes('/api/')) {
    return; // Let browser handle API requests normally
  }

  // For static assets, use cache-first for faster loading of essential assets
  const isStaticAsset = STATIC_ASSETS.some(asset => 
    event.request.url.endsWith(asset) || 
    event.request.url.includes(asset)
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
  // For all other requests, go to network
});

// No longer handling API requests with offline caching
// Background sync is disabled in online-only mode

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// Online-only mode - no offline sync functions needed
// These functions have been removed as part of disabling offline support:
// - syncTransactions
// - syncBudgets
// - syncSavingsGoals
// - getAuthToken
// - openIndexedDB
// - getOfflineData
// - removeOfflineData