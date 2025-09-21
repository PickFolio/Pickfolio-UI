// A basic service worker for PWA functionality.
// This allows the app to be "installed" on a user's home screen.
// For the MVP, it doesn't need complex caching logic.

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
  // For the MVP, we will just fetch from the network.
  // In a production app, you would add caching strategies here.
  event.respondWith(fetch(event.request));
});
