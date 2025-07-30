
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in, listen for their profile from Firestore.
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            // This can happen briefly after registration before the cloud function runs.
            // By setting user to null, we ensure UI reflects the "profile not found" state.
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setUser(null);
            setIsLoading(false);
        });

        // Return the snapshot listener's unsubscribe function.
        return () => unsubscribeSnapshot();
      } else {
        // User is signed out.
        setUser(null);
        setFirebaseUser(null);
        setIsLoading(false);
      }
    });

    // Cleanup auth subscription on unmount.
    return () => unsubscribe();
  }, []);
  
  const value = { user, firebaseUser, isLoading };

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
