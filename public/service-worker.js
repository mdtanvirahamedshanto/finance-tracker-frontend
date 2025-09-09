// Service Worker for Personal Finance Tracker PWA
const CACHE_NAME = 'finance-tracker-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
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

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  // Handle API requests separately
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  // For static assets and navigation requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache if response is not valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If both cache and network fail, return a fallback for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
  );
});

// Handle API requests with network-first strategy and background sync
function handleApiRequest(event) {
  // For API requests, try network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response to store in cache
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try to return from cache
        return caches.match(event.request);
      })
  );
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'sync-budgets') {
    event.waitUntil(syncBudgets());
  } else if (event.tag === 'sync-savings') {
    event.waitUntil(syncSavingsGoals());
  }
});

// Process offline transaction queue
async function syncTransactions() {
  try {
    const db = await openIndexedDB();
    const offlineTransactions = await getOfflineData(db, 'offlineTransactions');
    
    // Process each offline transaction
    for (const transaction of offlineTransactions) {
      try {
        const { action, data, id } = transaction;
        const token = await getAuthToken();
        
        if (!token) {
          console.error('No auth token available for sync');
          return;
        }
        
        let response;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        
        // Handle different CRUD operations
        switch (action) {
          case 'create':
            response = await fetch('https://finance-tracker-backend-livid.vercel.app/api/transactions', {
              method: 'POST',
              headers,
              body: JSON.stringify(data)
            });
            break;
          case 'update':
            response = await fetch(`https://finance-tracker-backend-livid.vercel.app/api/transactions/${data._id}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(data)
            });
            break;
          case 'delete':
            response = await fetch(`https://finance-tracker-backend-livid.vercel.app/api/transactions/${data._id}`, {
              method: 'DELETE',
              headers
            });
            break;
        }
        
        if (response && response.ok) {
          // Remove from offline queue after successful sync
          await removeOfflineData(db, 'offlineTransactions', id);
        }
      } catch (error) {
        console.error('Error syncing transaction:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncTransactions:', error);
  }
}

// Process offline budget queue
async function syncBudgets() {
  try {
    const db = await openIndexedDB();
    const offlineBudgets = await getOfflineData(db, 'offlineBudgets');
    
    // Process each offline budget update
    for (const budget of offlineBudgets) {
      try {
        const { action, data, id } = budget;
        const token = await getAuthToken();
        
        if (!token) {
          console.error('No auth token available for sync');
          return;
        }
        
        let response;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        
        // Handle different CRUD operations
        switch (action) {
          case 'update':
            response = await fetch('https://finance-tracker-backend-livid.vercel.app/api/budget', {
              method: 'POST',
              headers,
              body: JSON.stringify(data)
            });
            break;
          case 'updateBatch':
            response = await fetch('https://finance-tracker-backend-livid.vercel.app/api/budget/batch', {
              method: 'PUT',
              headers,
              body: JSON.stringify({ budgets: data })
            });
            break;
          case 'delete':
            response = await fetch(`https://finance-tracker-backend-livid.vercel.app/api/budget/${data._id}`, {
              method: 'DELETE',
              headers
            });
            break;
        }
        
        if (response && response.ok) {
          // Remove from offline queue after successful sync
          await removeOfflineData(db, 'offlineBudgets', id);
        }
      } catch (error) {
        console.error('Error syncing budget:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncBudgets:', error);
  }
}

// Process offline savings goals queue
async function syncSavingsGoals() {
  try {
    const db = await openIndexedDB();
    const offlineSavingsGoals = await getOfflineData(db, 'offlineSavingsGoals');
    
    // Process each offline savings goal update
    for (const goal of offlineSavingsGoals) {
      try {
        const { data, id } = goal;
        const token = await getAuthToken();
        
        if (!token) {
          console.error('No auth token available for sync');
          return;
        }
        
        const response = await fetch('https://finance-tracker-backend-livid.vercel.app/api/savings-goal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: data.amount })
        });
        
        if (response && response.ok) {
          // Remove from offline queue after successful sync
          await removeOfflineData(db, 'offlineSavingsGoals', id);
        }
      } catch (error) {
        console.error('Error syncing savings goal:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncSavingsGoals:', error);
  }
}

// Helper function to get auth token from storage
async function getAuthToken() {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Helper function to open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    try {
      // Match the version with the one in indexedDB.ts (version 2)
      const request = indexedDB.open('FinanceTrackerDB', 2);
      
      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject('IndexedDB error: ' + (event.target.error ? event.target.error.message : 'unknown'));
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('offlineTransactions')) {
          db.createObjectStore('offlineTransactions', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offlineBudgets')) {
          db.createObjectStore('offlineBudgets', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offlineSavingsGoals')) {
          db.createObjectStore('offlineSavingsGoals', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
    } catch (error) {
      console.error('Error opening IndexedDB:', error);
      reject('Error opening IndexedDB: ' + error.message);
    }
  });
}

// Helper function to get offline data from IndexedDB
function getOfflineData(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        console.error('DB is undefined in getOfflineData');
        return resolve([]);
      }
      
      if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Object store ${storeName} does not exist yet`);
        return resolve([]);
      }
      
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = (event) => {
        console.error(`Error getting offline data from ${storeName}:`, event.target.error);
        reject('Error getting offline data: ' + (event.target.error ? event.target.error.message : 'unknown'));
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result || []);
      };
    } catch (error) {
      console.error(`Error in getOfflineData for ${storeName}:`, error);
      resolve([]);
    }
  });
}

// Helper function to remove offline data from IndexedDB
function removeOfflineData(db, storeName, id) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        console.error('DB is undefined in removeOfflineData');
        return resolve();
      }
      
      if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Object store ${storeName} does not exist yet`);
        return resolve();
      }
      
      if (!id) {
        console.warn(`Attempted to remove item with invalid id: ${id}`);
        return resolve();
      }
      
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onerror = (event) => {
        console.error(`Error removing offline data from ${storeName}:`, event.target.error);
        reject('Error removing offline data: ' + (event.target.error ? event.target.error.message : 'unknown'));
      };
      
      request.onsuccess = (event) => {
        resolve();
      };
    } catch (error) {
      console.error(`Error in removeOfflineData for ${storeName}:`, error);
      resolve();
    }
  });
}