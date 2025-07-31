
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { ADMIN_UID } from '@/config/admin';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAnonymous: true,
});

// Helper function to create a user profile if it doesn't exist
const createUserProfileIfNeeded = async (user: FirebaseUser): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', user.uid);
  let docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: user.email || null,
      username: user.isAnonymous 
        ? `Invitado_${user.uid.substring(0, 5)}`
        : (user.displayName || user.email?.split('@')[0] || `Usuario_${user.uid.substring(0,5)}`),
      country: '',
      countryCode: '',
      gender: '',
      photoURL: user.photoURL || null,
      role: user.uid === ADMIN_UID ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      achievements: [],
    };
    await setDoc(userDocRef, newUserProfile);
    // After writing, refetch the document to get a consistent object
    docSnap = await getDoc(userDocRef);
  }
  
  return docSnap.data() as UserProfile;
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        // User is signed in (either permanently or anonymously)
        setFirebaseUser(fbUser);
        const profile = await createUserProfileIfNeeded(fbUser);
        setUser(profile);
      } else {
        // No user is signed in, so sign them in anonymously.
        try {
          const userCredential = await signInAnonymously(auth);
          setFirebaseUser(userCredential.user);
          const profile = await createUserProfileIfNeeded(userCredential.user);
          setUser(profile);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          // Handle error case, maybe show a global error message
          setUser(null);
          setFirebaseUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);
  
  const isAnonymous = firebaseUser?.isAnonymous ?? true;
  const value = { user, firebaseUser, isLoading, isAnonymous };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
