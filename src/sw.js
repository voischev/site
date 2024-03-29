const CACHE = 'v1';
const CACHES_PATH = [
    '/',
    '/timer.html',
    '/timer.js',
    '/genpass.html',
    '/style.css',
    '/avatar.jpg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CACHES_PATH)));
});

self.addEventListener('fetch', (event) => {
    event.respondWith(networkOrCache(event.request));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key === CACHE) { return; }
            return caches.delete(key);
        }))
    }));
});

async function networkOrCache(request) {
    let isCache = false;
    const response = await fetch(request).catch(() => (isCache = true, caches.match(request)));
    if (response && response.ok && isCache === false) {
        if (CACHES_PATH.includes(request)) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
        }
    }
    return response;
}
