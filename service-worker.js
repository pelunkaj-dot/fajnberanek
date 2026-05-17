const CACHE_NAME = "fajnberanek-v6";

const APP_SHELL = [
  "./",
  "./index.html",

  "./css/base.css",
  "./css/layout.css",
  "./css/components.css",

  "./js/app.js",
  "./js/storage.js",
  "./js/modules/mini-stories/mini-stories.js",
  "./js/modules/mini-stories/mini-stories.css",
  "./js/modules/cards/cards.js",
  "./js/modules/cards/cards.css",
  "./js/modules/find-scene/find-scene.js",
  "./js/modules/find-scene/find-scene.css",
  "./js/modules/puzzle/puzzle.js",
  "./js/modules/puzzle/puzzle.css",

  "./data/stories.json",
  "./data/modules.json",

  "./data/mini-stories/noe.json",
  "./data/cards/noe.json",
  "./data/find-scene/noe.json",
  "./data/puzzle/noe.json",

  "./data/mini-stories/jonas.json",
  "./data/cards/jonas.json",
  "./data/find-scene/jonas.json",
  "./data/puzzle/jonas.json",

  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => networkResponse)
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});
