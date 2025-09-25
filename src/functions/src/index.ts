

/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onUserCreate } from "firebase-functions/v2/auth";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated } from "firebase-functions/v2/firestore";


import type { UserProfile, Figure, GlobalSettings, Notification } from "./types";
import { COUNTRIES } from "./countries";

// Centralized Admin UID for security checks.
const ADMIN_UID = '252qq3sz2fWwHjQTF9JQWG65aiC2';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();


// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({ maxInstances: 10, region: "us-central1" });


export const createNotificationOnReply = onDocumentCreated(
  "figures/{figureId}/comments/{commentId}/replies/{replyId}",
  async (event) => {
    console.log("createNotificationOnReply triggered.");

    const snap = event.data;
    if (!snap) {
      console.log("No data associated with the event.");
      return;
    }
    const replyData = snap.data();
    const params = event.params;
    
    console.log(`New reply created by ${replyData.authorName} in figure ${params.figureId}`);

    const parentCommentPath = `figures/${params.figureId}/comments/${params.commentId}`;
    console.log("Parent comment path:", parentCommentPath);

    try {
        const parentCommentSnap = await db.doc(parentCommentPath).get();
        if (!parentCommentSnap.exists) {
            console.error(`Parent comment at ${parentCommentPath} not found.`);
            return;
        }

        const parentCommentData = parentCommentSnap.data();
        if (!parentCommentData) {
            console.error("Parent comment has no data.");
            return;
        }

        const targetUserId = parentCommentData.authorId;
        const replierUserId = replyData.authorId;

        console.log(`Target User ID: ${targetUserId}, Replier User ID: ${replierUserId}`);

        // Do not send notification if the user is replying to themselves
        if (targetUserId === replierUserId) {
            console.log("User replied to their own comment. No notification sent.");
            return;
        }
        
        // Fetch figure name
        const figureSnap = await db.doc(`figures/${params.figureId}`).get();
        const figureName = figureSnap.exists() ? figureSnap.data()?.name : "un perfil";

        const notification: Omit<Notification, 'id'> = {
            type: 'reply',
            figureId: params.figureId,
            figureName: figureName,
            commentId: params.commentId,
            commentText: parentCommentData.text,
            actorName: replyData.authorName,
            createdAt: admin.firestore.Timestamp.now(),
            isRead: false,
        };
        
        const notificationsRef = db.collection(`users/${targetUserId}/notifications`);
        
        console.log(`Creating notification for user ${targetUserId}:`, notification);
        await notificationsRef.add(notification);
        console.log("Notification successfully created in Firestore.");

    } catch (error) {
        console.error("Error creating notification on reply:", error);
    }
  }
);


// This function runs automatically every 5 minutes.
export const communityVerificationJob = onSchedule("every 5 minutes", async (event) => {
  console.log("Running community verification job...");
  const now = admin.firestore.Timestamp.now();
  const figuresRef = db.collection("figures");

  let movedToReviewCount = 0;
  let verifiedCount = 0;

  // Query for all manual, unverified, and approved profiles.
  // We will check the expiration date in the code to avoid complex index requirements.
  const candidatesQuery = figuresRef
    .where("creationMethod", "==", "manual")
    .where("isCommunityVerified", "==", false)
    .where("status", "==", "approved");

  const candidatesSnapshot = await candidatesQuery.get();

  if (candidatesSnapshot.empty) {
    console.log("No pending manual profiles found to process.");
    return { verifiedCount, movedToReviewCount };
  }

  const reviewBatch = db.batch();
  const verifyBatch = db.batch();

  candidatesSnapshot.forEach(doc => {
      const figure = doc.data() as Figure;
      
      // --- Logic for Verification ---
      const attitudeCounts = figure.attitudeCounts || {};
      const totalVotes = Object.values(attitudeCounts).reduce((sum, count) => sum + count, 0);

      if (totalVotes >= 1000) {
          console.log(`Profile ${figure.name} (${doc.id}) reached 1000 votes. Marking as verified.`);
          verifyBatch.update(doc.ref, { isCommunityVerified: true });
          verifiedCount++;
          return; // Move to the next document
      }

      // --- Logic for Expiration ---
      if (figure.manualVerificationExpiresAt) {
        const expiresAt = (figure.manualVerificationExpiresAt as admin.firestore.Timestamp).toDate();
        if (now.toDate() >= expiresAt) {
          console.log(`Profile ${figure.name} (${doc.id}) has expired. Moving to admin review.`);
          reviewBatch.update(doc.ref, { status: 'pending_admin_review' });
          movedToReviewCount++;
        }
      }
  });

  // Commit batches if there are changes
  if (movedToReviewCount > 0) {
    await reviewBatch.commit();
  }
  if (verifiedCount > 0) {
    await verifyBatch.commit();
  }
  
  console.log(`Verification job complete. Verified: ${verifiedCount}, Moved to Review: ${movedToReviewCount}.`);
  return { verifiedCount, movedToReviewCount };
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
