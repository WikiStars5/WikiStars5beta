
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, type AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from './use-toast';

export function useAuthWithGoogle() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      // El trigger `onUserCreate` de Cloud Functions se encargará de crear el perfil en Firestore
      // si es la primera vez que el usuario inicia sesión.
      toast({
        title: `¡Bienvenido, ${result.user.displayName}!`,
        description: "Has iniciado sesión correctamente con Google.",
      });
      router.push('/profile');
      router.refresh();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      const authError = error as AuthError;
      let errorMessage = "Ocurrió un error al iniciar sesión con Google.";
      
      if (authError.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Ya existe una cuenta con este correo electrónico pero con un método de inicio de sesión diferente.';
      } else if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'La ventana de inicio de sesión fue cerrada. Inténtalo de nuevo.';
      }
      
      toast({
        title: "Error de Autenticación",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}
