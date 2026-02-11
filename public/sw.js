const CACHE_NAME = 'vehiclemanager-v2';
const STATIC_CACHE = 'static-v2';

// App shell - risorse essenziali
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico'
];

// Installazione - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache app shell:', error);
      })
  );
});

// Attivazione - pulizia cache vecchie
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Strategia fetch: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignora richieste a Chrome extensions o altri protocolli
  if (url.origin !== self.location.origin && !url.protocol.startsWith('http')) {
    return;
  }

  // Per risorse statiche (JS, CSS, immagini) - Cache First con aggiornamento in background
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Se in cache, restituisci e aggiorna in background
        if (cachedResponse) {
          // Aggiorna cache in background (stale-while-revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          }).catch(() => {
            // Network fallito, usa solo cache
          });
          return cachedResponse;
        }

        // Non in cache, prova network
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fallback per immagini mancanti
          if (request.destination === 'image') {
            return caches.match('/icons/icon-192.png');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
    return;
  }

  // Per navigazione (HTML) - Network First con fallback a cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline - prova cache, altrimenti index.html
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/index.html').then((indexResponse) => {
              return indexResponse || caches.match('/');
            });
          });
        })
    );
    return;
  }

  // Per API e altre richieste - Network con Cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache solo risposte valide GET
        if (request.method === 'GET' && networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Nessuna risposta disponibile
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
  );
});

// Gestione messaggi dal client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Gestione errori
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
});
