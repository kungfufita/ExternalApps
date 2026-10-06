/* Mindsight service worker — offline-first app shell.
   Shell files are served from cache immediately, then refreshed from the
   network in the background (stale-while-revalidate), so installed users
   pick up new deploys on their next visit. */
const CACHE = "mindsight-v2";
const SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request);
      const refresh = fetch(e.request).then((res) => {
        // Only store good responses so a transient 404/500 is never served forever.
        if (res.ok) e.waitUntil(cache.put(e.request, res.clone()));
        return res;
      });
      if (hit) { refresh.catch(() => {}); return hit; }
      try { return await refresh; }
      catch (err) {
        // Offline and uncached: only navigations fall back to the app shell.
        if (e.request.mode === "navigate") { const shell = await cache.match("./index.html"); if (shell) return shell; }
        throw err;
      }
    })
  );
});
