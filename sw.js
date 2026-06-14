const CACHE = "fiz-iptv-v2";
const ASSETS = [
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Only handle same-origin requests; pass through external (CDN, streams, M3U on GitHub)
  if (!e.request.url.startsWith(self.location.origin)) return;

  // Network-first for HTML/manifest so updates show on next launch
  if (e.request.mode === "navigate" || e.request.url.endsWith(".html") || e.request.url.endsWith("manifest.json")) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for other same-origin assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
