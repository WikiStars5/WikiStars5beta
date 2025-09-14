
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { auth, db, callFirebaseFunction } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  linkWithCredential,
  GoogleAuthProvider,
  type User as FirebaseUser,
  type AuthCredential
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
  isAnonymous: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (username: string, countryCode: string, gender: string) => Promise<void>;
  linkAccount: (credential: AuthCredential) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setFirebaseUser(user);
      } else {
        // If no user, sign in anonymously to get a UID for guest actions.
        try {
          const userCredential = await signInAnonymously(auth);
          setFirebaseUser(userCredential.user);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
          setFirebaseUser(null);
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
      if (!firebaseUser) {
        return;
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeProfile = onSnapshot(userDocRef, (userDocSnap) => {
        if (userDocSnap.exists()) {
          setCurrentUser(userDocSnap.data() as UserProfile);
        } else {
          // Profile might not be created yet for a new anonymous user. This is fine.
          // The createProfileOnRegister function will handle it.
          setCurrentUser(null);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setCurrentUser(null);
        setIsLoading(false);
      });

      return () => unsubscribeProfile();
  }, [firebaseUser]);

  const isAdmin = currentUser?.role === 'admin' && currentUser?.uid === ADMIN_UID;
  const isAnonymous = firebaseUser ? firebaseUser.isAnonymous : true;

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const logout = async () => {
    await signOut(auth);
    // After signing out, onAuthStateChanged will trigger and sign in a new anonymous user.
    router.push('/');
  };
  
  const linkAccount = async (credential: AuthCredential) => {
    if (!auth.currentUser) throw new Error("No user to link.");
    await linkWithCredential(auth.currentUser, credential);
    // After linking, the onAuthStateChanged listener will automatically receive the updated user state.
    // Firestore profile will be updated by the onUserCreate function (it also triggers on link).
  };

  const updateUserProfile = async (username: string, countryCode: string, gender: string) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found.");
    }
    
    await updateProfile(auth.currentUser, { displayName: username });
    
    await callFirebaseFunction('updateUserProfile', {
      username,
      countryCode,
      gender
    });
  };

  const value = {
    firebaseUser,
    currentUser,
    isAdmin,
    isLoading,
    isAnonymous,
    signIn,
    logout,
    updateUserProfile,
    linkAccount,
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
