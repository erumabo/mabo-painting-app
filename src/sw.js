const cacheName = "painter-v1";
const contentToCache = [
  "index.html",
  "manifest.json",
  "icons/icon.png",
  "style.css",
  "main.js",
  "./src/sw.js",
  "./src/layer.js",
  "./components/layerControl/layerControl.js",
  "./libs/jszip.min.js",
  "./libs/contact.js",
  ];

console.log(contentToCache);

self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching all: app shell and content");
      await cache.addAll(contentToCache);
    })()
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        return r;
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })()
  );
});