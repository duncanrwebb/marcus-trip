// Service worker for Marcus's Expedition Tracker
// Caches the app shell on install, then caches map tiles / fonts / photos as they're viewed,
// so previously-seen content keeps working with poor or no signal.
const CACHE = "expedition-v1";

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
  // cache-first for everything else (app shell, OSM tiles, Google fonts, place photos, Leaflet CDN)
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
