
"use client";

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { ADMIN_UID } from '@/config/admin';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Si hay un usuario, escuchamos su perfil en Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userProfile = { uid: docSnap.id, ...docSnap.data() } as UserProfile;
            setCurrentUser(userProfile);
            setIsAdmin(userProfile.uid === ADMIN_UID);
          } else {
            // Perfil no encontrado, el usuario podría estar recién creado
            setCurrentUser(null);
            setIsAdmin(false);
          }
           setIsLoading(false);
        }, (error) => {
            console.error("Error al escuchar perfil de usuario:", error);
            setCurrentUser(null);
            setIsAdmin(false);
            setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        // No hay usuario de Firebase
        setCurrentUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
    // Redirección forzada para limpiar el estado en toda la aplicación.
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, currentUser, isLoading, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

