

"use server";

import { db as adminDb } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type DocumentData, collection, query, getDocs, orderBy, where, deleteDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase-auth';
import { COUNTRIES } from '@/config/countries'; 

const USER_COLLECTION = 'registered_users';

const db = adminDb; // Use the admin instance of Firestore


export async function ensureUserProfileExists(
  user: FirebaseUser, 
  additionalData: { countryCode?: string; gender?: string }
): Promise<UserProfile> {
  if (!user || !user.uid) {
    throw new Error("Valid Firebase user object is required.");
  }

  const userDocRef = db.collection(USER_COLLECTION).doc(user.uid);

  try {
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      const existingProfileData = userDocSnap.data()!;
      const updates: { [key: string]: any } = {
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

      await userDocRef.update(updates);
      const updatedDocSnap = await userDocRef.get();
      // We are not returning a UserProfile here as it is not needed on the client for this flow.
      // This function now just ensures the data exists.
    } else {
      const selectedCountry = additionalData?.countryCode ? COUNTRIES.find(c => c.code === additionalData.countryCode) : null;
      
      const newProfileData = {
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
        fcmToken: '',
      };
      await userDocRef.set(newProfileData);
    }

  } catch (error: any) {
    console.error(`[ensureUserProfileExists] Firestore error for UID ${user.uid}: Message: ${error.message}, Code: ${error.code}`, error);
    throw new Error(`Failed to create or update the user profile due to a server error.`);
  }

  // The return value is not used in the final implementation, so we return a placeholder.
  // The primary goal is to write data to Firestore.
  const finalDoc = await userDocRef.get();
  const convertTimestampToString = (timestamp: any): string => {
      if (timestamp && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().toISOString();
      }
      return new Date().toISOString();
  };
  return {
      uid: user.uid,
      email: finalDoc.data()?.email || null,
      username: finalDoc.data()?.username || '',
      role: 'user',
      createdAt: convertTimestampToString(finalDoc.data()?.createdAt),
  };
}

// The getAllUsersFromFirestore function has been moved to a server action in `src/app/actions/userActions.ts`
// to resolve build issues with 'firebase-admin'. This file now only contains the `ensureUserProfileExists`
// function which is used during authentication flows.
