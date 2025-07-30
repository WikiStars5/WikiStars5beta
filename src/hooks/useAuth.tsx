
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
        // User is signed in, now get their profile from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        
        // Use onSnapshot to listen for real-time updates to the user's profile
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
            setIsLoading(false);
          } else {
            // This is the critical part. If the user is authenticated but the profile
            // doesn't exist, it might be due to creation lag. We wait a bit.
            setTimeout(async () => {
              const freshSnap = await getDoc(userDocRef);
              if (freshSnap.exists()) {
                setUser(freshSnap.data() as UserProfile);
              } else {
                 // After waiting, if it's still not there, we assume no profile.
                console.warn("User is authenticated, but no profile document found in Firestore after delay.");
                setUser(null);
              }
              setIsLoading(false);
            }, 2500); // Wait 2.5 seconds for the backend function to run.
          }
        }, (error) => {
            console.error("Error listening to user profile:", error);
            setUser(null);
            setIsLoading(false);
        });

        // Return the snapshot listener's unsubscribe function
        return () => unsubscribeSnapshot();

      } else {
        // User is signed out
        setUser(null);
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
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
