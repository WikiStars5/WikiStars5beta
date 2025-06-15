
"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { LoginForm } from "@/components/auth/LoginForm";
// Google Sign-In related imports are removed if Google Sign-In is fully removed
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// import { auth } from '@/lib/firebase';
// import { ensureUserProfileExists } from '@/lib/userData';
// import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  // const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Removed
  // const router = useRouter(); // Keep if other async ops need it
  // const { toast } = useToast(); // Keep if other async ops need it

  // const handleGoogleSignIn = async () => { ... }; // Removed

  return (
    <AuthFormCard
      title="¡Bienvenido de Nuevo!"
      description="Inicia sesión en tu cuenta de WikiStars5 para continuar."
      footerText="¿No tienes una cuenta?"
      footerLinkText="Regístrate"
      footerLinkHref="/signup"
      // onGoogleSignIn={handleGoogleSignIn} // Removed
      // isGoogleLoading={isGoogleLoading} // Removed
    >
      <LoginForm />
    </AuthFormCard>
  );
}
