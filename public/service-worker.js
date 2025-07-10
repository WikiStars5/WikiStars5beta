// This file is required by next-pwa to be the source of the service worker.
// We will import our custom Firebase messaging worker from here.

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

// This will be replaced by next-pwa with the list of files to precache.
precacheAndRoute(self.__WB_MANIFEST);

// Import the Firebase messaging service worker script
// This is the key part of the solution.
try {
  importScripts('./firebase-messaging-sw.js');
} catch (e) {
  console.error('Failed to import firebase-messaging-sw.js', e);
}

// Example of caching strategy for API calls or other resources
registerRoute(
  ({ url }) => url.origin === 'https://some-api.com',
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);
