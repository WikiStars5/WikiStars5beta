
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  type AuthError
} from 'firebase/auth';
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
      await signInWithPopup(auth, provider);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Has accedido con tu cuenta de Google.",
      });
      router.push('/');
    } catch (error: any) {
      console.error("Error signing in with Google: ", error);
      // Handle specific errors if needed
      const authError = error as AuthError;
      if (authError.code === 'auth/popup-closed-by-user') {
         toast({
          title: "Inicio de sesión cancelado",
          description: "La ventana de inicio de sesión con Google fue cerrada.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error de Autenticación",
          description: "No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}

    