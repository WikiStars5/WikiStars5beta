

/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onUserCreate } from "firebase-functions/v2/auth";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { differenceInHours } from 'date-fns';

import type { UserProfile, Figure, GlobalSettings, Streak, AttitudeKey } from "./types";
import { COUNTRIES } from "./countries";

// Centralized Admin UID for security checks.
const ADMIN_UID = '252qq3sz2fWwHjQTF9JQWG65aiC2';

// --- Robust Firebase Admin SDK Initialization ---
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (initError) {
  console.error("FATAL: Error durante la inicialización de Firebase Admin SDK. Verificar el Service Account.", initError);
  throw new Error("SDK Initialization Failed.");
}


const db = admin.firestore();
const messaging = admin.messaging();


// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({ maxInstances: 10, region: "us-central1" });


export const saveFigure = onCall(async (request) => {
    // This function's logic has been moved back to the client-side (FigureForm.tsx)
    // to restore the original App Hosting behavior. It is intentionally left empty.
    return { success: false, message: "This function is deprecated." };
});


export const getAdminFiguresList = onCall(async (request) => {
    // This function's logic has been moved back to the client-side (placeholder-data.ts)
    // to restore the original App Hosting behavior. It is intentionally left empty.
    return { success-false, message: "This function is deprecated." };
});

export const deleteAllFigures = onCall(async (request) => {
    // This feature has been disabled for safety.
    return { success: false, message: "This function is deprecated for safety reasons." };
});


export const streakWarningJob = onSchedule("every 24 hours", async (event) => {
    console.log("Running optimized streak warning job...");
    const now = new Date();
    
    // Calculate time boundaries for the query
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const streaksRef = db.collectionGroup("streaks");
    
    // Efficiently query for streaks that are at risk
    const atRiskStreaksQuery = streaksRef
        .where('lastCommentDate', '<', admin.firestore.Timestamp.fromDate(twentyFourHoursAgo))
        .where('lastCommentDate', '>', admin.firestore.Timestamp.fromDate(fortyEightHoursAgo));

    let notificationsSent = 0;
    
    const snapshot = await atRiskStreaksQuery.get();
    const candidatesFound = snapshot.size;
    
    if (snapshot.empty) {
        console.log("No at-risk streaks found to process.");
        return { notificationsSent, candidatesFound };
    }

    // Process only the at-risk streaks in parallel
    const processingPromises = snapshot.docs.map(async (streakDoc) => {
        const streak = streakDoc.data() as Streak;
            
        // Get user's FCM token
        const userRef = db.collection("users").doc(streak.userId);
        const userSnap = await userRef.get();

        if (userSnap.exists()) {
            const user = userSnap.data() as UserProfile;
            if (user.fcmToken) {
                const message: admin.messaging.Message = {
                    token: user.fcmToken,
                    notification: {
                        title: '🔥 ¡Tu racha está en peligro!',
                        body: `¡No has comentado hoy! Entra y deja tu opinión para no perder tu racha de ${streak.currentStreak} días.`,
                    },
                    webpush: {
                        fcmOptions: {
                            link: 'https://wikistars5.co/profile' // Direct link to their profile
                        },
                        notification: {
                            icon: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194'
                        }
                    }
                };

                try {
                    await messaging.send(message);
                    notificationsSent++;
                } catch (error) {
                    console.error(`Failed to send notification to user ${user.uid}:`, error);
                    if ((error as any).code === 'messaging/registration-token-not-registered') {
                        await userRef.update({ fcmToken: null });
                    }
                }
            }
        }
    });

    await Promise.all(processingPromises);

    console.log(`Streak warning job complete. Candidates found: ${candidatesFound}, Notifications sent: ${notificationsSent}.`);
    return { notificationsSent, candidatesFound };
});


/**
 * This function triggers automatically whenever a new user is created in Firebase Authentication.
 * Its purpose is to create a corresponding user profile document in Firestore.
 */
