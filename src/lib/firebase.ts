// === src/lib/firebase.ts ===
// This file is now primarily for exporting types and the Cloud Function utility.
// The main initialization logic has been moved to FirebaseProvider.tsx to ensure
// it runs correctly in a client-only context within Next.js.

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

// --- This configuration is now only used by Cloud Functions ---
const firebaseConfig = {
  "projectId": "wikistars5-2yctr",
  "appId": "1:939359993461:web:8228c2d11941f46e95823c",
  "storageBucket": "wikistars5-2yctr.firebasestorage.app",
  "apiKey": "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  "authDomain": "wikistars5-2yctr.firebaseapp.com",
  "measurementId": "G-8MY8KTGXP3",
  "messagingSenderId": "939359993461"
};


// --- CLOUD FUNCTIONS UTILITY ---
// This part remains as it can be called from client components
// that get the 'functions' instance from the FirebaseProvider.

let functionsInstance: Functions | null = null;
if (typeof window !== 'undefined') {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    functionsInstance = getFunctions(app, 'us-central1');
}

/**
 * A reusable utility function to call any Firebase Cloud Function from the client.
 * @param functionName - The name of the Cloud Function to call.
 * @param data - The data payload to send to the function.
 * @returns The result from the Cloud Function.
 */
export const callFirebaseFunction = async (functionName: string, data?: any): Promise<any> => {
    if (!functionsInstance) {
        throw new Error("Firebase Functions is not initialized on the client.");
    }
    const func = httpsCallable(functionsInstance, functionName);
    try {
        const response = await func(data);
        return response.data;
    } catch (error: any) {
        console.error(`Error calling function '${functionName}':`, error);
        // Re-throw a more user-friendly error or the original error
        throw new Error(error.message || `An unknown error occurred while calling ${functionName}.`);
    }
}
