
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
 * Fetches a user's profile from Firestore.
 * Returns null if the profile does not exist or if an error occurs.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) {
    console.error("getUserProfile: UID is required.");
    return null;
  }
  try {
    const userDocRef = doc(db, USER_COLLECTION, uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return mapDocToUserProfile(uid, userDocSnap.data());
    } else {
      console.log(`User profile not found for UID: ${uid}`);
      // Return null instead of creating a profile here. Let ensureUserProfileExists handle creation.
      return null;
    }
  } catch (error) {
    console.error(`Error fetching user profile for UID ${uid}:`, error);
    // Return null to allow the UI to handle the "not found" or error case gracefully.
    return null;
  }
}


export async function getAllUserAttitudes(userId: string): Promise<Record<string, AttitudeKey>> {
    if (!userId) return {};
    try {
        const attitudes: Record<string, AttitudeKey> = {};
        const attitudesCollectionRef = collection(db, 'userAttitudes');
        
        // Query by document ID range instead of a 'where' clause on a field.
        // This is more robust as it doesn't require a custom Firestore index.
        const q = query(
            attitudesCollectionRef, 
            orderBy('__name__'), // This is the document ID
            startAt(userId + '_'), // Start with docs that have this user's ID as a prefix
            endAt(userId + '_\uf8ff') // End at the last possible character combination after the prefix
        );

        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const data = doc.data() as UserAttitude;
            if (data.figureId) {
                attitudes[data.figureId] = data.attitude;
            }
        });
        return attitudes;
    } catch (error: any) {
        console.error("Error fetching all user attitudes: ", error);
        // Re-throw the error so the calling page can handle it and show a message
        // in case of permission errors or other unexpected issues.
        throw error;
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
    const userDocRef = doc(db, USER_COLLECTION, uid);
    const updateData: any = { ...data, lastLoginAt: serverTimestamp() };

    if (data.hasOwnProperty('countryCode')) { 
      if (data.countryCode === '') {
        updateData.country = ''; 
      } else {
        const selectedCountry = COUNTRIES.find(c => c.code === data.countryCode);
        updateData.country = selectedCountry ? selectedCountry.name : '';
      }
    } else if (data.hasOwnProperty('country') && data.country === '') {
        updateData.countryCode = ''; 
    }
    
    await updateDoc(userDocRef, updateData);
  } catch (error: any) {
    console.error(`[updateUserProfile] Error updating profile for UID ${uid}:`, error);
    throw new Error(`Failed to update user profile. Firebase error: ${error.message}`);
  }
}


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
    if (String(error.message).toLowerCase().includes("permission")) {
      console.error("Firestore permission error: Check your security rules for the 'registered_users' collection to ensure the admin has 'list' permissions.");
    } else if (String(error.message).toLowerCase().includes("index")) {
      console.error("Firestore index error: An index is required for the query. Check the browser console for a link to create it.");
    }
    return [];
  }
}
