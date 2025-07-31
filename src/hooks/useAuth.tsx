
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
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
        setFirebaseUser(fbUser);
        const unsubscribeSnapshot = onSnapshot(
          doc(db, 'users', fbUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
            } else if (fbUser.isAnonymous) {
              // If the user is anonymous and has no profile, create a default local one.
              // The createProfileOnRegister function will handle the database entry.
              setUser({
                uid: fbUser.uid,
                email: null,
                username: `Invitado_${fbUser.uid.substring(0, 5)}`,
                isAnonymous: true,
                role: 'user',
                createdAt: new Date().toISOString(),
                achievements: [],
              });
            }
            // We are done loading ONLY when we have a user object (from firestore or local fallback)
            setIsLoading(false);
          },
          (error) => {
            console.error("Error listening to user profile:", error);
            setUser(null);
            setIsLoading(false);
          }
        );
        return () => unsubscribeSnapshot();
      } else {
        // No user signed in, attempt anonymous sign-in
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed on initial load:", error);
          // If even anonymous sign-in fails, we stop loading and show an error state.
          setFirebaseUser(null);
          setUser(null);
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
