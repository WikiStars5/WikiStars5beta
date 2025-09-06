
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean; // This will now represent only the INITIAL auth state loading
  isAnonymous: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAnonymous: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True only on initial app load
  const { toast } = useToast();

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle setting users to null
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      window.location.href = '/';
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({ title: "Cierre de Sesión Fallido", description: "No se pudo cerrar tu sesión.", variant: "destructive" });
    }
  }, [toast]);

  // Effect for handling Firebase Auth state changes (login, logout, initial load)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
      } else {
        // No user is logged in, and no anonymous session exists.
        // This will trigger the useEffect below to sign in anonymously.
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false); // Auth state resolved, stop initial loading.
    });

    return () => unsubscribe();
  }, []);

  // Effect for fetching Firestore profile OR creating anonymous session
  useEffect(() => {
    if (isLoading) return; // Wait for initial auth state to be determined

    if (firebaseUser) {
      if (firebaseUser.isAnonymous) {
        setUser(null); // No profile for anonymous users
        return;
      }
      
      // It's a registered user, listen for their profile.
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUser(docSnap.data() as UserProfile);
        } else {
          // This can happen briefly after registration before the profile is created.
          setUser(null);
        }
      }, (error) => {
        console.error("Error with profile snapshot listener:", error);
        setUser(null);
      });
      return () => unsubscribeSnapshot();

    } else {
      // Not loading, and no firebaseUser. This means we need an anonymous session.
      signInAnonymously(auth).catch((error) => {
         console.error("Critical error: Could not sign in anonymously.", error);
      });
    }

  }, [firebaseUser, isLoading]); // Reruns when user logs in/out or on initial load
  
  const isAnonymous = firebaseUser?.isAnonymous ?? false;
  const value = { user, firebaseUser, isLoading, isAnonymous, logout };

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
