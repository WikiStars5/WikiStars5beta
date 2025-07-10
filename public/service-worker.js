// DO NOT USE "import" or "export" statements in this file.
// This file is a service worker, and it does not support ES modules.

// Import the Firebase SDK scripts.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker with your project's config.
const firebaseConfig = {
  apiKey: "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  authDomain: "wikistars5-2yctr.firebaseapp.com",
  projectId: "wikistars5-2yctr",
  storageBucket: "wikistars5-2yctr.appspot.com",
  messagingSenderId: "939359993461",
  appId: "1:939359993461:web:c8aab67046db949495823c",
  measurementId: "G-XCFCPXNP56"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// If you want to handle notifications in the background, you can add a handler here.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[service-worker.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/logo-192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Import the next-pwa generated service worker to handle caching and other PWA features.
// This MUST come after the Firebase initialization.
importScripts('/sw.js');