export const createProfileOnRegister = onUserCreate(async (event) => {
  const user = event.data;
  const { uid, email, displayName, photoURL } = user;
  
  // A more reliable way to check for anonymity
  const isAnonymous = user.providerData.length === 0;

  // Prioritize displayName (from Google), then email, then a generic one.
  const initialUsername = displayName || (email ? email.split('@')[0] : `invitado_${uid.substring(0, 5)}`);

  const userProfile: UserProfile = {
    uid: uid,
    email: email || null,
    username: initialUsername,
    country: '',
    countryCode: '',
    gender: '',
    photoURL: photoURL || null,
    role: uid === ADMIN_UID ? 'admin' : 'user', // Assign admin role only if UID matches
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    achievements: [],
    isAnonymous: isAnonymous,
  };

  try {
    await db.collection('users').doc(uid).set(userProfile);
    console.log(`Successfully created profile for user: ${uid} (Anonymous: ${isAnonymous})`);
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
    };

    try {
        await userRef.set(updateData, { merge: true });
        return { success: true, message: 'Profile updated successfully in Firestore.' };
    } catch (error) {
        console.error("Error updating user profile in Firestore:", error);
        throw new HttpsError('internal', 'Could not update profile in Firestore.');
    }
});

export const voteOnAttitude = onCall(async (request) => {
    try {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Debes iniciar sesión para votar.');
        }

        const { figureId, newVote, previousVote } = request.data as {
            figureId: string;
            newVote: AttitudeKey | null;
            previousVote: AttitudeKey | null;
        };

        if (!figureId) {
            throw new HttpsError('invalid-argument', 'El ID de la figura es obligatorio.');
        }

        const figureRef = db.collection('figures').doc(figureId);
        
        // Use a transaction for atomic read-modify-write
        const newCounts = await db.runTransaction(async (transaction) => {
            const figureDoc = await transaction.get(figureRef);
            if (!figureDoc.exists) {
                throw new HttpsError('not-found', 'La figura no existe.');
            }

            const currentData = figureDoc.data() as Figure;
            // Initialize with default if it doesn't exist to prevent errors
            const attitudeCounts = currentData.attitudeCounts || {
                neutral: 0, fan: 0, simp: 0, hater: 0
            };

            const newAttitudeCounts = { ...attitudeCounts };

            // Decrement previous vote if it exists
            if (previousVote && typeof newAttitudeCounts[previousVote] === 'number') {
                newAttitudeCounts[previousVote] = Math.max(0, newAttitudeCounts[previousVote] - 1);
            }

            // Increment new vote if it exists
            if (newVote) {
                newAttitudeCounts[newVote] = (newAttitudeCounts[newVote] || 0) + 1;
            }
            
            transaction.update(figureRef, {
                attitudeCounts: newAttitudeCounts
            });
            
            // Return the final state of the counts
            return newAttitudeCounts;
        });

        // If the transaction is successful, return the new counts.
        return { success: true, data: newCounts };

    } catch (error) {
        // If the error is already an HttpsError, re-throw it.
        if (error instanceof HttpsError) {
            throw error;
        }
        // For any other unexpected errors, log them and throw a generic internal error.
        console.error(`[voteOnAttitude] Critical Transaction Failure for figure ${request.data.figureId}:`, error);
        throw new HttpsError('internal', 'Ocurrió un error inesperado al procesar tu voto. Revisa los logs de Cloud para más detalles.');
    }
});


// ---- Settings Functions ----

export const getGlobalSettings = onCall(async (request) => {
    const settingsRef = db.collection('settings').doc('global');
    try {
        const docSnap = await settingsRef.get();
        if (docSnap.exists()) {
            return docSnap.data() as GlobalSettings;
        }
        return {}; // Return empty object if no settings are found
    } catch (error) {
        console.error("Error getting global settings:", error);
        throw new HttpsError('internal', 'Could not retrieve global settings.');
    }
});

export const updateGlobalSettings = onCall(async (request) => {
    if (request.auth?.uid !== ADMIN_UID) {
        throw new HttpsError('permission-denied', 'You must be an admin to update settings.');
    }
    
    const settingsData = request.data as GlobalSettings;
    const settingsRef = db.collection('settings').doc('global');

    try {
        await settingsRef.set(settingsData, { merge: true });
        return { success: true, message: 'Global settings updated successfully.' };
    } catch (error) {
        console.error("Error updating global settings:", error);
        throw new HttpsError('internal', 'Could not update global settings.');
    }
});

export const toggleFeaturedStatus = onCall(async (request) => {
    // This function's logic has been moved back to the client-side (FigureForm.tsx)
    // to restore the original App Hosting behavior. It is intentionally left empty.
    return { success: false, message: "This function is deprecated." };
});
