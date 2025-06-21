"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfileExists } from '@/lib/userData';
import { useToast } from "@/hooks/use-toast";


export default function SignupPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // 1. Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 2. Create the user's profile document in Firestore
      // This is a critical step.
      await ensureUserProfileExists(user); 

      toast({
        title: "¡Cuenta Creada y Sesión Iniciada!",
        description: `¡Bienvenido a StarSage, ${user.displayName || user.email}!`,
      });
      router.push('/home'); 

    } catch (error: any) {
      console.error("Google sign-up/sign-in error:", error, "Code:", error.code, "Message:", error.message);
      let errorMessage = "No se pudo registrar/iniciar sesión con Google. Intenta de nuevo más tarde.";
      
      switch (error.code) {
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
          if (error.message && error.message.startsWith('Firestore_Profile_Error:')) {
            errorMessage = `Error de perfil en Firestore. Revisa tus Reglas de Seguridad. Detalles: ${error.message}`;
          } else if (error.message) {
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

  return (
    <AuthFormCard
      title="Crear una Cuenta"
      description="Únete a StarSage para calificar, discutir y personalizar tu perfil."
      footerText="¿Ya tienes una cuenta?"
      footerLinkText="Iniciar Sesión"
      footerLinkHref="/login"
      onGoogleSignIn={handleGoogleSignIn}
      isGoogleLoading={isGoogleLoading}
    >
      <SignupForm />
    </AuthFormCard>
  );
}
