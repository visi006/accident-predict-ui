const CACHE_NAME = 'accipredict-v2';
const ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './style.css',
  './script.js',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', event => {
  // Force new SW to activate immediately without waiting
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(ASSETS.map(asset => cache.add(asset)));
    })
  );
});

// Delete ALL old caches when new SW activates
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
