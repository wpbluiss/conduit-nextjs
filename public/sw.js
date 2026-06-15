// Praxis service worker — caches STATIC ASSETS only. It deliberately does NOT
// intercept page navigations (HTML): the browser always loads the app shell fresh
// from the network, so a stale/partial cached shell can never break /app. Every
// respondWith path returns a real Response (never undefined) to avoid the
// "Failed to convert value to 'Response'" navigation failures.
const CACHE = "praxis-static-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  // NEVER intercept navigations (HTML) — let the browser hit the network so the
  // app shell is always fresh. This is what was breaking /app.
  if (req.mode === "navigate") return;

  const { pathname } = new URL(req.url);
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/")) return;

  // Only handle cacheable static assets.
  const cacheable =
    req.destination === "script" ||
    req.destination === "style" ||
    req.destination === "image" ||
    req.destination === "font";
  if (!cacheable) return;

  // Network-first; on failure fall back to cache, and ALWAYS resolve to a real
  // Response (Response.error() if nothing cached) — never undefined.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || Response.error()),
      ),
  );
});
