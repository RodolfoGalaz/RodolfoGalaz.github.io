const CACHE_NAME = 'alquimista-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/script.js',
    '/images/bg.png',
    '/images/edward-dance.gif',
    '/images/ouroboros-icon.png',
    '/images/icon-192.png',
    '/images/icon-512.png',
    'https://unpkg.com/dexie@3/dist/dexie.js',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Lato:wght@300;400&display=swap'
];

// Instalar el Service Worker y cachear los archivos principales
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar las peticiones de red
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si encontramos una coincidencia en el cache, la devolvemos
                if (response) {
                    return response;
                }
                // Si no, intentamos obtenerla de la red
                return fetch(event.request);
            })
    );
});
