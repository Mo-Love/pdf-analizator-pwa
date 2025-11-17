// sw.js
const CACHE_NAME = 'pdf-analizator-v2';
const RUNTIME = 'runtime-cache-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './install.html'
  // додай іконки якщо є: './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== RUNTIME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Кеш-перший для статичних ресурсів разом із fallback
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          // кешуємо HTML/JS/CSS у runtime cache
          return caches.open(RUNTIME).then(cache => { cache.put(req, res.clone()); return res; });
        }).catch(()=> caches.match('./index.html'));
      })
    );
    return;
  }

  // для зовнішніх запитів — мережа з кеш-фолбеком
  event.respondWith(
    fetch(req).then(res => {
      return caches.open(RUNTIME).then(cache => { cache.put(req, res.clone()); return res; });
    }).catch(()=> caches.match(req))
  );
});
