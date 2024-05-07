// Define the cache name, including versioning to manage updates
const CACHE_NAME = "video-cache-v1";

// List of URLs to cache for offline usage
const ASSETS = [
  "/offline.html", // An offline fallback page
  "/fallback.mp4", // Fallback video content
];

// On install, cache necessary assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Activate worker immediately without waiting for next reload
});

// On activation, clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Intercept fetch requests to handle videos and other assets
self.addEventListener("fetch", (event) => {
  if (event.request.url.endsWith(".mp4")) {
    // Apply a network-first strategy for video files
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached video if offline or network failure occurs
          return caches.match(event.request).then((response) => {
            return response || caches.match("/fallback.mp4"); // Ensure a fallback video is provided
          });
        })
    );
  } else {
    // For non-video requests, just try to fetch from the network and fall back to offline.html if offline
    event.respondWith(fetch(event.request));
  }
});
