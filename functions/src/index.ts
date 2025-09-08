
/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onUserCreate } from "firebase-functions/v2/auth";

import type { UserProfile, Figure } from "./types";
import { COUNTRIES } from "./countries";

// Centralized Admin UID for security checks.
const ADMIN_UID = '252qq3sz2fWwHjQTF9JQWG65aiC2';

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

// A robust and simplified function to get all users for the admin panel.
export const getAllUsers = onCall(async (request) => {
    const callingUid = request.auth?.uid;
    if (!callingUid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // Verify the caller is an admin by checking their custom claims or Firestore role.
    const userDoc = await db.collection('users').doc(callingUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can call this function.');
    }

    try {
        const listUsersResult = await auth.listUsers(1000); // Get up to 1000 users
        const allFirestoreUsers = await db.collection('users').get();
        const firestoreUsersMap = new Map(allFirestoreUsers.docs.map(doc => [doc.id, doc.data()]));
        
        const users = listUsersResult.users
            // Filter out anonymous users which don't have an email
            .filter(userRecord => userRecord.email)
            .map(userRecord => {
                const firestoreProfile = firestoreUsersMap.get(userRecord.uid);
                return {
                    uid: userRecord.uid,
                    email: userRecord.email || null,
                    username: firestoreProfile?.username || userRecord.displayName || 'N/A',
                    photoURL: firestoreProfile?.photoURL || userRecord.photoURL || null,
                    role: firestoreProfile?.role || 'user',
                    country: firestoreProfile?.country || '',
                    countryCode: firestoreProfile?.countryCode || '',
                    gender: firestoreProfile?.gender || '',
                    createdAt: userRecord.metadata.creationTime,
                    lastLoginAt: userRecord.metadata.lastSignInTime,
                    isAnonymous: false,
                };
            });

        // Sort by creation date, newest first
        users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, users: users };

    } catch (error: any) {
        console.error("Error fetching all users from Cloud Function:", error);
        throw new HttpsError('internal', `An unexpected error occurred: ${error.message}`);
    }
});


/**
 * Deletes a figure and all its associated subcollection data recursively.
 * This is a critical and destructive operation, now made robust.
 */
export const deleteFigure = onCall(async (request) => {
    // 1. Authentication and Authorization
    const callingUid = request.auth?.uid;
    if (!callingUid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }
    const userDoc = await db.collection('users').doc(callingUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can delete figures.');
    }

    // 2. Input Validation
    const { figureId } = request.data;
    if (!figureId || typeof figureId !== 'string') {
        throw new HttpsError('invalid-argument', 'A valid figureId must be provided.');
    }

    const figureRef = db.collection('figures').doc(figureId);
    
    // Helper function to delete collections and their subcollections recursively.
    async function deleteCollection(collectionPath: string, batchSize: number) {
        const collectionRef = db.collection(collectionPath);
        const query = collectionRef.orderBy('__name__').limit(batchSize);

        return new Promise<void>((resolve, reject) => {
            deleteQueryBatch(query, resolve).catch(reject);
        });
    }

    async function deleteQueryBatch(query: admin.firestore.Query, resolve: () => void) {
        const snapshot = await query.get();

        if (snapshot.size === 0) {
            // When there are no documents left, we are done
            resolve();
            return;
        }

        // Delete documents in a batch
        const batch = db.batch();
        snapshot.docs.forEach(async (doc) => {
             // Recursively delete subcollections
            const subcollections = await doc.ref.listCollections();
            for (const subcollection of subcollections) {
                 await deleteCollection(`${doc.ref.path}/${subcollection.id}`, 500);
            }
            batch.delete(doc.ref);
        });

        await batch.commit();

        // Recurse on the next process tick, to avoid hitting stack depth limits
        process.nextTick(() => {
            deleteQueryBatch(query, resolve);
        });
    }
    
    try {
        console.log(`Starting deletion for figure ${figureId}`);

        // Get all subcollections of the figure document
        const subcollections = await figureRef.listCollections();

        // Delete each subcollection recursively
        for (const subcollection of subcollections) {
            await deleteCollection(`${figureRef.path}/${subcollection.id}`, 500);
            console.log(`Finished deleting subcollection: ${subcollection.id}`);
        }

        // After all subcollections are deleted, delete the main figure document
        await figureRef.delete();
        console.log(`Successfully deleted figure document ${figureId}`);

        return { success: true, message: `Successfully deleted figure ${figureId} and all associated data.` };

    } catch (error: any) {
        console.error(`Error deleting figure ${figureId}:`, error);
        throw new HttpsError('internal', `An error occurred while trying to delete the figure: ${error.message}`);
    }
});


/**
 * Toggles the 'isFeatured' status of a figure.
 * This is a secure 'onCall' function, callable only by authenticated admins.
 */
export const toggleFeaturedStatus = onCall(async (request) => {
    // 1. Authentication and Authorization
    const callingUid = request.auth?.uid;
    if (!callingUid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to perform this action.');
    }
    const userDoc = await db.collection('users').doc(callingUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can perform this action.');
    }

    // 2. Input Validation
    const { figureId } = request.data;
    if (!figureId || typeof figureId !== 'string') {
        throw new HttpsError('invalid-argument', 'A valid figureId must be provided.');
    }

    const figureRef = db.collection('figures').doc(figureId);

    try {
        // Use a transaction to safely read and write
        const newStatus = await db.runTransaction(async (transaction) => {
            const figureSnap = await transaction.get(figureRef);
            if (!figureSnap.exists) {
                throw new HttpsError('not-found', 'Figure not found.');
            }
            const currentStatus = figureSnap.data()?.isFeatured || false;
            const updatedStatus = !currentStatus;
            transaction.update(figureRef, { isFeatured: updatedStatus });
            return updatedStatus;
        });

        return { success: true, newStatus, message: `Figura ${newStatus ? 'marcada como destacada' : 'desmarcada como destacada'}.` };
    
    } catch (error: any) {
        console.error(`Error toggling featured status for figure ${figureId}:`, error);
        if (error instanceof HttpsError) {
            throw error; // Re-throw HttpsError directly
        }
        throw new HttpsError('internal', `An error occurred while changing the status: ${error.message}`);
    }
});
