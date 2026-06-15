// Praxis service worker — network-first with offline shell fallback.
// CACHE name is stamped with the Next.js BUILD_ID at build time so that
// each deploy gets a fresh cache key and old caches are purged on activate.
const CACHE = "praxis-8HW3ziyT4UzrnoLgOM6DC";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  // Purge every cache that isn't the current build's cache.
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  const { pathname } = new URL(req.url);
  // Never intercept auth callbacks or API routes — always hit the network.
  if (pathname.startsWith("/auth/callback") || pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (
          res.ok &&
          (req.mode === "navigate" ||
            req.destination === "script" ||
            req.destination === "style")
        ) {
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then((cached) => cached || caches.match("/app/workspace")),
      ),
  );
});
