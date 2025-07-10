// Import the Firebase app and messaging services
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  authDomain: "wikistars5-2yctr.firebaseapp.com",
  projectId: "wikistars5-2yctr",
  storageBucket: "wikistars5-2yctr.appspot.com",
  messagingSenderId: "939359993461",
  appId: "1:939359993461:web:c8aab67046db949495823c",
  measurementId: "G-XCFCPXNP56"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// onBackgroundMessage is used for handling the notification data when the app is in the background.
// We use this to show the notification to the user.
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Extract notification data from the payload.
  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Has recibido una nueva notificación.',
    icon: payload.notification?.icon || '/logo.png', // Fallback icon
    // It's common to pass a URL to open when the notification is clicked.
    // The backend function is configured to send this in `webpush.fcm_options.link`.
    data: {
      url: payload.fcmOptions?.link || '/'
    }
  };

  // The main function to display the notification.
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Add an event listener for notification clicks.
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);

  event.notification.close();

  // This opens the app to the URL specified in the notification data.
  const urlToOpen = event.notification.data.url;
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
