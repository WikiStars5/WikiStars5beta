
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
  isAnonymous: true,
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

        // If user is anonymous, immediately construct a profile from localStorage.
        // This provides an instant, non-null profile object for guests and prevents race conditions.
        if (isAnon) {
          const guestUsername = localStorage.getItem('wikistars5-guestUsername') || `Invitado_${fbUser.uid.substring(0,5)}`;
          const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
          
          const localGuestProfile: UserProfile = {
            uid: fbUser.uid,
            email: null,
            username: guestUsername,
            gender: guestGender,
            country: '',
            countryCode: '',
            photoURL: null,
            role: 'user',
            isAnonymous: true,
            createdAt: new Date().toISOString(),
            achievements: [],
          };
          setUser(localGuestProfile);
        }

        // Listen for Firestore updates for both guest and registered users.
        // This will enrich the profile (e.g., with achievements for guests) or load the full profile for registered users.
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileFromDb = docSnap.data() as UserProfile;
            // For registered users, this is their source of truth.
            // For guests, this merges DB data (like achievements) into their local profile.
            setUser(currentProfile => ({
                ...(currentProfile || {}), // Start with current profile (local guest or empty)
                ...profileFromDb,         // Overwrite with DB data
                isAnonymous: isAnon       // Ensure anonymity status is correct
            } as UserProfile));
          }
          // If the doc doesn't exist, we do nothing and keep the locally constructed profile for guests.
          // The onUserCreate cloud function will eventually create the doc.
          setIsLoading(false); // Stop loading after the first snapshot attempt.
        }, (error) => {
          console.error("Error listening to user profile:", error);
          if (!isAnon) setUser(null); // Only nullify for registered users on error
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // No user, attempt anonymous sign-in
        try {
          await signInAnonymously(auth);
          // The onAuthStateChanged will re-trigger with the new anonymous user.
        } catch (error) {
          console.error("Critical error: Could not sign in anonymously.", error);
          setUser(null);
          setFirebaseUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  const isAnonymous = firebaseUser?.isAnonymous ?? true;
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
