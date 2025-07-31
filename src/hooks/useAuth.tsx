
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
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Determine anonymity instantly from the Firebase user object
        const isUserAnonymous = fbUser.isAnonymous;
        setIsAnonymous(isUserAnonymous);

        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else if (isUserAnonymous) {
            // Build a local guest profile immediately if the Firestore doc doesn't exist yet.
            // This is crucial for the profile page to load correctly without errors.
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
          } else {
            // This is a registered user without a profile doc.
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setUser(null);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // No user logged in at all. Reset all states.
        setFirebaseUser(null);
        setUser(null);
        setIsAnonymous(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
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
