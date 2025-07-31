
/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onUserCreate } from "firebase-functions/v2/auth";

import type { UserProfile } from "./types";
import { COUNTRIES } from "./countries";
import type { DocumentData } from "firebase-admin/firestore";

// Centralized Admin UID for security checks.
const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

/**
 * This function triggers automatically whenever a new user is created in Firebase Authentication.
 * Its purpose is to create a corresponding user profile document in Firestore.
 */
export const createProfileOnRegister = onUserCreate(async (event) => {
  const user = event.data; // The user record created in Firebase Auth
  const { uid, email, displayName, photoURL } = user;

  const isAnonymous = !email; // A simple heuristic: if no email, it's likely an anonymous user.

  const userProfile: UserProfile = {
    uid: uid,
    email: email || null,
    username: isAnonymous 
      ? `Invitado_${uid.substring(0, 5)}`
      : (displayName || email?.split('@')[0] || `user_${uid.substring(0, 5)}`),
    country: '',
    countryCode: '',
    gender: '',
    photoURL: photoURL || null, 
    role: uid === ADMIN_UID ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    achievements: [],
    isAnonymous: isAnonymous,
  };

  try {
    await db.collection('users').doc(uid).set(userProfile);
    console.log(`Successfully created profile for user: ${uid}`);
  } catch (error) {
    console.error(`Error creating user profile for ${uid}:`, error);
  }
});


export const updateUserProfile = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to update your profile.');
    }
    const uid = request.auth.uid;
    const { username, countryCode, gender } = request.data;
    
    // Allow username/gender update for anonymous users, but not country for now.
    // The username check is also more lenient for guests.
    if (!username || username.length < 3 || username.length > 50) {
        throw new HttpsError('invalid-argument', 'Username must be between 3 and 50 characters.');
    }

    const userRef = db.collection('users').doc(uid);
    const safeCountryCode = countryCode || '';
    const countryName = COUNTRIES.find(c => c.code === safeCountryCode)?.name || '';

    const updateData: any = {
        username: username.trim(),
        gender: gender || '',
        lastLoginAt: new Date().toISOString(),
    };

    // For registered users, update country and potentially Firebase Auth displayName
    const callingUser = await auth.getUser(uid);
    if (!callingUser.providerData.some(p => p.providerId === 'anonymous')) {
      updateData.country = countryName;
      updateData.countryCode = safeCountryCode;
    }

    try {
        await userRef.set(updateData, { merge: true });
        
        // Only update Auth profile if user is not anonymous
        if (!callingUser.providerData.some(p => p.providerId === 'anonymous')) {
             await auth.updateUser(uid, { displayName: username.trim() });
        }

        return { success: true, message: 'Profile updated successfully.' };
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw new HttpsError('internal', 'Could not update profile.');
    }
});

export const getUserStats = onCall(async (request) => {
  if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in to view stats.');
  }
  const uid = request.auth.uid;

  try {
    const commentsQuery = db.collection('userComments').where('userId', '==', uid);
    const ratingsQuery = db.collection('userStarRatings').where('userId', '==', uid);
    const attitudesQuery = db.collection('userAttitudes').where('userId', '==', uid);

    const [commentsSnapshot, ratingsSnapshot, attitudesSnapshot] = await Promise.all([
      commentsQuery.count().get(),
      ratingsQuery.count().get(),
      attitudesQuery.count().get()
    ]);

    const stats = {
      comments: commentsSnapshot.data().count,
      ratings: ratingsSnapshot.data().count,
      attitudes: attitudesSnapshot.data().count,
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw new HttpsError('internal', 'Could not retrieve user statistics.');
  }
});


const convertTimestampToString = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;
  // Handle Firestore Timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  // Handle ISO string
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  // Handle Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
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
    achievements: data.achievements || [],
    isAnonymous: data.isAnonymous ?? true,
  };
};

export const getAllUsers = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
         throw new HttpsError('permission-denied', 'Only admins can call this function.');
    }

    try {
        const usersCollectionRef = db.collection('users');
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
