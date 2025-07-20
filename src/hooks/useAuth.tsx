
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        // Use onSnapshot to listen for real-time updates to the user's profile
        const unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data() as UserProfile;
            setUser({
              ...userData,
              uid: doc.id,
              // Ensure timestamps are handled correctly if they exist
              createdAt: userData.createdAt ? new Date(userData.createdAt).toISOString() : new Date().toISOString(),
              lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt).toISOString() : undefined,
            });
          } else {
            // This case might happen if the user is in auth but not in firestore.
            // For this app's logic, we log them out.
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setUser(null);
          setIsLoading(false);
        });
        
        // Return the unsubscribe function for the profile listener
        return () => unsubProfile();

      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Return the unsubscribe function for the auth state listener
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
