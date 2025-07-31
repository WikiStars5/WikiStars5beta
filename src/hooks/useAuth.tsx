
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser, signInAnonymously } from 'firebase/auth';
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
        setFirebaseUser(fbUser);
        
        // If the user is registered (not anonymous), fetch their profile from Firestore.
        if (!fbUser.isAnonymous) {
          const unsubscribeSnapshot = onSnapshot(doc(db, 'users', fbUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
            } else {
              // This can happen if the cloud function is slow to create the profile.
              // We create a temporary local profile to avoid showing an error.
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                username: fbUser.displayName || `user_${fbUser.uid.substring(0, 5)}`,
                role: 'user',
                createdAt: new Date().toISOString(),
              });
            }
            setIsLoading(false);
          }, (error) => {
            console.error("Error fetching registered user profile:", error);
            setUser(null);
            setIsLoading(false);
          });
          return () => unsubscribeSnapshot();
        } else {
          // **THE FIX**: If the user is anonymous, build the profile locally
          // from localStorage instead of waiting for a Firestore document that might not exist yet.
          // This avoids the race condition and ensures the guest profile is always available.
          const guestUsername = localStorage.getItem('wikistars5-guestUsername') || `Invitado_${fbUser.uid.substring(0, 5)}`;
          const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
          
          setUser({
            uid: fbUser.uid,
            email: null,
            username: guestUsername,
            gender: guestGender,
            role: 'user',
            isAnonymous: true,
            createdAt: new Date().toISOString(),
            achievements: [], 
          });
          setIsLoading(false);
        }

      } else {
        // No user is signed in, attempt to sign in anonymously.
        // This will trigger the onAuthStateChanged listener again once complete.
        signInAnonymously(auth).catch((error) => {
          console.error("Critical: Anonymous sign-in failed:", error);
          // If anonymous sign-in fails, there's a fundamental issue.
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
