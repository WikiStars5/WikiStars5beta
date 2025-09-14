
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  GoogleAuthProvider,
  type AuthError
} from 'firebase/auth';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

export function useAuthWithGoogle() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { isAnonymous, linkAccount } = useAuth();

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      if (isAnonymous) {
        // If the user is anonymous, link their anonymous account to the Google account.
        const credential = provider; // For Google, the provider itself can be used.
        await linkAccount(credential, "Nuevo Usuario"); // Pass a default username
      } else {
         toast({ title: "Acción no requerida", description: "Ya tienes una sesión iniciada." });
      }

      toast({
        title: "¡Cuenta Vinculada!",
        description: "Tu cuenta anónima ahora está vinculada a Google.",
      });
      router.push('/'); // Redirect after successful link.

    } catch (error: any) {
      console.error("Error signing in/linking with Google: ", error);
      const authError = error as AuthError;
      if (authError.code === 'auth/popup-closed-by-user') {
         toast({
          title: "Vinculación cancelada",
          description: "La ventana de Google fue cerrada.",
          variant: "default",
        });
      } else if (authError.code === 'auth/credential-already-in-use') {
          toast({ title: "Error", description: "Esta cuenta de Google ya está registrada. Por favor, inicia sesión.", variant: "destructive" });
          router.push('/login');
      } else {
        toast({
          title: "Error de Autenticación",
          description: "No se pudo vincular la cuenta con Google. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}
