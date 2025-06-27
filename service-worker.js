// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/service-worker.js').then((registration) => {
        navigator.serviceWorker.register('/gtc-impulse-app-dev/service-worker.js').then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        }, (err) => {
            console.error('Service Worker registration failed:', err);
        });
    })
}


// Install event to cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('gtc-impulse-v1').then((cache) => {
            return cache.addAll([
                // '/',
                // '/index.html',
                '/pages/login.html',
                '/splash.html',
                '/index.css',
                '/styles/login.css',
                '/offline.html',
                '/splash.css',
                '/splash.js',
                // '/manifest.json',
                '/assets/icon.png'
            ]).catch((error) => {
                console.error('Cache addAll failed:', error);
                // Fallback to cache only guaranteed files
                return cache.addAll([
                    // '/',
                    // '/index.html',
                    '/pages/login.html',
                    '/index.css',
                    '/styles/login.css',
                    'offline.html',
                    // '/manifest.json'
                ]);
            }).then(() => self.skipWaiting());
        })
    );
});

// Activate event to clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => cacheName !== 'gtc-impulse-v1')
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});

// Fetch event to handle offline fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
                return new Response('Offline', { status: 503 });
            });
        })
    );
});