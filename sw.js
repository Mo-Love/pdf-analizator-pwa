// Простий service worker: precache + runtime cache для API/моделі
const CACHE_NAME = 'pdf-analizator-v1';
const RUNTIME = 'runtime-cache-v1';


const PRECACHE_URLS = [
'/',
'/index.html',
'/styles.css',
'/app.js',
'/manifest.json',
'/icons/icon-192.png',
'/icons/icon-512.png'
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
// Стратегія: кеш-перший для стат
