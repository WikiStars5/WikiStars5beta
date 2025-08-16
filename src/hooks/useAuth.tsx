
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
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

        const userDocRef = doc(db, 'users', fbUser.uid);

        const setupSnapshotListener = () => {
          return onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
            } else {
              setUser(null);
            }
            setIsLoading(false);
          }, (error) => {
            console.error("Error with profile snapshot listener:", error);
            setUser(null);
            setIsLoading(false);
          });
        };

        const tryFetchingProfileWithRetry = async (retries = 3, delay = 1000) => {
            for (let i = 0; i < retries; i++) {
                try {
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        return setupSnapshotListener();
                    }
                } catch (error) {
                    console.error(`Attempt ${i + 1} to fetch profile failed:`, error);
                }
                await new Promise(res => setTimeout(res, delay));
            }
            // If all retries fail, setup the listener anyway and let it handle the case where the doc might appear later.
            return setupSnapshotListener();
        };

        const docSnap = await getDoc(userDocRef);
        let unsubscribeSnapshot;
        if (docSnap.exists()) {
          unsubscribeSnapshot = setupSnapshotListener();
        } else {
          // If the document doesn't exist, it might be in the process of being created by the Cloud Function.
          // Retry a few times before setting up the final listener.
          unsubscribeSnapshot = await tryFetchingProfileWithRetry();
        }

        return () => unsubscribeSnapshot;

      } else {
        // No user signed in, attempt anonymous sign-in
        try {
          await signInAnonymously(auth);
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
