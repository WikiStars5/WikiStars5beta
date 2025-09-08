

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ADMIN_UID } from '@/config/admin';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoading(true);
      setFirebaseUser(user);
      if (!user) {
        // User is signed out
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
      if (!firebaseUser) {
        // No need to fetch profile if there's no firebase user
        return;
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data() as UserProfile);
        } else {
          setCurrentUser(null);
        }
         // Set loading to false only after we have attempted to fetch the profile
        setIsLoading(false);
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setCurrentUser(null);
        setIsLoading(false);
      });

      return () => unsubscribeProfile();
  }, [firebaseUser]);

  const isAdmin = currentUser?.role === 'admin' && currentUser?.uid === ADMIN_UID;

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const value = {
    firebaseUser,
    currentUser,
    isAdmin,
    isLoading,
    signIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
