
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
import type { Figure, UserProfile, UserDocument } from "./types";
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';

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

export const registerUser = onCall(async (request) => {
    const { email, password, username } = request.data;
    if (!email || !password || !username) {
        throw new HttpsError('invalid-argument', 'Email, password, and username are required.');
    }

    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();

    if (!existingUser.empty) {
        throw new HttpsError('already-exists', 'This email is already registered.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserRef = usersRef.doc(); // Create a reference with a new unique ID
    
    // Construct the document with the correct structure and the new ID
    const newUserDocument: UserDocument = {
        uid: newUserRef.id,
        email: email,
        username: username,
        hashedPassword: hashedPassword,
        salt: salt,
        role: newUserRef.id === ADMIN_UID ? 'admin' : 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        photoURL: `https://i.pravatar.cc/150?u=${newUserRef.id}`, // Placeholder avatar
        achievements: [],
        country: '',
        countryCode: '',
        gender: '',
        fcmToken: '',
        lastLoginAt: null,
    };
    
    await newUserRef.set(newUserDocument); // Set the data for the new document reference

    return { success: true, userId: newUserRef.id };
});

export const loginUser = onCall(async (request) => {
    const { email, password } = request.data;
    if (!email || !password) {
        throw new HttpsError('invalid-argument', 'Email and password are required.');
    }

    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).limit(1).get();

    if (userQuery.empty) {
        throw new HttpsError('not-found', 'Invalid email or password.');
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data() as UserDocument;

    const isPasswordValid = await bcrypt.compare(password, userData.hashedPassword);

    if (!isPasswordValid) {
        throw new HttpsError('unauthenticated', 'Invalid email or password.');
    }

    // Update last login
    await userDoc.ref.update({ lastLoginAt: admin.firestore.FieldValue.serverTimestamp() });

    const { hashedPassword, salt, ...userProfile } = userData;
    
    // Create a session token (JWT)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-for-wikistars5-app-please-change');
    const token = await new jose.SignJWT({ ...userProfile, uid: userDoc.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
        
    return { success: true, token, user: { ...userProfile, uid: userDoc.id } };
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
        // CORRECTED: Reading from the 'users' collection for custom auth
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

// The push notification function has been moved to its own file in `src/functions/src/notifications.ts`
// for better organization, but for simplicity here we keep it. If you need more functions, split them.
export { sendPushNotification } from './notifications';

// This function is now obsolete with the custom auth system.
export const ensureUserProfile = onCall(async () => {
    return { success: true, message: "This function is obsolete with custom authentication." };
});

