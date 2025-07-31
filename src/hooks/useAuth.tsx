
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
      let currentUser = fbUser;
      if (!currentUser) {
        try {
          const userCredential = await signInAnonymously(auth);
          currentUser = userCredential.user;
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          setIsLoading(false);
          return;
        }
      }

      setFirebaseUser(currentUser);
      
      // If user is anonymous, build a local profile first for speed and reliability.
      if (currentUser.isAnonymous) {
          const guestUsername = localStorage.getItem('wikistars5-guestUsername');
          const guestGender = localStorage.getItem('wikistars5-guestGender');
          
          const guestProfile: UserProfile = {
              uid: currentUser.uid,
              email: null,
              username: guestUsername || `Invitado_${currentUser.uid.substring(0,5)}`,
              gender: guestGender || '',
              photoURL: null,
              role: 'user',
              createdAt: new Date().toISOString(),
              isAnonymous: true,
              achievements: [], // We can still enrich this from Firestore later
          };
          setUser(guestProfile);
          setIsLoading(false); // We have enough to show the profile now.
          
          // We can still listen for Firestore updates for achievements etc. in the background
          const userDocRef = doc(db, 'users', currentUser.uid);
           const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const firestoreProfile = docSnap.data() as UserProfile;
                    // Merge local data with Firestore data, giving local precedence for core fields
                    setUser(prevProfile => ({
                        ...firestoreProfile, // Base from firestore (achievements, role)
                        ...prevProfile,      // Overwrite with local state
                        username: guestUsername || firestoreProfile.username,
                        gender: guestGender || firestoreProfile.gender,
                    }));
                }
           });
           return () => unsubscribeSnapshot();
      } else {
        // For registered users, fetch from Firestore.
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUser({ ...profile, isAnonymous: false });
          } else {
            // User exists in Auth but not Firestore, might happen with deletions or delays.
            // Create a temporary profile. onUserCreate should eventually fix this.
             setUser({
                uid: currentUser!.uid,
                email: currentUser!.email,
                username: currentUser!.displayName || "Usuario",
                role: 'user',
                isAnonymous: false,
                createdAt: new Date().toISOString(),
             });
          }
          setIsLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setUser(null);
          setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
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
