'use server';

import { db } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';
import type { DocumentData } from 'firebase-admin/firestore';

const USER_COLLECTION = 'registered_users';

const convertTimestampToString = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;
  // Firestore admin SDK timestamp
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  // ISO string
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


export async function getAllUsers(): Promise<{ success: boolean; users?: UserProfile[]; error?: string }> {
  try {
    const usersCollectionRef = db.collection(USER_COLLECTION);
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
    console.error("Error fetching all users from Firestore via Server Action:", error);
    if (error.code === 'permission-denied' || String(error.message).toLowerCase().includes("permission")) {
        return { success: false, error: 'Error de permisos de Firestore. Revisa las reglas de seguridad.' };
    }
    return { success: false, error: error.message || 'Un error desconocido ocurrió.' };
  }
}
