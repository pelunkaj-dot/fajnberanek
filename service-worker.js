const CACHE_NAME = "fajnberanek-v21";

const APP_SHELL = [
  "./",
  "./index.html",

  "./css/base.css?v=21",
  "./css/layout.css?v=21",
  "./css/components.css?v=21",

  "./js/app.js?v=21",
  "./js/storage.js",
  "./js/rewards.js",
  "./js/modules/mini-stories/mini-stories.js",
  "./js/modules/mini-stories/mini-stories.css?v=21",
  "./js/modules/cards/cards.js",
  "./js/modules/cards/cards.css?v=21",
  "./js/modules/find-scene/find-scene.js",
  "./js/modules/find-scene/find-scene.css?v=21",
  "./js/modules/puzzle/puzzle.js",
  "./js/modules/puzzle/puzzle.css?v=21",
  "./js/modules/collection/collection.js",
  "./js/modules/collection/collection.css?v=21",
  "./js/modules/coloring/coloring.js",
  "./js/modules/coloring/coloring.css?v=21",

  "./data/stories.json",
  "./data/modules.json",

  "./data/mini-stories/noe.json",
  "./data/cards/noe.json",
  "./data/find-scene/noe.json",
  "./data/puzzle/noe.json",
  "./data/coloring/noe.json",

  "./data/mini-stories/jonas.json",
  "./data/cards/jonas.json",
  "./data/find-scene/jonas.json",
  "./data/puzzle/jonas.json",
  "./data/coloring/jonas.json",

  "./data/mini-stories/dobry-pastyr.json",
  "./data/cards/dobry-pastyr.json",
  "./data/find-scene/dobry-pastyr.json",
  "./data/puzzle/dobry-pastyr.json",
  "./data/coloring/dobry-pastyr.json",

  "./data/mini-stories/jezis-a-deti.json",
  "./data/cards/jezis-a-deti.json",
  "./data/find-scene/jezis-a-deti.json",
  "./data/puzzle/jezis-a-deti.json",
  "./data/coloring/jezis-a-deti.json",

  "./data/mini-stories/david.json",
  "./data/cards/david.json",
  "./data/find-scene/david.json",
  "./data/puzzle/david.json",
  "./data/coloring/david.json",

  "./manifest.webmanifest?v=21"
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

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isVersioned = url.searchParams.has("v");

  if (isVersioned) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
