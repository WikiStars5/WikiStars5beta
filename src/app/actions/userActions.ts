
'use server';

import { headers } from 'next/headers';
import { initializeApp, getApps, type FirebaseApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserProfile } from '@/lib/types';
import { credential }from 'firebase-admin';

// --- Firebase Admin Initialization ---
// This setup ensures that we initialize the admin app only once.
let adminApp: FirebaseApp;

if (!getApps().length) {
  // Initialize without arguments to use Application Default Credentials
  // in the App Hosting environment. This is the correct and secure way.
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

/**
 * Retrieves the currently authenticated user's ID token from the request headers.
 * This is a secure way to get the user's identity on the server.
 * @returns The decoded ID token or null if not authenticated.
 */
async function getDecodedIdTokenFromHeaders(): Promise<DecodedIdToken | null> {
  const authHeader = headers().get('Authorization');
  const idToken = authHeader?.split('Bearer ')[1];
  
  if (!idToken) {
    return null;
  }
  
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying ID token in server action:", error);
    return null;
  }
}

/**
 * Fetches the complete UserProfile from Firestore for the currently authenticated user.
 * This is the primary function to get user data securely on the server.
 * It can use a pre-decoded token (from an API route) or get it from headers.
 * @returns The UserProfile object or null if the user is not authenticated or not found.
 */
export async function getCurrentUser(decodedToken?: DecodedIdToken): Promise<UserProfile | null> {
  const token = decodedToken || await getDecodedIdTokenFromHeaders();
  if (!token) {
    return null;
  }

  try {
    const userDocRef = adminDb.collection('users').doc(token.uid);
    const userDocSnap = await userDocRef.get();
    
    if (userDocSnap.exists) {
      return userDocSnap.data() as UserProfile;
    } else {
      console.warn(`User profile not found in Firestore for UID: ${token.uid}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    return null;
  }
}
