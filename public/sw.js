// Industrial Control 360 - Complete Service Worker & Offline Sync Engine
const CACHE_NAME = 'ic360-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// 1. Install Event - Pre-cache critical application frame
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core application frame');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event - Purge old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - Stale-while-revalidate for static assets, network-first for navigation
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET requests or browser extension/socket requests
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass service worker cache for direct Firebase / Google Cloud API calls
  if (url.hostname.includes('firestore') || url.hostname.includes('googleapis') || url.hostname.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for SPA navigation route when offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. IndexedDB Queue Processing Helper
async function processOfflineQueueFromIndexedDB() {
  const DB_NAME = 'IC360_FIELD_OFFLINE_DB';
  const STORE_NAME = 'pending_field_operations';

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => resolve({ synced: 0, failed: 0 });
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        return resolve({ synced: 0, failed: 0 });
      }

      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getAllReq = store.getAll();

      getAllReq.onsuccess = async () => {
        const items = getAllReq.result || [];
        console.log(`[Service Worker] Found ${items.length} pending items in IndexedDB queue.`);

        // Notify active window clients to trigger Firestore queue flush
        const clientList = await self.clients.matchAll({ type: 'window' });
        for (const client of clientList) {
          client.postMessage({
            type: 'IC360_TRIGGER_SYNC',
            pendingCount: items.length,
            timestamp: Date.now()
          });
        }
        resolve({ synced: items.length, failed: 0 });
      };
      getAllReq.onerror = () => resolve({ synced: 0, failed: 0 });
    };
  });
}

// 5. Background Sync Event - Triggered when connectivity is re-established
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-field-reports' || event.tag === 'sync-offline-queue') {
    console.log('[Service Worker] Background Sync event fired:', event.tag);
    event.waitUntil(processOfflineQueueFromIndexedDB());
  }
});

// 6. Message Listener - Allows client windows to manually trigger SW sync
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FLUSH_OFFLINE_QUEUE') {
    event.waitUntil(processOfflineQueueFromIndexedDB());
  }
});
