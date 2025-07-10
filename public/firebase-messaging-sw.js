
// Scripts de Firebase importados para que el Service Worker funcione de forma autónoma.
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

// --- CONFIGURACIÓN DE TU PROYECTO DE FIREBASE ---
// Estos datos deben coincidir exactamente con los de tu archivo src/lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  authDomain: "wikistars5-2yctr.firebaseapp.com",
  projectId: "wikistars5-2yctr",
  storageBucket: "wikistars5-2yctr.appspot.com",
  messagingSenderId: "939359993461",
  appId: "1:939359993461:web:c8aab67046db949495823c",
};

// Inicializamos la app de Firebase DENTRO del Service Worker. Este es el paso clave.
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Este manejador se activa cuando la app está en segundo plano o cerrada
// y recibe una notificación push.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  if (!payload.notification) {
    return;
  }
  
  const notificationTitle = payload.notification.title || "Nueva Notificación";
  const notificationOptions = {
    body: payload.notification.body || "",
    icon: payload.notification.icon || "/icons/icon-192x192.png", // Un ícono de fallback
    data: {
      url: payload.fcmOptions?.link || payload.data?.link || '/', // URL a abrir al hacer clic
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Este manejador se activa cuando el usuario hace clic en la notificación.
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);

  event.notification.close();

  const urlToOpen = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Si ya hay una ventana de la app abierta, la enfoca.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abre una nueva ventana.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

