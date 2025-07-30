
/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

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


export const registerUser = onCall(async (request) => {
    const { email, password, username, countryCode, gender } = request.data;

    if (!email || !password || !username || !countryCode || !gender) {
        throw new HttpsError('invalid-argument', 'Todos los campos (email, contraseña, nombre de usuario, país y sexo) son obligatorios.');
    }
    if (password.length < 6) {
        throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
    }

    try {
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: username,
        });

        const { uid, photoURL } = userRecord;
        const countryName = COUNTRIES.find(c => c.code === countryCode)?.name || '';

        const userProfile: UserProfile = {
            uid: uid,
            email: email,
            username: username,
            country: countryName,
            countryCode: countryCode,
            gender: gender,
            photoURL: photoURL || null,
            role: uid === ADMIN_UID ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            achievements: [],
        };

        await db.collection('users').doc(uid).set(userProfile);
        
        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error("Error al registrar usuario:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'Este correo electrónico ya está registrado.');
        }
        if (error.code === 'auth/weak-password') {
             throw new HttpsError('invalid-argument', 'La contraseña debe tener al menos 6 caracteres.');
        }
        throw new HttpsError('internal', 'No se pudo crear la cuenta. Por favor, inténtalo de nuevo.');
    }
});


export const updateUserProfile = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to update your profile.');
    }
    const uid = request.auth.uid;
    const { username, countryCode, gender } = request.data;

    if (!username || username.length < 3 || username.length > 30) {
        throw new HttpsError('invalid-argument', 'Username must be between 3 and 30 characters.');
    }

    const userRef = db.collection('users').doc(uid);
    const safeCountryCode = countryCode || '';
    const countryName = COUNTRIES.find(c => c.code === safeCountryCode)?.name || '';

    const updateData = {
        username,
        country: countryName,
        countryCode: safeCountryCode,
        gender: gender || '',
        lastLoginAt: new Date().toISOString(),
    };

    try {
        // Also update the displayName in Firebase Auth for consistency
        await auth.updateUser(uid, { displayName: username });
        // Use set with merge:true to create the document if it doesn't exist, or update it if it does.
        await userRef.set(updateData, { merge: true });
        
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

export { sendPushNotification } from './notifications';
