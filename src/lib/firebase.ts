

// === src/lib/firebase.ts ===
// Configuración y servicios de Firebase para tu aplicación.
// Incluye Firestore, Authentication y Storage.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';


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
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

const app: FirebaseApp = getFirebaseApp();

const storage: FirebaseStorage = getStorage(app);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const functions: Functions = getFunctions(app, 'us-central1'); // Region corrected to us-central1

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
