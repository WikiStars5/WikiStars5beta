
"use server";

import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

// Helper to map Firestore document data to UserProfile interface
const mapDocToUserProfile = (uid: string, data: DocumentData): UserProfile => {
  return {
    uid,
    email: data.email || null,
    username: data.username || '',
    country: data.country || '',
    countryCode: data.countryCode || '',
    photoURL: data.photoURL || null,
    role: data.role || 'user',
    createdAt: data.createdAt,
    lastLoginAt: data.lastLoginAt,
  };
};

/**
 * Fetches a user's profile from Firestore.
 * Returns null if the profile does not exist.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) {
    console.error("getUserProfile: UID is required.");
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return mapDocToUserProfile(uid, userDocSnap.data());
    } else {
      console.log(`User profile not found for UID: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching user profile for UID ${uid}:`, error);
    throw new Error('Failed to fetch user profile.');
  }
}

/**
 * Ensures a user profile document exists in Firestore.
 * If it doesn't exist, it creates one with default values.
 * If it exists, it updates the lastLoginAt timestamp and potentially other auth-related fields.
 * This should be called after any successful user signup or login.
 */
export async function ensureUserProfileExists(user: FirebaseUser): Promise<UserProfile> {
  if (!user || !user.uid) {
    throw new Error("ensureUserProfileExists: Valid Firebase user object is required.");
  }

  const userDocRef = doc(db, 'users', user.uid);
  let userProfileData: DocumentData;

  try {
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // Profile exists, update relevant fields
      const existingProfileData = userDocSnap.data();
      const updates: { lastLoginAt: any; photoURL?: string | null; email?: string | null; username?: string } = {
        lastLoginAt: serverTimestamp(),
      };

      if (user.photoURL && user.photoURL !== existingProfileData.photoURL) {
        updates.photoURL = user.photoURL;
      }
      if (user.email && user.email !== existingProfileData.email) {
        updates.email = user.email;
      }

      // Update username if displayName from Auth is available and current Firestore username is default-like
      const isDefaultUsername = !existingProfileData.username ||
                                existingProfileData.username === (existingProfileData.email?.split('@')[0]) ||
                                existingProfileData.username.startsWith('user_');
      if (user.displayName && user.displayName !== existingProfileData.username && isDefaultUsername) {
        updates.username = user.displayName;
      }

      await updateDoc(userDocRef, updates);
      userProfileData = { ...existingProfileData, ...updates, lastLoginAt: new Date() }; // Approximate for immediate return
      console.log(`Updated existing user profile for UID: ${user.uid}`);
    } else {
      // Profile doesn't exist, create it
      const newProfile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & { createdAt: any; lastLoginAt: any } = {
        uid: user.uid,
        email: user.email || null,
        username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`,
        photoURL: user.photoURL || null,
        country: '',
        countryCode: '',
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProfile);
      userProfileData = { ...newProfile, createdAt: new Date(), lastLoginAt: new Date() }; // Approximate for immediate return
      console.log(`Created new user profile for UID: ${user.uid}`);
    }
    return mapDocToUserProfile(user.uid, userProfileData);
  } catch (error) {
    console.error(`Error ensuring user profile for UID ${user.uid}:`, error);
    throw new Error(`Failed to ensure user profile exists. Details: ${(error as Error).message}`);
  }
}

/**
 * Updates an existing user's profile in Firestore.
 * Only updates specified fields by the user from their profile form.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'username' | 'country' | 'countryCode'>>
): Promise<void> {
  if (!uid) {
    console.error("updateUserProfile: UID is required.");
    return;
  }
  if (!data || Object.keys(data).length === 0) {
    console.warn("updateUserProfile: No data provided for update.");
    return;
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const updateData: any = { ...data, lastLoginAt: serverTimestamp() };

    if (data.hasOwnProperty('country')) {
      if (data.country === '' || data.country === undefined || data.country === null) {
        updateData.country = '';
        updateData.countryCode = ''; // Ensure countryCode is also cleared if country is cleared
      } else if (data.hasOwnProperty('countryCode')) {
        updateData.countryCode = data.countryCode;
      }
    }

    await updateDoc(userDocRef, updateData);
    console.log(`User profile updated for UID: ${uid}`);
  } catch (error) {
    console.error(`Error updating user profile for UID ${uid}:`, error);
    throw new Error('Failed to update user profile.');
  }
}
