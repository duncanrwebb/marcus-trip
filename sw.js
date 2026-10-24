/* The app that lived here is now at /expedition-tracker/ on this same site.
   This replaces its service worker so phones that installed it stop showing
   the saved copy: it clears the old app's caches, removes itself, and reloads
   any open window, which then goes on to the new address.

   Caches belong to the whole site, not this folder, so the new app's
   ("expedition-v2-…", "trip-map-v1") are left alone. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys())
    if (!k.startsWith("expedition-v2") && k !== "trip-map-v1") await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));
