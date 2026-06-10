// Cadence service worker — minimal, network-first with offline fallback.
const CACHE = "cadence-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        // cache successful navigations / static assets for offline
        const copy = res.clone();
        if (res.ok && (req.mode === "navigate" || req.destination === "script" || req.destination === "style")) {
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match("/finance"))),
  );
});
