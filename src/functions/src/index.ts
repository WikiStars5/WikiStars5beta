/**
 * This file is the new home for all server-side logic that requires admin privileges.
 * By using onCall functions, we ensure a secure and stable separation between
 * client-side Next.js code and server-side Firebase Admin SDK operations,
 * which resolves the persistent build errors.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { UserProfile } from "../../lib/types"; // Adjust path as necessary
import type { DocumentData } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({maxInstances: 10, region: "us-central1"});


const convertTimestampToString = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return undefined;
};

const mapDocToUserProfile = (uid: string, data: DocumentData): UserProfile => {
  const createdAt = convertTimestampToString(data.createdAt) || new Date().toISOString();
  return {
    uid,
    email: data.email || null,
    username: data.username || '',
    country: data.country || '',
    countryCode: data.countryCode || '',
    gender: data.gender || '', 
    photoURL: data.photoURL || null,
    role: data.role || 'user',
    createdAt: createdAt,
    lastLoginAt: convertTimestampToString(data.lastLoginAt),
    fcmToken: data.fcmToken || undefined,
  };
};

// Callable function to get all users
export const getAllUsers = onCall(async (request) => {
    // Optional: Add authentication check to ensure only admins can call this
    // const uid = request.auth?.uid;
    // if (!uid) {
    //     throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }
    // const adminUser = await admin.auth().getUser(uid);
    // if (adminUser.customClaims?.admin !== true) {
    //     throw new HttpsError('permission-denied', 'Only admins can call this function.');
    // }

    try {
        const usersCollectionRef = db.collection('registered_users');
        const querySnapshot = await usersCollectionRef.get();

        const users: UserProfile[] = [];
        if (!querySnapshot.empty) {
            querySnapshot.forEach((docSnap) => {
                users.push(mapDocToUserProfile(docSnap.id, docSnap.data()));
            });
        }
        
        users.sort((a, b) => a.username.localeCompare(b.username));
        
        return { success: true, users: users };

    } catch (error: any) {
        console.error("Error fetching all users from Cloud Function:", error);
        if (error.code === 'permission-denied' || String(error.message).toLowerCase().includes("permission")) {
            return { success: false, error: 'Error de permisos de Firestore en la Cloud Function. Revisa las reglas de seguridad o los permisos de la cuenta de servicio.' };
        }
        return { success: false, error: error.message || 'Un error desconocido ocurrió en la Cloud Function.' };
    }
});

// The push notification function has been moved to its own file in `src/functions/src/notifications.ts`
// for better organization, but for simplicity here we keep it. If you need more functions, split them.
export { sendPushNotification } from './notifications';
