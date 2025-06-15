
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
    createdAt: data.createdAt, // This will be a Firestore Timestamp object or null/undefined if not set
    lastLoginAt: data.lastLoginAt, // Same as createdAt
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
 */
export async function ensureUserProfileExists(user: FirebaseUser): Promise<UserProfile> {
  if (!user || !user.uid) {
    console.error("ensureUserProfileExists: Valid Firebase user object is required.");
    throw new Error("ensureUserProfileExists: Valid Firebase user object is required.");
  }
  console.log(`[ensureUserProfileExists] Called for user UID: ${user.uid}, Email: ${user.email}, DisplayName: ${user.displayName}`);

  const userDocRef = doc(db, 'users', user.uid);
  let userProfileDataForMapping: DocumentData;

  try {
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      console.log(`[ensureUserProfileExists] Profile found for UID: ${user.uid}. Updating...`);
      const existingProfileData = userDocSnap.data();
      const updates: { lastLoginAt: any; photoURL?: string | null; email?: string | null; username?: string } = {
        lastLoginAt: serverTimestamp(),
      };

      if (user.photoURL !== undefined && user.photoURL !== existingProfileData.photoURL) {
        updates.photoURL = user.photoURL;
        console.log(`[ensureUserProfileExists] Updating photoURL to: ${user.photoURL}`);
      }
      if (user.email !== undefined && user.email !== existingProfileData.email) {
        updates.email = user.email;
        console.log(`[ensureUserProfileExists] Updating email to: ${user.email}`);
      }

      // Update username if displayName from Auth is available and current Firestore username is default-like or different
      const currentUsername = existingProfileData.username;
      const authDisplayName = user.displayName;
      const isDefaultUsername = !currentUsername || currentUsername === (existingProfileData.email?.split('@')[0]) || currentUsername.startsWith('user_');

      if (authDisplayName && (authDisplayName !== currentUsername || isDefaultUsername)) {
        updates.username = authDisplayName;
        console.log(`[ensureUserProfileExists] Updating username to: ${authDisplayName}`);
      }
      
      console.log("[ensureUserProfileExists] Data for updateDoc:", updates);
      await updateDoc(userDocRef, updates);
      // For immediate return, merge updates with existing data and approximate timestamp
      userProfileDataForMapping = { ...existingProfileData, ...updates, lastLoginAt: new Date() };
      console.log(`[ensureUserProfileExists] Successfully updated existing user profile for UID: ${user.uid}`);
    } else {
      console.log(`[ensureUserProfileExists] Profile NOT found for UID: ${user.uid}. Creating new profile...`);
      const newProfile: UserProfile = {
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
      console.log("[ensureUserProfileExists] Data for setDoc (new profile):", newProfile);
      await setDoc(userDocRef, newProfile);
      // For immediate return, approximate timestamps
      userProfileDataForMapping = { ...newProfile, createdAt: new Date(), lastLoginAt: new Date() };
      console.log(`[ensureUserProfileExists] Successfully created new user profile for UID: ${user.uid}`);
    }
    // The mapDocToUserProfile function will correctly handle the Timestamps when data is fetched later.
    // For the immediate return, this approximation is often fine for client-side updates.
    return mapDocToUserProfile(user.uid, userProfileDataForMapping);

  } catch (error: any) {
    console.error(`[ensureUserProfileExists] Firestore error for UID ${user.uid}: Message: ${error.message}, Code: ${error.code}`, error);
    throw new Error(`Firestore_Profile_Error: Failed to create/update user profile. Firebase error: ${error.message} (Code: ${error.code})`);
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
  console.log(`[updateUserProfile] Updating profile for UID: ${uid} with data:`, data);

  try {
    const userDocRef = doc(db, 'users', uid);
    const updateData: any = { ...data, lastLoginAt: serverTimestamp() };

    // Handle country and countryCode ensuring they are consistent
    if (data.hasOwnProperty('countryCode')) { // Prioritize countryCode if provided
      if (data.countryCode === '') {
        updateData.country = ''; // Clear country if countryCode is cleared
      }
      // If countryCode is set, country should also be set (or re-fetched if not provided with countryCode)
      // For simplicity, we assume 'country' is also provided or is acceptable as is.
    } else if (data.hasOwnProperty('country') && data.country === '') {
        updateData.countryCode = ''; // Clear countryCode if country is cleared
    }
    
    console.log("[updateUserProfile] Data for updateDoc:", updateData);
    await updateDoc(userDocRef, updateData);
    console.log(`[updateUserProfile] User profile successfully updated for UID: ${uid}`);
  } catch (error: any) {
    console.error(`[updateUserProfile] Firestore error for UID ${uid}: Message: ${error.message}, Code: ${error.code}`, error);
    throw new Error(`Failed to update user profile. Firebase error: ${error.message} (Code: ${error.code})`);
  }
}
