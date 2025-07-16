
'use server';

import { db as adminDb, auth as adminAuth } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';
import type { DocumentData } from 'firebase-admin/firestore';

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
  };
};

// This function now uses the 'firebase-admin' SDK via the centralized admin file.
// It is intended to be called ONLY from Server Components or other Server Actions.
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCollectionRef = adminDb.collection('registered_users');
    const querySnapshot = await usersCollectionRef.orderBy('username').get();

    if (querySnapshot.empty) {
      return [];
    }

    const users = querySnapshot.docs.map(doc => mapDocToUserProfile(doc.id, doc.data()));
    return users;

  } catch (error: any) {
    console.error("[Server Action] Error fetching all users:", error);
    // Propagate a clear error message. This helps in debugging Firestore rule issues.
    throw new Error(`Failed to fetch users. Firestore error: ${error.message}`);
  }
}
