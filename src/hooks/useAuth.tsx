
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';
import { auth, db, app } from '@/lib/firebase'; // Import 'app' to ensure initialization
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

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
  isAnonymous: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // By explicitly referencing 'app', we ensure the firebase.ts module runs and initializes.
    if (!app) {
      console.error("Firebase app not initialized!");
      setIsLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        if (fbUser.isAnonymous) {
          setUser(null); 
          setIsLoading(false);
          return;
        }

        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            console.warn(`Profile for user ${fbUser.uid} not found.`);
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error with profile snapshot listener:", error);
          setUser(null);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        signInAnonymously(auth).catch((error) => {
            console.error("Error signing in anonymously:", error);
            setIsLoading(false);
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  const isAnonymous = firebaseUser?.isAnonymous ?? false;
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
