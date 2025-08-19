

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
  const isAnonymous = !email; // A simple check for anonymous users

  const userProfile: UserProfile = {
    uid: uid,
    email: email || null,
    username: isAnonymous ? "Invitado" : (displayName || email?.split('@')[0] || `user_${uid.substring(0, 5)}`),
    country: '',
    countryCode: '',
    gender: '',
    photoURL: photoURL || null, // Ensure photoURL is always defined as string or null
    role: uid === ADMIN_UID ? 'admin' : 'user', // Assign admin role if UID matches
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(), // Set initial login time
    achievements: [],
    isAnonymous: isAnonymous,
  };

  try {
    // Set the document in the 'users' collection with the user's UID as the document ID.
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
        await auth.updateUser(uid, { displayName: username });
        await userRef.set(updateData, { merge: true });
        
        return { success: true, message: 'Profile updated successfully.' };
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw new HttpsError('internal', 'Could not update profile.');
    }
});


const convertTimestampToString = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
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
    isAnonymous: data.isAnonymous ?? false,
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

export const addReview = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'Debes estar autenticado para dejar una reseña.');
    }
    const { characterId, comment } = request.data;
    if (!characterId || !comment) {
        throw new HttpsError('invalid-argument', 'Faltan datos para crear la reseña.');
    }
    if (comment.trim().length < 5 || comment.trim().length > 1000) {
        throw new HttpsError('invalid-argument', 'El comentario debe tener entre 5 y 1000 caracteres.');
    }

    try {
        const userRecord = await auth.getUser(uid);
        const userProfileDoc = await db.collection('users').doc(uid).get();
        
        // Safely determine username. This is the key fix.
        const username = userProfileDoc.exists() && userProfileDoc.data()?.username
            ? userProfileDoc.data()?.username
            : userRecord.displayName || 'Invitado';

        await db.collection('reviews').add({
            characterId,
            userId: uid,
            username: username,
            userPhotoUrl: userRecord.photoURL || null,
            comment: comment.trim(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            likes: [],
            replyCount: 0,
        });
        return { success: true, message: 'Tu reseña ha sido publicada.' };
    } catch (error) {
        console.error('Error adding review in Cloud Function:', error);
        throw new HttpsError('internal', 'No se pudo publicar tu reseña. El servidor encontró un problema.');
    }
});

export const deleteReview = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'No estás autenticado.');
    }
    const { reviewId } = request.data;
    if (!reviewId) {
        throw new HttpsError('invalid-argument', 'Falta el ID de la reseña.');
    }
    
    const reviewRef = db.collection('reviews').doc(reviewId);
    const userDoc = await db.collection('users').doc(uid).get();

    try {
        const reviewSnap = await reviewRef.get();
        if (!reviewSnap.exists()) {
            throw new HttpsError('not-found', 'La reseña no existe.');
        }

        const reviewData = reviewSnap.data()!;
        const userIsAdmin = userDoc.exists() && userDoc.data()?.role === 'admin';

        if (reviewData.userId !== uid && !userIsAdmin) {
            throw new HttpsError('permission-denied', 'No tienes permiso para eliminar esta reseña.');
        }

        await reviewRef.delete();
        return { success: true, message: 'Reseña eliminada correctamente.' };

    } catch (error: any) {
        console.error("Error deleting review in Cloud Function:", error);
        if (error instanceof HttpsError) {
            throw error; // Re-throw HttpsError directly
        }
        throw new HttpsError('internal', 'Ocurrió un error al eliminar la reseña.');
    }
});


// Import notifications logic so it gets deployed
import "./notifications";
// Triggers are no longer needed for counters, but keeping the file in case other triggers are added later.
import "./triggers";
