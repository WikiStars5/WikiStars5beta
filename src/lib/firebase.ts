

// === src/lib/firebase.ts ===
// Configuración y servicios de Firebase para tu aplicación.
// Incluye Firestore, Authentication y Storage.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth, browserLocalPersistence, initializeAuth } from "firebase/auth";
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";


const firebaseConfig = {
  "projectId": "wikistars5-2yctr",
  "appId": "1:939359993461:web:8228c2d11941f46e95823c",
  "storageBucket": "wikistars5-2yctr.firebasestorage.app",
  "apiKey": "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  "authDomain": "wikistars5-2yctr.firebaseapp.com",
  "measurementId": "G-8MY8KTGXP3",
  "messagingSenderId": "939359993461"
};

// --- Inicialización Robusta para Next.js ---
// Esta función garantiza que la app de Firebase se inicialice solo una vez.
const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error("Client-side Firebase config environment variables (NEXT_PUBLIC_...) are not set.");
    }
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

const app: FirebaseApp = getFirebaseApp();

// --- Inicialización de App Check (Solo en el Cliente) ---
if (typeof window !== 'undefined') {
  // La clave de ReCaptcha v3 se debe almacenar de forma segura.
  // Usar una variable de entorno pública de Next.js es la práctica estándar.
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    console.error("Firebase App Check: La variable de entorno NEXT_PUBLIC_RECAPTCHA_SITE_KEY no está definida. App Check no se inicializará.");
  } else {
    try {
      // Declaramos `self.FIREBASE_APPCHECK_DEBUG_TOKEN` como `any` para evitar errores de tipo
      // ya que esta es una variable de depuración que se define manualmente en la ventana.
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NODE_ENV === 'development';

      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true // Mantener la sesión del usuario verificada
      });
      console.log("Firebase App Check inicializado correctamente.");
    } catch (error) {
      console.error("Error al inicializar Firebase App Check:", error);
    }
  }
}

const storage: FirebaseStorage = getStorage(app);
const db: Firestore = getFirestore(app);

// Use initializeAuth for robust persistence handling in the browser.
const auth: Auth = typeof window !== 'undefined'
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : getAuth(app);
  
const functions: Functions = getFunctions(app, 'us-central1');

/**
 * A reusable utility function to call any Firebase Cloud Function.
 * @param functionName - The name of the Cloud Function to call.
 * @param data - The data payload to send to the function.
 * @returns The result from the Cloud Function.
 */
export const callFirebaseFunction = async (functionName: string, data?: any): Promise<any> => {
    const func = httpsCallable(functions, functionName);
    try {
        const response = await func(data);
        return response.data;
    } catch (error: any) {
        console.error(`Error calling function '${functionName}':`, error);
        // Re-throw a more user-friendly error or the original error
        throw new Error(error.message || `An unknown error occurred while calling ${functionName}.`);
    }
}


export { app, db, auth, storage, functions };
