// Service worker — КИНОТЕКА
// HTML: network-first (всегда свежая версия, кэш — только офлайн-фолбэк)
// постеры/иконки/статика: cache-first с дозаписью
const CACHE = "kinoteka-v2";
const CORE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // network-first: свежий index.html, при офлайне — из кэша
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match("./index.html")))
    );
    return;
  }
  // остальное — cache-first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }))
  );
});
