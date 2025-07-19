
/**
 * This file is the new home for all server-side logic that requires admin privileges.
 * By using onCall functions, we ensure a secure and stable separation between
 * client-side Next.js code and server-side Firebase Admin SDK operations,
 * which resolves the persistent build errors.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
// Corrected: Import types from the local file to ensure function isolation.
import type { Figure, UserProfile } from "./types";
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Centralized Admin UID for security checks.
const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

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
    achievements: data.achievements || [], // Ensure achievements array exists
  };
};

export const ensureUserProfile = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    try {
        const userRecord = await getAuth().getUser(uid);
        const userDocRef = db.collection('registered_users').doc(uid);
        const userDocSnap = await userDocRef.get();

        if (userDocSnap.exists) {
            // User exists, update last login and any changed info
            const updates: { [key: string]: any } = {
                lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            const existingData = userDocSnap.data()!;
            if (userRecord.photoURL && userRecord.photoURL !== existingData.photoURL) {
                updates.photoURL = userRecord.photoURL;
            }
            if (userRecord.displayName && userRecord.displayName !== existingData.username) {
                updates.username = userRecord.displayName;
            }
            if (userRecord.email && userRecord.email !== existingData.email) {
                updates.email = userRecord.email;
            }
            await userDocRef.update(updates);
        } else {
            // User does not exist, create a new profile
            const newUserProfile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & { createdAt: any; lastLoginAt: any; } = {
                uid: userRecord.uid,
                email: userRecord.email || null,
                username: userRecord.displayName || userRecord.email?.split('@')[0] || `user_${uid.substring(0, 6)}`,
                photoURL: userRecord.photoURL || null,
                role: 'user',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
                achievements: [],
            };
            await userDocRef.set(newUserProfile);
        }
        return { success: true };
    } catch (error: any) {
        console.error(`Error in ensureUserProfile for UID ${uid}:`, error);
        throw new HttpsError('internal', 'Failed to create or update user profile.', error.message);
    }
});


// Callable function to get all users, now with admin check
export const getAllUsers = onCall(async (request) => {
    // Authentication check to ensure only admins can call this
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Check if the caller is the designated admin
    if (uid !== ADMIN_UID) {
        throw new HttpsError('permission-denied', 'Only admins can call this function.');
    }

    try {
        // CORRECTED: Reading from the 'registered_users' collection, where profiles are actually stored.
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
