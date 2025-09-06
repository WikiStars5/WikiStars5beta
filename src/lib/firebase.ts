
// === src/lib/firebase.ts ===
// Configuración y servicios de Firebase para tu aplicación.
// Incluye Firestore, Authentication y Storage.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  authDomain: "wikistars5-2yctr.firebaseapp.com",
  projectId: "wikistars5-2yctr",
  storageBucket: "wikistars5-2yctr.appspot.com",
  messagingSenderId: "939359993461",
  appId: "1:939359993461:web:c8aab67046db949495823c",
  measurementId: "G-XCFCPXNP56"
};

// --- Inicialización Robusta para Next.js ---
// Esta función garantiza que la app de Firebase se inicialice solo una vez.
const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

const app: FirebaseApp = getFirebaseApp();
const storage: FirebaseStorage = getStorage(app);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const functions: Functions = getFunctions(app, 'us-central1');

/**
 * A reusable utility function to call any Firebase Cloud Function.
 * @param functionName - The name of the Cloud Function to call.
 * @param data - The data payload to send to the function.
 * @returns The result from the Cloud Function.
 */
export const callFirebaseFunction = async (functionName: string, data?: any): Promise<any> => {
    const func = httpsCallable(functions, functionName);
    const response = await func(data);
    return response.data;
}


export { app, db, auth, storage, functions };
