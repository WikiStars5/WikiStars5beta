
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
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        setIsAnonymous(fbUser.isAnonymous);

        // If user is anonymous, immediately construct a profile from localStorage
        // This provides an instant, non-null profile object for guests.
        if (fbUser.isAnonymous) {
          const guestUsername = localStorage.getItem('wikistars5-guestUsername') || `Invitado_${fbUser.uid.substring(0,5)}`;
          const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
          const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode') || '';
          
          setUser({
            uid: fbUser.uid,
            email: null,
            username: guestUsername,
            gender: guestGender,
            countryCode: guestCountryCode,
            country: '', // Country name can be derived or left empty for guests
            role: 'user',
            isAnonymous: true,
            createdAt: new Date().toISOString(),
            achievements: [],
          });
          setIsLoading(false); // Stop loading, guest profile is ready
        }

        // Listen for Firestore updates for both guest and registered users in the background
        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileFromDb = docSnap.data() as UserProfile;
            
            // For registered users, this is their source of truth
            if (!profileFromDb.isAnonymous) {
              setUser({ ...profileFromDb, isAnonymous: false });
            } else {
              // For guests, we can enrich their locally-built profile with DB data like achievements
              setUser(currentLocalProfile => ({
                  ...currentLocalProfile!, // Non-null assertion is safe here
                  ...profileFromDb, // Overwrite with any fresher data from DB
              }));
            }
          }
          // If the doc doesn't exist, we don't overwrite the profile. The onUserCreate function will handle it.
          // For guests, their local profile is already set. For registered users, we wait.
          if (!fbUser.isAnonymous) {
             setIsLoading(false); // Stop loading for registered users after first snapshot attempt
          }
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setUser(null);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // No user, attempt anonymous sign-in
        try {
          await signInAnonymously(auth);
          // The onAuthStateChanged will re-trigger with the new anonymous user
        } catch (error) {
          console.error("Critical error: Could not sign in anonymously.", error);
          setUser(null);
          setFirebaseUser(null);
          setIsAnonymous(true);
          setIsLoading(false);
        }
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
