
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import { auth, db, callFirebaseFunction } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  linkWithCredential,
  type User as FirebaseUser,
  type AuthCredential
} from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { ADMIN_UID } from '@/config/admin';
import { useRouter } from 'next/navigation';
import { useLocalProfile } from './use-local-profile';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (username: string, countryCode: string, gender: string) => Promise<void>;
  linkAccount: (credential: AuthCredential, newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { localProfile, clearLocalProfile } = useLocalProfile(firebaseUser?.uid);

  const handleUser = useCallback(async (user: FirebaseUser | null) => {
    setIsLoading(true);
    if (user) {
      setFirebaseUser(user);
    } else {
      try {
        const userCredential = await signInAnonymously(auth);
        setFirebaseUser(userCredential.user);
      } catch (error) {
        console.error("Anonymous sign-in failed:", error);
        setFirebaseUser(null);
        setCurrentUser(null);
        setIsLoading(false);
      }
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

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
  
  const linkAccount = async (credential: AuthCredential, newUsername: string) => {
    if (!auth.currentUser) throw new Error("No user to link.");
    
    // 1. Link the account
    const result = await linkWithCredential(auth.currentUser, credential);
    const linkedUser = result.user;

    // 2. Update the profile displayName
    await updateProfile(linkedUser, { displayName: newUsername });

    // 3. Migrate local profile data to Firestore
    if (localProfile) {
        await callFirebaseFunction('updateUserProfile', {
            username: newUsername, // Use the new username from the form
            countryCode: localProfile.countryCode,
            gender: localProfile.gender,
        });
        clearLocalProfile(); // Clean up local storage after migration
    } else {
        // If there's no local profile, still set the username
         await callFirebaseFunction('updateUserProfile', {
            username: newUsername,
            countryCode: '',
            gender: '',
        });
    }
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
