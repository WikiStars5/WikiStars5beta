
"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthFormCard
      title="¡Bienvenido de Nuevo!"
      description="Inicia sesión en tu cuenta de WikiStars5 para continuar."
      footerText="¿No tienes una cuenta?"
      footerLinkText="Regístrate"
      footerLinkHref="/signup"
    >
      <LoginForm />
    </AuthFormCard>
  );
}
