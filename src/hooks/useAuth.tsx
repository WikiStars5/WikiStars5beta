
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
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          
          if (profile.isAnonymous) {
             const guestUsername = localStorage.getItem('wikistars5-guestUsername');
             const guestGender = localStorage.getItem('wikistars5-guestGender');
             const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode');

             setUser({
                 ...profile,
                 username: guestUsername || profile.username || `Invitado_${currentUser!.uid.substring(0,5)}`,
                 gender: guestGender || profile.gender || '',
                 countryCode: guestCountryCode || profile.countryCode || '',
             });

          } else {
             setUser({ ...profile, isAnonymous: false });
          }

        } else {
          // Fallback for when Firestore doc is not ready yet
          setUser({
              uid: currentUser!.uid,
              email: currentUser!.email,
              username: currentUser!.displayName || `Invitado_${currentUser!.uid.substring(0,5)}`,
              role: 'user',
              isAnonymous: currentUser!.isAnonymous,
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
    });

    return () => unsubscribeAuth();
  }, []);
  
  const isAnonymous = user?.isAnonymous ?? true;
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
