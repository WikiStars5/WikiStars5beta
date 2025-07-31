
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        // If the user is anonymous, immediately construct a profile from localStorage
        // This ensures the UI has a user object right away and avoids race conditions.
        if (fbUser.isAnonymous) {
          const guestUsername = localStorage.getItem('wikistars5-guestUsername') || `Invitado_${fbUser.uid.substring(0, 5)}`;
          const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
          const guestCountryCode = localStorage.getItem('wikistars5-guestCountry') || '';

          setUser({
            uid: fbUser.uid,
            email: null,
            username: guestUsername,
            gender: guestGender,
            isAnonymous: true,
            role: 'user',
            createdAt: new Date().toISOString(),
            achievements: [],
            countryCode: guestCountryCode,
            photoURL: null,
          });
        }
        
        // Listen for Firestore updates to get roles, achievements, etc.
        const unsubscribeSnapshot = onSnapshot(
          doc(db, 'users', fbUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              // Merge Firestore data with existing state to preserve local data if needed
              setUser(prevUser => ({...prevUser, ...docSnap.data()} as UserProfile));
            }
            // No 'else' needed here for anonymous, as we've already set a profile.
            // For registered users who might not have a profile yet (due to function delay),
            // this will eventually update.
            setIsLoading(false);
          },
          (error) => {
            console.error("Error listening to user profile:", error);
            // Don't nullify user if we already have a guest profile
            if (!fbUser.isAnonymous) {
              setUser(null);
            }
            setIsLoading(false);
          }
        );
        return () => unsubscribeSnapshot();
      } else {
        // No user is signed in.
        try {
          const userCredential = await signInAnonymously(auth);
          setFirebaseUser(userCredential.user);
          // The onAuthStateChanged will re-trigger with the new anonymous user
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
          setFirebaseUser(null);
          setUser(null);
          setIsLoading(false);
        }
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
