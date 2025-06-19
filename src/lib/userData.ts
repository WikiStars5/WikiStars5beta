
"use server";

import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type DocumentData, Timestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { COUNTRIES } from '@/config/countries'; // Import COUNTRIES

// Helper to map Firestore document data to UserProfile interface
const mapDocToUserProfile = (uid: string, data: DocumentData): UserProfile => {
  let createdAtString: string;
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    createdAtString = data.createdAt.toDate().toISOString();
  } else if (typeof data.createdAt === 'string') {
    createdAtString = data.createdAt; // Already a string
  } else {
    createdAtString = new Date().toISOString(); // Fallback, should ideally not happen if data is well-formed
  }

  let lastLoginAtString: string | undefined = undefined;
  if (data.lastLoginAt && data.lastLoginAt instanceof Timestamp) {
    lastLoginAtString = data.lastLoginAt.toDate().toISOString();
  } else if (typeof data.lastLoginAt === 'string') {
    lastLoginAtString = data.lastLoginAt;
  }

  return {
    uid,
    email: data.email || null,
    username: data.username || '',
    country: data.country || '',
    countryCode: data.countryCode || '',
    gender: data.gender || '', 
    photoURL: data.photoURL || null,
    role: data.role || 'user',
    createdAt: createdAtString,
    lastLoginAt: lastLoginAtString,
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
 * If it doesn't exist, it creates one with default values and additional data from signup.
 * If it exists, it updates the lastLoginAt timestamp and potentially other auth-related fields.
 */
export async function ensureUserProfileExists(
  user: FirebaseUser, 
  additionalData?: { countryCode?: string; gender?: string }
): Promise<UserProfile> {
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
      const updates: { 
        lastLoginAt: any; 
        photoURL?: string | null; 
        email?: string | null; 
        username?: string;
        country?: string;
        countryCode?: string;
        gender?: string;
      } = {
        lastLoginAt: serverTimestamp(),
      };

      if (user.photoURL !== undefined && user.photoURL !== existingProfileData.photoURL) {
        updates.photoURL = user.photoURL;
      }
      if (user.email !== undefined && user.email !== existingProfileData.email) {
        updates.email = user.email;
      }

      const currentUsername = existingProfileData.username;
      const authDisplayName = user.displayName;
      const isDefaultUsername = !currentUsername || currentUsername === (existingProfileData.email?.split('@')[0]) || currentUsername.startsWith('user_');

      if (authDisplayName && (authDisplayName !== currentUsername || isDefaultUsername)) {
        updates.username = authDisplayName;
      }

      if (additionalData?.countryCode && !existingProfileData.countryCode) {
        const selectedCountry = COUNTRIES.find(c => c.code === additionalData.countryCode);
        updates.countryCode = additionalData.countryCode;
        updates.country = selectedCountry ? selectedCountry.name : '';
      }
      if (additionalData?.gender && !existingProfileData.gender) {
        updates.gender = additionalData.gender;
      }
      
      await updateDoc(userDocRef, updates);
      
      const updatedDocSnap = await getDoc(userDocRef); 
      userProfileDataForMapping = updatedDocSnap.data()!;
      console.log(`[ensureUserProfileExists] Successfully updated existing user profile for UID: ${user.uid}`);
    } else {
      console.log(`[ensureUserProfileExists] Profile NOT found for UID: ${user.uid}. Creating new profile...`);
      const selectedCountry = additionalData?.countryCode ? COUNTRIES.find(c => c.code === additionalData.countryCode) : null;
      
      const newProfileData: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & { createdAt: any; lastLoginAt: any } = {
        uid: user.uid,
        email: user.email || null,
        username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`,
        photoURL: user.photoURL || null,
        country: selectedCountry ? selectedCountry.name : '',
        countryCode: additionalData?.countryCode || '',
        gender: additionalData?.gender || '', 
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newProfileData);
      
      const createdDocSnap = await getDoc(userDocRef); 
      userProfileDataForMapping = createdDocSnap.data()!;
      console.log(`[ensureUserProfileExists] Successfully created new user profile for UID: ${user.uid}`);
    }
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
  data: Partial<Pick<UserProfile, 'username' | 'country' | 'countryCode' | 'gender'>>
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
    const updateData: any = { ...data, lastLoginAt: serverTimestamp() }; // Ensure lastLoginAt is updated

    if (data.hasOwnProperty('countryCode')) { 
      if (data.countryCode === '') { // If countryCode is explicitly set to empty (e.g. 'No especificado')
        updateData.country = ''; 
      } else {
        const selectedCountry = COUNTRIES.find(c => c.code === data.countryCode);
        updateData.country = selectedCountry ? selectedCountry.name : '';
      }
    } else if (data.hasOwnProperty('country') && data.country === '') {
        // If only country is being cleared, ensure countryCode is also cleared
        updateData.countryCode = ''; 
    }
    
    console.log("[updateUserProfile] Data for updateDoc:", updateData);
    await updateDoc(userDocRef, updateData);
    console.log(`[updateUserProfile] User profile successfully updated for UID: ${uid}`);
  } catch (error: any) {
    console.error(`[updateUserProfile] Error updating profile for UID ${uid}:`, error);
    throw new Error(`Failed to update user profile. Firebase error: ${error.message}`);
  }
}
