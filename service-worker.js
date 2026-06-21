const CACHE_NAME = "fever-tracker-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./bundle.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache calls to the Google Apps Script sync endpoint — always go to network
  if (url.hostname.includes("script.google.com") || url.hostname.includes("script.googleusercontent.com")) {
    return; // let the browser handle it normally (network)
  }

  // Cache-first for same-origin app shell assets; network fallback for everything else
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            return res;
          }).catch(() => cached)
        );
      })
    );
  }
});
