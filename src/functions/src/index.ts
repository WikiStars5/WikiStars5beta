
/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onUserCreate } from "firebase-functions/v2/auth";

import type { UserProfile, Attitude, EmotionVote, AttitudeKey, EmotionKey } from "./types";
import { COUNTRIES } from "./countries";
import type { DocumentData, FieldValue } from "firebase-admin/firestore";

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
  const isAnonymous = user.providerData.length === 0;

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

export const updateAttitudeVote = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in to vote.');
    const uid = request.auth.uid;
    const { figureId, attitude } = request.data as { figureId: string, attitude: AttitudeKey };

    const userVoteDocRef = db.collection('userAttitudes').doc(`${uid}_${figureId}`);
    const figureDocRef = db.collection('figures').doc(figureId);

    return db.runTransaction(async (transaction) => {
        const userVoteDoc = await transaction.get(userVoteDocRef);
        const previousAttitude = userVoteDoc.exists ? userVoteDoc.data()?.attitude as AttitudeKey : null;

        const updates: { [key: string]: FieldValue } = {};
        const newVote = previousAttitude === attitude ? null : attitude;

        if (previousAttitude) {
            updates[`attitudeCounts.${previousAttitude}`] = admin.firestore.FieldValue.increment(-1);
        }
        if (newVote) {
            updates[`attitudeCounts.${newVote}`] = admin.firestore.FieldValue.increment(1);
        }

        transaction.update(figureDocRef, updates);

        if (newVote) {
            transaction.set(userVoteDocRef, { userId: uid, figureId, attitude: newVote, timestamp: admin.firestore.FieldValue.serverTimestamp() });
        } else {
            transaction.delete(userVoteDocRef);
        }

        return { success: true, newVote };
    }).catch(error => {
        console.error("Attitude vote transaction failed:", error);
        throw new HttpsError('internal', 'The vote could not be processed.');
    });
});

export const updateEmotionVote = onCall(async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'You must be logged in to vote.');
    const uid = request.auth.uid;
    const { figureId, emotion } = request.data as { figureId: string, emotion: EmotionKey };

    const userVoteDocRef = db.collection('userEmotions').doc(`${uid}_${figureId}`);
    const figureDocRef = db.collection('figures').doc(figureId);

    return db.runTransaction(async (transaction) => {
        const userVoteDoc = await transaction.get(userVoteDocRef);
        const previousEmotion = userVoteDoc.exists ? userVoteDoc.data()?.emotion as EmotionKey : null;
        
        const updates: { [key: string]: FieldValue } = {};
        const newVote = previousEmotion === emotion ? null : emotion;

        if (previousEmotion) {
            updates[`perceptionCounts.${previousEmotion}`] = admin.firestore.FieldValue.increment(-1);
        }
        if (newVote) {
            updates[`perceptionCounts.${newVote}`] = admin.firestore.FieldValue.increment(1);
        }
        
        transaction.update(figureDocRef, updates);

        if (newVote) {
            transaction.set(userVoteDocRef, { userId: uid, figureId, emotion: newVote, timestamp: admin.firestore.FieldValue.serverTimestamp() });
        } else {
            transaction.delete(userVoteDocRef);
        }
        
        return { success: true, newVote };
    }).catch(error => {
        console.error("Emotion vote transaction failed:", error);
        throw new HttpsError('internal', 'The vote could not be processed.');
    });
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

// Import notifications logic so it gets deployed
import "./notifications";
import "./triggers";
