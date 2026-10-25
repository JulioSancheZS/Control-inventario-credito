// Service Worker simple para habilitar PWA instalable
const CACHE_NAME = "crediventas-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Para datos financieros y la app en tiempo real, dejamos pasar las peticiones
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
