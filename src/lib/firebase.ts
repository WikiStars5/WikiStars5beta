
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "wikistars5-2yctr",
  "appId": "1:939359993461:web:8228c2d11941f46e95823c",
  "storageBucket": "wikistars5-2yctr.firebasestorage.app",
  "apiKey": "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  "authDomain": "wikistars5-2yctr.firebaseapp.com",
  "measurementId": "G-8MY8KTGXP3",
  "messagingSenderId": "939359993461"
};


// Initialize Firebase for the client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1'); // Make sure region matches your functions

/**
 * A utility function to call a Firebase Cloud Function.
 * @param name The name of the function to call.
 * @param data The data to pass to the function.
 * @returns The result of the function call.
 */
export async function callFirebaseFunction(name: string, data?: any): Promise<any> {
    try {
        const func = httpsCallable(functions, name);
        const response = await func(data);
        return response.data;
    } catch (error: any) {
        console.error(`Error calling function "${name}":`, error);
        // Provide a more user-friendly error message
        throw new Error(error.message || `Failed to execute cloud function: ${name}`);
    }
}


export { app, db, auth };
