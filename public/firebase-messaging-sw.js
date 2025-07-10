// This file MUST be in the public folder.

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

// onBackgroundMessage is the entry point for notifications when the app is in the background or closed.
onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);

    // We now read the notification details from the `data` payload.
    // This provides a consistent way to handle notifications.
    const notificationTitle = payload.data.title;
    const notificationOptions = {
        body: payload.data.body,
        icon: payload.data.icon,
        // The data object here is passed to the 'notificationclick' event
        data: {
            url: payload.data.url 
        }
    };

    // The `self.registration.showNotification` is what actually displays the notification on the user's device.
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// This event is triggered when the user clicks on the notification.
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.', event);

    event.notification.close(); // Close the notification

    const urlToOpen = event.notification.data.url;

    // This is the code that opens the correct URL when the notification is clicked.
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the same URL.
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
