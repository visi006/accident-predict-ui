const CACHE_NAME = 'accipredict-v1';
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
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Adding assets to cache, catch and ignore individual failures to prevent strict aborts
      return Promise.allSettled(ASSETS.map(asset => cache.add(asset)));
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
