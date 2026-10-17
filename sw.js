// Super Pixel Bros service worker: precache the app shell for offline play.
// Strategy: navigation = network-first (updates land online, offline falls
// back to cached shell); static assets = cache-first (versioned by bumping
// VERSION below — always bump it when any precached file changes).
// Not registered on localhost (see main.js) so it never hides dev changes.

const VERSION = 'spb-v2';
const CACHE = VERSION + '-shell';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/main.js',
  './js/game.js',
  './js/input.js',
  './js/touchui.js',
  './js/view.js',
  './js/levels.js',
  './js/entities.js',
  './js/renderer.js',
  './js/sprites.js',
  './js/theme.js',
  './js/ui.js',
  './js/audio.js',
  './js/i18n.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('spb-v') && k !== CACHE).map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html')),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req)),
  );
});
