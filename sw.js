// Service Worker for offline support
const CACHE_NAME = 'derivpro-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/dashboard.html',
    '/style.css',
    '/dashboard.css',
    '/config.js',
    '/auth.js',
    '/trading.js',
    '/charts.js',
    '/indicators.js',
    '/backtesting.js',
    '/social-trading.js',
    '/risk-manager.js',
    '/alerts.js',
    '/analytics.js',
    '/script.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
