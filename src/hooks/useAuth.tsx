
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
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Manually clear state immediately for instant UI feedback
      setUser(null);
      setFirebaseUser(null);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      // The onAuthStateChanged listener will handle redirecting to an anonymous session.
      window.location.href = '/';
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({ title: "Cierre de Sesión Fallido", description: "No se pudo cerrar tu sesión.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        if (fbUser.isAnonymous) {
          setUser(null);
          setIsLoading(false);
        } else {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
            } else {
              // This can happen briefly after account creation before the profile is created.
              // We'll set user to null, but keep listening.
              setUser(null);
            }
            // Always set loading to false after attempting to fetch the profile.
            // This is the key fix for the infinite spinner.
            setIsLoading(false);
          }, (error) => {
            console.error("Error with profile snapshot listener:", error);
            setUser(null);
            // Also ensure loading is false on error.
            setIsLoading(false);
          });
          return () => unsubscribeSnapshot();
        }
      } else {
        // No user is signed in at all. Begin anonymous sign-in.
        setIsLoading(true); 
        try {
            await signInAnonymously(auth);
            // The onAuthStateChanged listener will be called again with the new anonymous user.
        } catch (error) {
           console.error("Critical error: Could not sign in anonymously.", error);
           setIsLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
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
