

/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { onUserCreate } from "firebase-functions/v2/auth";
import { onSchedule } from "firebase-functions/v2/scheduler";


import type { UserProfile, Figure } from "./types";
import { COUNTRIES } from "./countries";
import type { DocumentData, Query } from "firebase-admin/firestore";

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

// This function runs automatically every 24 hours.
export const communityVerificationJob = onSchedule("every 24 hours", async (event) => {
  console.log("Running community verification job...");
  const figuresRef = db.collection("figures");

  let verifiedCount = 0;
  
  // --- Step 1: Verify profiles that reached the vote threshold ---
  const pendingVerificationQuery = figuresRef
    .where("creationMethod", "==", "wikipedia") // Only check Wikipedia-created profiles now
    .where("isCommunityVerified", "==", false);

  const pendingSnapshot = await pendingVerificationQuery.get();

  if (!pendingSnapshot.empty) {
      const verifyBatch = db.batch();
      pendingSnapshot.forEach(doc => {
          const figure = doc.data() as Figure;
          const attitudeCounts = figure.attitudeCounts || {};
          const totalVotes = Object.values(attitudeCounts).reduce((sum, count) => sum + count, 0);

          if (totalVotes >= 1000) {
              console.log(`Profile ${figure.name} (${doc.id}) reached 1000 votes. Marking as verified.`);
              verifyBatch.update(doc.ref, { isCommunityVerified: true });
              verifiedCount++;
          }
      });
      if (verifiedCount > 0) {
        await verifyBatch.commit();
      }
  } else {
      console.log("No profiles to check for verification.");
  }

  console.log(`Verification job complete. Verified: ${verifiedCount}.`);
  return { verifiedCount };
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

// All user-related functions have been removed as the authentication system
// has been disabled per user request.

// All notification and trigger logic has been removed as the associated features
// (comments, likes) have been disabled.
