const VERSION = "denim-v2";
const SHELL = ["/", "/manifest.webmanifest", "/denim-logo.png", "/icon-192.png", "/favicon-32.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // manifest: always try the network first so a new app name/icon is picked up
  if (url.pathname === "/manifest.webmanifest") {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  // pages: network first, fall back to cached shell when offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/")));
    return;
  }
  // assets: stale-while-revalidate
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req);
      const fresh = fetch(req)
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});

// push notification sent by the notify-admin function
self.addEventListener("push", (e) => {
  let d = { title: "New shop visit request", body: "", url: "/#/admin", tag: "denim-visit" };
  try { d = { ...d, ...e.data.json() }; } catch (err) { /* keep defaults */ }
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body, icon: "/icon-192.png", badge: "/favicon-32.png",
      tag: d.tag, renotify: true, data: { url: d.url },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/#/admin";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
      return self.clients.openWindow(url);
    })
  );
});
