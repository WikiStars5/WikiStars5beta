
"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { LoginForm } from "@/components/auth/LoginForm"; // LoginForm will also call ensureUserProfileExists
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ensureUserProfileExists } from '@/lib/userData';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
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
        title: "Inicio de Sesión Exitoso",
        description: `¡Bienvenido de nuevo, ${user.displayName || user.email}!`,
      });
      router.push('/home'); // Or your desired redirect path
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      let errorMessage = "No se pudo iniciar sesión con Google.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "El inicio de sesión con Google fue cancelado.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "Ya existe una cuenta con este correo electrónico usando un método de inicio de sesión diferente.";
      }
      toast({
        title: "Error de Inicio de Sesión con Google",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthFormCard
      title="¡Bienvenido de Nuevo!"
      description="Inicia sesión en tu cuenta de WikiStars5 para continuar."
      footerText="¿No tienes una cuenta?"
      footerLinkText="Regístrate"
      footerLinkHref="/signup"
      onGoogleSignIn={handleGoogleSignIn}
      isGoogleLoading={isGoogleLoading}
    >
      <LoginForm />
    </AuthFormCard>
  );
}
