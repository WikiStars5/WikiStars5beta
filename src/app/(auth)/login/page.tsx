"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { useAuthWithGoogle } from "@/hooks/useAuthWithGoogle";

export default function LoginPage() {
  const { handleGoogleSignIn, isGoogleLoading } = useAuthWithGoogle();

  return (
    <AuthFormCard
      title="¡Bienvenido de Nuevo!"
      description="Inicia sesión con tu cuenta de Google para continuar en WikiStars5."
      footerText="¿No tienes una cuenta?"
      footerLinkText="Regístrate"
      footerLinkHref="/signup"
      onGoogleSignIn={handleGoogleSignIn}
      isGoogleLoading={isGoogleLoading}
    />
  );
}
