"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';
import { app, auth, db, storage } from '@/lib/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsLoading(false);
      } else {
        // If there's no user, attempt to sign in anonymously.
        // This is crucial for guest users to interact with the app.
        try {
            const userCredential = await signInAnonymously(auth);
            setFirebaseUser(userCredential.user);
        } catch(error) {
            console.error("CRITICAL: Anonymous sign-in failed:", error);
            toast({
                title: "Error de Conexión",
                description: "No se pudo establecer una sesión. El sitio puede no funcionar correctamente.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const value = { app, auth, db, storage, firebaseUser, isLoading };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[200]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
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
