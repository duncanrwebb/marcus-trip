/* The app that lived here has moved to https://cambodia.duncanrwebb.com/.
   This replaces its service worker so phones that installed it stop showing
   the saved copy: it clears every cache, removes itself, and reloads any open
   window, which then gets the "moved" page. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));
