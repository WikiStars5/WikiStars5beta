
// === src/lib/firebase.ts ===
// Configuración y servicios de Firebase para tu aplicación.
// Incluye Firestore, Authentication y Storage.

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
// con los que obtuviste de la Consola de Firebase para tu proyecto ACTIVO: wikistars5-2yctr
const firebaseConfig = {
  apiKey: "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0", // Tu clave API única
  authDomain: "wikistars5-2yctr.firebaseapp.com",    // Tu dominio de autenticación
  projectId: "wikistars5-2yctr",                     // Tu ID de proyecto (¡ESTE ES EL CORRECTO!)

  // ¡ATENCIÓN ESPECIAL A ESTA LÍNEA (storageBucket)!
  // Ahora apunta a tu bucket de Storage del proyecto activo: wikistars5-2yctr.firebasestorage.app
  storageBucket: "wikistars5-2yctr.firebasestorage.app", // Asegúrate de que este es el valor CORRECTO de tu bucket
  
  messagingSenderId: "939359993461",
  appId: "1:939359993461:web:c8aab67046db949495823c",
  measurementId: "G-XCFCPXNP56" // Asegúrate de que este ID sea correcto para tu proyecto si usas Analytics
};

// Inicializa Firebase. Este bloque maneja la inicialización para evitar el error "app/duplicate-app".
let app: FirebaseApp;
try {
  // Intenta obtener una instancia de la aplicación Firebase si ya fue inicializada.
  app = getApp(); // Por defecto, busca la app llamada '[DEFAULT]'
} catch (e) {
  // Si no se encuentra ninguna instancia existente, inicializa una nueva.
  app = initializeApp(firebaseConfig);
}

// Exporta las instancias de los servicios de Firebase para que puedas utilizarlas
// en cualquier parte de tu aplicación (ej. para guardar datos, subir imágenes, gestionar usuarios).
export const storage: FirebaseStorage = getStorage(app); // Instancia del servicio de Storage
export const db: Firestore = getFirestore(app);           // Instancia del servicio de Firestore Database
export const auth: Auth = getAuth(app);                 // Instancia del servicio de Authentication

// También puedes exportar la instancia de la app en sí si la necesitas en otros lugares.
export { app };

// === REGLAS DE SEGURIDAD DE FIRESTORE (RECOMENDADAS - APLICAR EN CONSOLA FIREBASE) ===
// Las reglas de Firestore deben aplicarse directamente en la consola de Firebase.
// No deben estar en este archivo de código.
// Ve a Firebase Console -> Firestore Database -> Rules.

// === REGLAS DE SEGURIDAD DE FIREBASE STORAGE (APLICAR EN CONSOLA FIREBASE STORAGE > REGLAS) ===
// Las reglas de Storage deben aplicarse directamente en la consola de Firebase.
// No deben estar en este archivo de código.
// Ve a Firebase Console -> Storage -> Rules.
