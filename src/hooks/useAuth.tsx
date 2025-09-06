
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
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
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // User is signed in, either registered or anonymous
        setFirebaseUser(fbUser);
        
        if (fbUser.isAnonymous) {
          setUser(null); // Anonymous users don't have a Firestore profile
          setIsLoading(false);
          return; // Stop here for anonymous users
        }

        // For registered users, fetch their Firestore profile
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

        // Return the cleanup function for the snapshot listener
        return () => unsubscribeSnapshot();
      } else {
        // No user is signed in, so we sign them in anonymously.
        signInAnonymously(auth).catch((error) => {
          console.error("Error signing in anonymously:", error);
          // If anonymous sign-in fails, we are not loading anymore
          setUser(null);
          setFirebaseUser(null);
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
