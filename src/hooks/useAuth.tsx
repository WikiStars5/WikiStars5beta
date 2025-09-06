
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // User is signed in, either registered or anonymous.
        setFirebaseUser(fbUser);
        
        if (fbUser.isAnonymous) {
          setUser(null); // Anonymous users don't have a Firestore profile.
          setIsLoading(false);
          return; // Stop here for anonymous users.
        }

        // For registered users, set up the profile listener.
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            console.warn(`Profile for user ${fbUser.uid} not found in Firestore.`);
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error with profile snapshot listener:", error);
          setUser(null);
          setIsLoading(false);
        });
        
        // This is the cleanup function for the snapshot listener.
        return () => unsubscribeSnapshot();
      } else {
        // No user is signed in at all. Let's create an anonymous session.
        signInAnonymously(auth).catch((error) => {
          console.error("Critical error: Could not sign in anonymously.", error);
          // If even anonymous sign-in fails, stop loading and signal an error state.
          setIsLoading(false);
        });
        // The onAuthStateChanged listener will be called again automatically after
        // the anonymous user signs in, so we don't need to set loading to false here.
      }
    });

    // Cleanup the auth state listener when the component unmounts.
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
