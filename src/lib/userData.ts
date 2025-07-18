
"use server";

import { dbAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';
import type { UserRecord } from 'firebase-admin/auth';
import { COUNTRIES } from '@/config/countries'; 

// Correct collection name
const USER_COLLECTION = 'users';

const db = dbAdmin; // Use the admin instance of Firestore

export async function ensureUserProfileExists(
  user: UserRecord, 
  additionalData: { countryCode?: string; gender?: string }
): Promise<void> {
  if (!user || !user.uid) {
    throw new Error("Valid Firebase user object is required.");
  }

  const userDocRef = db.collection(USER_COLLECTION).doc(user.uid);

  try {
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      // User profile already exists, just update last login time and any changed info
      const existingProfileData = userDocSnap.data()!;
      const updates: { [key: string]: any } = {
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Sync data from Auth provider (e.g., if user changed their Google profile pic)
      if (user.photoURL && user.photoURL !== existingProfileData.photoURL) {
        updates.photoURL = user.photoURL;
      }
      if (user.email && user.email !== existingProfileData.email) {
        updates.email = user.email;
      }
      const currentUsername = existingProfileData.username;
      const authDisplayName = user.displayName;

      if (authDisplayName && authDisplayName !== currentUsername) {
        updates.username = authDisplayName;
      }
      
      await userDocRef.update(updates);

    } else {
      // User profile does not exist, create it.
      const selectedCountry = additionalData?.countryCode ? COUNTRIES.find(c => c.code === additionalData.countryCode) : null;
      
      const newProfileData: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & { createdAt: any; lastLoginAt: any; } = {
        uid: user.uid,
        email: user.email || null,
        username: user.displayName || user.email?.split('@')[0] || `user_${user.uid.substring(0, 6)}`,
        photoURL: user.photoURL || null,
        country: selectedCountry ? selectedCountry.name : '',
        countryCode: additionalData?.countryCode || '',
        gender: additionalData?.gender || '', 
        role: 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        fcmToken: '',
        achievements: [], // Start with an empty list of achievements
      };
      await userDocRef.set(newProfileData);
    }

  } catch (error: any) {
    console.error(`[ensureUserProfileExists] Firestore error for UID ${user.uid}: Message: ${error.message}, Code: ${error.code}`, error);
    throw new Error(`Failed to create or update the user profile due to a server error.`);
  }
}
