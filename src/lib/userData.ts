
"use server";

import { db } from '@/lib/firebase';
import type { UserProfile, UserAttitude, AttitudeKey } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type DocumentData, Timestamp, collection, query, getDocs, orderBy, where, deleteDoc, startAt, endAt } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { COUNTRIES } from '@/config/countries'; // Import COUNTRIES

const USER_COLLECTION = 'registered_users';

// Helper to handle timestamp conversion robustly
const convertTimestampToString = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;
  if (typeof timestamp.toDate === 'function') { // Firestore Timestamp
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') { // Already a string
    return timestamp;
  }
  return undefined;
};

// Helper to map Firestore document data to UserProfile interface
const mapDocToUserProfile = (uid: string, data: DocumentData): UserProfile => {
  // A createdAt must always exist, so we provide a fallback.
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
  };
};

/**
 * Ensures a user profile document exists in Firestore.
 * If it doesn't exist, it creates one with default values and additional data from signup.
 * If it exists, it updates the lastLoginAt timestamp and potentially other auth-related fields.
 * This is primarily used now to populate the user list for the admin panel.
 */
export async function ensureUserProfileExists(
  user: FirebaseUser, 
  additionalData?: { countryCode?: string; gender?: string }
): Promise<UserProfile> {
  if (!user || !user.uid) {
    throw new Error("Valid Firebase user object is required.");
  }

  const userDocRef = doc(db, USER_COLLECTION, user.uid);
  let userProfileDataForMapping: DocumentData;

  try {
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const existingProfileData = userDocSnap.data();
      const updates: { lastLoginAt: any; photoURL?: string | null; email?: string | null; username?: string; } = {
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

      await updateDoc(userDocRef, updates);
      
      const updatedDocSnap = await getDoc(userDocRef); 
      userProfileDataForMapping = updatedDocSnap.data()!;
    } else {
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
    }
    return mapDocToUserProfile(user.uid, userProfileDataForMapping);

  } catch (error: any) {
    console.error(`[ensureUserProfileExists] Firestore error for UID ${user.uid}: Message: ${error.message}, Code: ${error.code}`, error);
    // Throw a more generic error to the client to avoid exposing too much detail.
    throw new Error(`Failed to create or update the user profile due to a server error.`);
  }
}

/**
 * Fetches all user profiles from Firestore, intended for use in the admin panel.
 */
export async function getAllUsersFromFirestore(): Promise<UserProfile[]> {
  try {
    const usersCollectionRef = collection(db, USER_COLLECTION);
    const q = query(usersCollectionRef); 
    const querySnapshot = await getDocs(q);

    const users: UserProfile[] = [];
    if (querySnapshot.empty) {
      console.log("No users found in Firestore.");
    } else {
      querySnapshot.forEach((docSnap) => {
        users.push(mapDocToUserProfile(docSnap.id, docSnap.data()));
      });
    }
    users.sort((a, b) => a.username.localeCompare(b.username));
    return users;
  } catch (error: any) {
    console.error("Error fetching all users from Firestore:", error);
    // Re-throw the error so it can be caught by the calling page component
    // and displayed to the user in a more visible way.
    throw error;
  }
}
