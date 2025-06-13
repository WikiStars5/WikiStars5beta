// src/lib/firebase.ts

// Importa las funciones básicas para inicializar la aplicación de Firebase
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

// Importa los SDK específicos para los servicios que vas a usar:
// getStorage para Firebase Storage (almacenamiento de archivos como imágenes)
import { getStorage, type FirebaseStorage } from "firebase/storage";
// getFirestore para Cloud Firestore (tu base de datos para perfiles de famosos, valoraciones, etc.)
import { getFirestore, type Firestore } from "firebase/firestore";
// getAuth para Firebase Authentication (gestión de usuarios y sus sesiones)
import { getAuth, type Auth } from "firebase/auth";

// Tu configuración de Firebase para la aplicación web.
// ¡MUY IMPORTANTE! Asegúrate de que estos valores coincidan EXACTAMENTE
// con los que obtuviste de la Consola de Firebase en la sección
// "Configuración del proyecto" -> "Tus apps" -> selecciona tu app web.
const firebaseConfig = {
  apiKey: "AIzaSyDQZFS-ffz8TQd3JAGvZAbKzHRPBMBtdwU", // Tu clave API única
  authDomain: "wikistars5.firebaseapp.com",      // Tu dominio de autenticación
  projectId: "wikistars5",                      // Tu ID de proyecto

  // ¡ATENCIÓN ESPECIAL A ESTA LÍNEA (storageBucket)!
  // A menudo, el storageBucket termina en '.appspot.com' (ej. 'tu-id.appspot.com').
  // Verifica la URL exacta de tu bucket en la Consola de Firebase -> Storage -> pestaña 'Archivos'.
  // Si dice 'gs://wikistars5.appspot.com', entonces el valor aquí debería ser "wikistars5.appspot.com"
  storageBucket: "wikistars5.firebasestorage.app", // Asegúrate de que este es el valor CORRECTO de tu bucket
  
  messagingSenderId: "499352994698",            // ID para Cloud Messaging (opcional si no lo usas)
  appId: "1:499352994698:web:dff77bbc455ee34980be73", // ID único de tu aplicación
  measurementId: "G-XCFCPXNP56"                 // ID para Google Analytics (opcional si no lo usas)
};

// Inicializa Firebase. Este bloque maneja la inicialización para evitar el error "app/duplicate-app".
let app: FirebaseApp;
try {
  // Intenta obtener una instancia de la aplicación Firebase si ya fue inicializada.
  // Esto es común en entornos de desarrollo donde los módulos pueden cargarse múltiples veces.
  app = getApp(); // Por defecto, busca la app llamada '[DEFAULT]'
} catch (e) {
  // Si no se encuentra ninguna instancia existente, inicializa una nueva.
  app = initializeApp(firebaseConfig);
}

// Exporta las instancias de los servicios de Firebase para que puedas utilizarlas
// en cualquier parte de tu aplicación (ej. para guardar datos, subir imágenes, gestionar usuarios).
export const storage: FirebaseStorage = getStorage(app); // Instancia del servicio de Storage
export const db: Firestore = getFirestore(app);         // Instancia del servicio de Firestore Database
export const auth: Auth = getAuth(app);                 // Instancia del servicio de Authentication

// También puedes exportar la instancia de la app en sí si la necesitas en otros lugares.
export default app;