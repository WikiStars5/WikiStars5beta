
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
    country: data.country || '', // Ensure it defaults to empty string if undefined/null
    countryCode: data.countryCode || '', // Ensure it defaults to empty string if undefined/null
    photoURL: data.photoURL || null,
    role: data.role || 'user',
    createdAt: data.createdAt, // Should be a Firestore Timestamp
    lastLoginAt: data.lastLoginAt, // Should be a Firestore Timestamp or undefined
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
 * If it exists, it returns the existing profile.
 * This should be called after user signup or first login.
 */
export async function ensureUserProfileExists(user: FirebaseUser): Promise<UserProfile> {
  if (!user || !user.uid) {
    throw new Error("ensureUserProfileExists: Valid Firebase user object is required.");
  }

  const userDocRef = doc(db, 'users', user.uid);
  let userProfile: UserProfile | null = null;

  try {
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      userProfile = mapDocToUserProfile(user.uid, userDocSnap.data());
    } else {
      // Profile doesn't exist, create it
      const newProfileData: UserProfile = {
        uid: user.uid,
        email: user.email || null,
        username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`,
        country: '', // Initialize as empty string per request
        countryCode: '', // Initialize as empty string per request
        photoURL: user.photoURL || null,
        role: 'user', // Default role
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProfileData);
      console.log(`Created new user profile for UID: ${user.uid}`);
      // To ensure timestamps are resolved, fetch the document again or construct UserProfile from newProfileData with assumption for timestamps
      // For simplicity, we'll construct it directly; in a real app, fetching might be better if precise serverTimestamp values are immediately needed.
      userProfile = {
        ...newProfileData,
        // Assuming serverTimestamp will resolve; for client-side immediate use, these might be pending write objects
        // or you'd use a local Date and update later if strict server time is needed before a re-fetch.
        // For the purpose of returning a UserProfile object synchronously:
        createdAt: new Date(), // Approximate with local time for immediate return
        lastLoginAt: new Date(), // Approximate with local time
      };
    }
    // This assertion is safe because if userDocSnap didn't exist, we created and assigned to userProfile.
    // If it did exist, we assigned to userProfile.
    return userProfile!;
  } catch (error) {
    console.error(`Error ensuring user profile for UID ${user.uid}:`, error);
    throw new Error('Failed to ensure user profile exists.');
  }
}

/**
 * Updates an existing user's profile in Firestore.
 * Only updates specified fields.
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
    
    // Ensure countryCode is explicitly set to null if country is cleared, or updated
    if (data.hasOwnProperty('country')) {
        if (data.country === '' || data.country === undefined || data.country === null) {
            updateData.country = ''; // Store as empty string for consistency
            updateData.countryCode = '';
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

