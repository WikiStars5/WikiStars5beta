
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, app } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from 'firebase/functions';

// This is the new, robust way to ensure user profile exists by calling a Firebase Function.
const ensureUserProfileCallable = httpsCallable(getFunctions(app), 'ensureUserProfile');

export function useAuthWithGoogle() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    // SOLUCIÓN DEFINITIVA: Forzar el authDomain para evitar errores de dominio no autorizado.
    // Esto es crucial en entornos de desarrollo anidados como los de Firebase Studio.
    provider.setCustomParameters({
      'auth_domain': 'wikistars5-2yctr.firebaseapp.com'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Call the cloud function to ensure the user profile exists or is created.
      // We no longer need a separate API route.
      await ensureUserProfileCallable();

      toast({
        title: "¡Sesión Iniciada!",
        description: `¡Bienvenido a WikiStars5, ${user.displayName || user.email}!`,
      });
      router.push('/');
      router.refresh();

    } catch (error: any) {
      console.error("Google sign-in error:", error, "Code:", error.code, "Message:", error.message);
      let errorMessage = "No se pudo iniciar sesión con Google. Intenta de nuevo más tarde.";
      
      switch (error.code) {
        case 'auth/unauthorized-domain':
          errorMessage = "El dominio no está autorizado. Asegúrate de haberlo añadido en la consola de Firebase.";
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = "El proceso con Google fue cancelado por el usuario.";
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = "Ya existe una cuenta con este correo electrónico usando un método de inicio de sesión diferente. Intenta iniciar sesión con ese método.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "El inicio de sesión con Google no está habilitado. Por favor, verifica la configuración en Firebase Console.";
          break;
        case 'auth/popup-blocked':
          errorMessage = "El navegador bloqueó la ventana emergente de Google. Por favor, permite las ventanas emergentes para este sitio e inténtalo de nuevo.";
          break;
        default:
          if (error.message) {
            errorMessage = `Error: ${error.message}`;
          }
          break;
      }
      
      toast({
        title: "Error con Google",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return { handleGoogleSignIn, isGoogleLoading };
}
