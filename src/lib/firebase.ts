// === src/lib/firebase.ts ===
// This file is now the central point for Firebase initialization,
// providing instances for both client and server-side operations.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore"; // Corrected import
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

// --- Singleton Initialization ---
// This pattern ensures that Firebase is initialized only once.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const functions: Functions = getFunctions(app, 'us-central1');

// --- Exports for client and server ---
export { app, auth, db, storage, functions };


// --- CLOUD FUNCTIONS UTILITY ---

/**
 * A reusable utility function to call any Firebase Cloud Function from the client.
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
        throw new Error(error.message || `An unknown error occurred while calling ${functionName}.`);
    }
}
