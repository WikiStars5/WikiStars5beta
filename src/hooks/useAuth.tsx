
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
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        if (fbUser.isAnonymous) {
          // For anonymous users, we construct the profile locally.
          // This avoids race conditions with Firestore document creation.
          const guestUsername = localStorage.getItem('wikistars5-guestUsername') || `Invitado_${fbUser.uid.substring(0, 5)}`;
          const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
          
          setUser({
            uid: fbUser.uid,
            email: null,
            username: guestUsername,
            gender: guestGender,
            role: 'user',
            isAnonymous: true,
            createdAt: new Date().toISOString(),
            achievements: [], // Achievements for guests can be managed locally or synced later
          });
          setIsLoading(false);
          // We can still listen to the document for eventual updates (like achievements from server)
          // but we no longer depend on it for the initial user object.
          const unsubscribeSnapshot = onSnapshot(doc(db, 'users', fbUser.uid), (docSnap) => {
              if (docSnap.exists()) {
                  // If the doc exists, we can enrich the local profile with server data
                  const serverData = docSnap.data() as UserProfile;
                  setUser(prevUser => ({...(prevUser as UserProfile), ...serverData, username: prevUser?.username || serverData.username }));
              }
          });
          return () => unsubscribeSnapshot();

        } else {
          // For registered users, we fetch the profile from Firestore.
          const unsubscribeSnapshot = onSnapshot(doc(db, 'users', fbUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
            } else {
              // This case might happen for a brand new registered user if the cloud function is slow.
              // We can create a temporary local profile.
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                username: fbUser.displayName || `user_${fbUser.uid.substring(0, 5)}`,
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
      } else {
        // No user signed in, attempt anonymous sign-in
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
          setFirebaseUser(null);
          setUser(null);
          setIsLoading(false);
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  const isAnonymous = firebaseUser?.isAnonymous ?? true; // Default to true to be safe
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
