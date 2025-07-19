"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { useAuthWithGoogle } from "@/hooks/useAuthWithGoogle";

export default function SignupPage() {
  const { handleGoogleSignIn, isGoogleLoading } = useAuthWithGoogle();

  return (
    <AuthFormCard
      title="Crear una Cuenta"
      description="Usa tu cuenta de Google para unirte a WikiStars5 y empezar a calificar."
      footerText="¿Ya tienes una cuenta?"
      footerLinkText="Iniciar Sesión"
      footerLinkHref="/login"
      onGoogleSignIn={handleGoogleSignIn}
      isGoogleLoading={isGoogleLoading}
    />
  );
}
