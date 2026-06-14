// Praxis service worker — network-first with offline shell fallback + push notifications.
const CACHE = "praxis-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Praxis", body: event.data.text() };
  }
  const title = payload.title ?? "Praxis";
  const options = {
    body: payload.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    data: { url: payload.url ?? "/app/builds" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/app/builds";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
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
