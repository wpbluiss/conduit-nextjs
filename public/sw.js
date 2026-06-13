// Praxis service worker — network-first with offline shell fallback.
const CACHE = "praxis-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

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
