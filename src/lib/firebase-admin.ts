
import * as admin from 'firebase-admin';

// This file is for server-side code (e.g., Next.js Server Actions, API routes)
// that needs admin privileges. It should not be imported into client-side components.

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;
