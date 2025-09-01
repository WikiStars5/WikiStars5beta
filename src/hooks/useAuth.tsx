"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
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
    // This listener correctly handles all auth state changes without forcing a login.
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // A user is signed in (can be anonymous or registered).
        setFirebaseUser(fbUser);
        
        if (fbUser.isAnonymous) {
          // If anonymous, there's no Firestore profile to fetch.
          setUser(null); 
          setIsLoading(false);
          return;
        }

        // For registered users, listen to their profile document for real-time updates.
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

        // Cleanup the profile listener when the user changes.
        return () => unsubscribeSnapshot();
      } else {
        // No user is signed in at all.
        setUser(null);
        setFirebaseUser(null);
        setIsLoading(false);
      }
    });

    // Cleanup the main auth listener when the component unmounts.
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
