
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await ensureUserProfileExists(user); // Create/update profile in Firestore

      toast({
        title: "¡Cuenta Creada y Sesión Iniciada!",
        description: `¡Bienvenido a StarSage, ${user.displayName || user.email}!`,
      });
      router.push('/home'); // Redirect to home or desired page
    } catch (error: any) {
      console.error("Google sign-up/sign-in error:", error);
      let errorMessage = "No se pudo registrar/iniciar sesión con Google.";
       if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "El proceso con Google fue cancelado.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Ya existe una cuenta con este correo electrónico usando un método de inicio de sesión diferente. Intenta iniciar sesión.";
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
