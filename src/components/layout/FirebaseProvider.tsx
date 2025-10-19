"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const firebaseConfig = {
  "projectId": "wikistars5-2yctr",
  "appId": "1:939359993461:web:8228c2d11941f46e95823c",
  "storageBucket": "wikistars5-2yctr.firebasestorage.app",
  "apiKey": "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  "authDomain": "wikistars5-2yctr.firebaseapp.com",
  "measurementId": "G-8MY8KTGXP3",
  "messagingSenderId": "939359993461"
};

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Garantiza una única inicialización de la app de Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsLoading(false);
      } else {
        try {
            const userCredential = await signInAnonymously(auth);
            setFirebaseUser(userCredential.user);
        } catch(error) {
            console.error("CRITICAL: Anonymous sign-in failed:", error);
            toast({
                title: "Error de Sesión",
                description: "No se pudo iniciar una sesión de invitado. La funcionalidad estará limitada.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { app, auth, db, storage, firebaseUser, isLoading };

  return (
    <FirebaseContext.Provider value={value}>
      {isLoading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-[200]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
