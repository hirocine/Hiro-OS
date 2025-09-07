// Custom Service Worker for Hiro Inventory
const CACHE_NAME = 'hiro-inventory-v1';
const API_CACHE = 'hiro-api-cache-v1';
const CRITICAL_RESOURCES = [
  '/',
  '/auth',
  '/equipment',
  '/projects',
  '/manifest.json'
];

// Background Sync Tags
const SYNC_TAGS = {
  EQUIPMENT_SYNC: 'equipment-sync',
  PROJECT_SYNC: 'project-sync',
  OFFLINE_FORMS: 'offline-forms'
};

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Intelligent Caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Supabase API requests
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(handleSupabaseRequest(request));
    return;
  }

  // Handle static resources
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.EQUIPMENT_SYNC:
      event.waitUntil(syncEquipmentData());
      break;
    case SYNC_TAGS.PROJECT_SYNC:
      event.waitUntil(syncProjectData());
      break;
    case SYNC_TAGS.OFFLINE_FORMS:
      event.waitUntil(syncOfflineForms());
      break;
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: 'Nova atualização disponível',
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/pwa-192x192.png'
      }
    ]
  };

  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.title = payload.title || 'Hiro Inventory';
  }

  event.waitUntil(
    self.registration.showNotification('Hiro Inventory', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Helper Functions
async function handleSupabaseRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first for API requests
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache for critical data
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Notify client about offline mode
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'OFFLINE_DATA',
            data: { endpoint: request.url }
          });
        });
      });
      return cachedResponse;
    }
    
    // Store failed requests for sync
    if (request.method !== 'GET') {
      await storeFailedRequest(request);
    }
    
    throw error;
  }
}

async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline-enhanced.html');
    }
    throw error;
  }
}

async function storeFailedRequest(request) {
  const db = await openDB();
  const transaction = db.transaction(['pending_requests'], 'readwrite');
  const store = transaction.objectStore('pending_requests');
  
  const requestData = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: await request.text(),
    timestamp: Date.now()
  };
  
  await store.add(requestData);
}

async function syncEquipmentData() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pending_requests'], 'readonly');
    const store = transaction.objectStore('pending_requests');
    const requests = await store.getAll();
    
    for (const requestData of requests) {
      if (requestData.url.includes('equipment')) {
        await retryRequest(requestData);
        await store.delete(requestData.id);
      }
    }
    
    // Notify successful sync
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: { type: 'equipment' }
        });
      });
    });
  } catch (error) {
    console.error('Equipment sync failed:', error);
  }
}

async function syncProjectData() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['pending_requests'], 'readonly');
    const store = transaction.objectStore('pending_requests');
    const requests = await store.getAll();
    
    for (const requestData of requests) {
      if (requestData.url.includes('projects')) {
        await retryRequest(requestData);
        await store.delete(requestData.id);
      }
    }
    
    // Notify successful sync
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: { type: 'projects' }
        });
      });
    });
  } catch (error) {
    console.error('Project sync failed:', error);
  }
}

async function syncOfflineForms() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offline_forms'], 'readonly');
    const store = transaction.objectStore('offline_forms');
    const forms = await store.getAll();
    
    for (const formData of forms) {
      await submitOfflineForm(formData);
      await store.delete(formData.id);
    }
    
    // Notify successful sync
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          data: { type: 'forms' }
        });
      });
    });
  } catch (error) {
    console.error('Form sync failed:', error);
  }
}

async function retryRequest(requestData) {
  const response = await fetch(requestData.url, {
    method: requestData.method,
    headers: new Headers(requestData.headers),
    body: requestData.body || undefined
  });
  
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  
  return response;
}

async function submitOfflineForm(formData) {
  const response = await fetch(formData.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData.data)
  });
  
  if (!response.ok) {
    throw new Error(`Form submission failed: ${response.status}`);
  }
  
  return response;
}

// IndexedDB Helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HiroInventoryDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending_requests')) {
        const store = db.createObjectStore('pending_requests', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('offline_forms')) {
        const store = db.createObjectStore('offline_forms', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('cached_data')) {
        const store = db.createObjectStore('cached_data', { keyPath: 'key' });
        store.createIndex('expiry', 'expiry');
      }
    };
  });
}