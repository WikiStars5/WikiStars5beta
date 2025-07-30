
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
        const userProfile = docSnap.data() as UserProfile;
        // Also listen for real-time updates to the profile
        // This is not standard practice inside a fetch function, but demonstrates one way to ensure data is fresh.
        // A better approach would be to manage the listener separately in the main effect.
        return userProfile;
      }
      // Wait before retrying
      await new Promise(res => setTimeout(res, delay * (i + 1))); // increase delay
    } catch (error) {
      console.error(`Attempt ${i+1} to fetch profile for ${uid} failed:`, error);
    }
  }
  console.error(`Failed to fetch profile for ${uid} after ${retries} retries.`);
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userProfile = await fetchUserProfileWithRetry(fbUser.uid);
        if (userProfile) {
          setUser(userProfile);
        } else {
           setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
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
