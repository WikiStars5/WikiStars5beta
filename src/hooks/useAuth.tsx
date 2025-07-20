
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  rawUser: User | null; // Raw firebase user
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  rawUser: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setRawUser(firebaseUser);
      if (firebaseUser) {
        // For now, we don't have a users collection, so we create a mock profile
        const userProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || 'Usuario',
            photoURL: firebaseUser.photoURL,
            role: 'user', // default role
            createdAt: new Date().toISOString(),
        };
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, rawUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
