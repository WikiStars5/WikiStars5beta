
/**
 * This file is the new home for all server-side logic that requires admin privileges.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

import type { UserProfile } from "./types";
import type { DocumentData, Query } from "firebase-admin/firestore";

// Centralized Admin UID for security checks.
const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({ maxInstances: 10, region: "us-central1" });


/**
 * Returns key statistics for the admin dashboard.
 * Currently, it only returns the total number of figures.
 */
export const getDashboardStats = onCall(async (request) => {
    const callingUid = request.auth?.uid;
    if (!callingUid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // Verify the caller is an admin.
    const userDoc = await db.collection('users').doc(callingUid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admins can call this function.');
    }

    try {
        const figuresSnapshot = await db.collection('figures').get();
        const totalFigures = figuresSnapshot.size;

        return { success: true, stats: { totalFigures } };

    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        throw new HttpsError('internal', `An unexpected error occurred: ${error.message}`);
    }
});


// All user-related functions have been removed as the authentication system
// has been disabled per user request.

// All notification and trigger logic has been removed as the associated features
// (comments, likes) have been disabled.
