
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
});

// Helper function to retry fetching the user profile
const fetchUserProfileWithRetry = async (uid: string, retries = 5, delay = 500): Promise<UserProfile | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      // Wait before retrying
      await new Promise(res => setTimeout(res, delay));
    } catch (error) {
      console.error(`Attempt ${i+1} to fetch profile failed:`, error);
    }
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await fetchUserProfileWithRetry(fbUser.uid);
        setUser(profile);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const value = { user, firebaseUser, isLoading };

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
