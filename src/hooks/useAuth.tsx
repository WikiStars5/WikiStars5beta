
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const unsubscribeSnapshot = onSnapshot(doc(db, 'users', fbUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
             // This might happen if the user is new and the Cloud Function hasn't created the profile yet.
            // Or if the user is anonymous. For anonymous, we can build a local profile.
            if (fbUser.isAnonymous) {
              // For anonymous users, create a local profile, but prioritize saved guest info.
              const savedGuestName = localStorage.getItem('wikistars5-guestUsername');
              const savedGuestGender = localStorage.getItem('wikistars5-guestGender');
              
              setUser({
                uid: fbUser.uid,
                email: null,
                username: savedGuestName || `Invitado_${fbUser.uid.substring(0,5)}`,
                role: 'user',
                createdAt: new Date().toISOString(),
                isAnonymous: true,
                gender: savedGuestGender || '',
              });
            } else {
               setUser(null);
            }
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUser(null);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // No user signed in, attempt anonymous sign-in
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged will be triggered again with the new anonymous user
        } catch (error) {
           console.error("Critical: Anonymous sign-in failed:", error);
           setUser(null);
           setFirebaseUser(null);
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
