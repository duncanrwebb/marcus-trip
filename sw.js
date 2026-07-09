// Service worker for the Expedition Tracker
// Strategy:
//  - The app page itself (index.html / navigation requests) is NETWORK-FIRST: always try to
//    fetch the latest version first, only falling back to the cached copy if there's no signal.
//    This is what makes "push an update to GitHub" actually show up without a hard refresh.
//  - Everything else (map tiles, fonts, photos, the Leaflet library) is CACHE-FIRST: once seen,
//    it's reused instantly and works offline, since that content doesn't change.
const CACHE = "expedition-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"])).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // never cache the live weather feed
  if (url.hostname.includes("open-meteo.com")) return;

  // the page itself: network-first, so updates show up immediately when online
  const isPageRequest = e.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");
  if (isPageRequest) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(()=>{});
          }
          return res;
        })
        .catch(() => caches.match(e.request)) // offline: fall back to last-seen version
    );
    return;
  }

  // everything else (tiles, fonts, photos, libraries): cache-first, since it doesn't change
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && (res.type === "basic" || res.type === "cors")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(()=>{});
          }
          return res;
        })
        .catch(() => hit); // offline and not cached: nothing we can do
    })
  );
});
