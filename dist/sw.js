/**
 * Ultimate Weight Loss & Fitness Tracker
 * Service Worker — offline-first app shell cache.
 *
 * Strategy:
 * - Install: precache core shell files (index.html, manifest, logo).
 * - Fetch:
 *   • Navigation/HTML requests → network first, fallback to cached index.html (SPA routing).
 *   • Static assets (/assets/*, fonts, icons) → cache first, then network.
 *   • Everything else → network first.
 */

const CACHE_NAME = 'uwlt-v1';
const SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo.svg',
];

// Install — precache the shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_URLS).catch((err) => {
        console.warn('[SW] Precaching partially failed', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isAsset = url.pathname.startsWith('/ultimate-weight-loss-tracker/assets/') ||
    url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  const isNavigation = request.mode === 'navigate' || request.destination === 'document';

  if (isNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Notify clients of update
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
