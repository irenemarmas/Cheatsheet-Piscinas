/**
 * sw.js — Service Worker for Cheatsheet Piscinas SOP
 *
 * Strategy: Cache-first for all precached assets.
 * Update flow: new SW installs in background → notifies app → user clicks "Actualizar".
 *
 * INCREMENT CACHE_VERSION when deploying a new version.
 */

const CACHE_VERSION = 'v3';
const CACHE_NAME    = `piscinas-sop-${CACHE_VERSION}`;

// All assets to precache on install (relative to sw.js location = project root)
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/tokens.css',
  './styles/main.css',
  './styles/print.css',
  './src/app.js',
  './src/data.js',
  './src/search.js',
  './src/calculator.js',
  './src/render.js',
  './src/drawer.js',
  './src/sw-register.js',
  './data/fichas.json',
  './data/arboles.json',
  './data/categorias.json',
  './data/prioridades.json',
  './data/calculos.json',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png',
];

// ── Install: precache everything ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // activate immediately if told to
  );
});

// Allow app to trigger skipWaiting via postMessage
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('piscinas-sop-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, network fallback ──────────────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin or relative URLs
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Skip non-http(s) schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache the response
      return fetch(event.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline and not cached — return the app shell as fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
