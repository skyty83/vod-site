self.addEventListener('install', (event) => {
  console.log('Service worker installed');
});

self.addEventListener('fetch', (event) => {
  // Empty fetch handler to satisfy PWA installability requirements
});
