
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
        setFirebaseUser(fbUser);
        const isAnon = fbUser.isAnonymous;

        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else if (isAnon) {
            // If the doc doesn't exist AND the user is anonymous, create a local profile.
            // This prevents registered users without a profile doc from being treated as guests.
            setUser({
              uid: fbUser.uid,
              email: null,
              username: localStorage.getItem('wikistars5-guestUsername') || `Invitado_${fbUser.uid.substring(0, 5)}`,
              gender: localStorage.getItem('wikistars5-guestGender') || '',
              photoURL: null,
              role: 'user',
              isAnonymous: true,
              createdAt: new Date().toISOString(),
              achievements: [],
              country: '',
              countryCode: '',
            });
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setUser(null);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // User is not logged in at all.
        setUser(null);
        setFirebaseUser(null);
        setIsLoading(false);
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
