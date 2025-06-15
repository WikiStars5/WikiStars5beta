
"use client";

import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { SignupForm } from "@/components/auth/SignupForm";
// Google Sign-In related imports are removed if Google Sign-In is fully removed
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// import { auth } from '@/lib/firebase';
// import { ensureUserProfileExists } from '@/lib/userData';
// import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  // const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Removed
  // const router = useRouter(); // Keep if other async ops need it, otherwise remove
  // const { toast } = useToast(); // Keep if other async ops need it, otherwise remove

  // const handleGoogleSignIn = async () => { ... }; // Removed

  return (
    <AuthFormCard
      title="Crear una Cuenta"
      description="Únete a WikiStars5 para calificar, discutir y personalizar tu perfil."
      footerText="¿Ya tienes una cuenta?"
      footerLinkText="Iniciar Sesión"
      footerLinkHref="/login"
      // onGoogleSignIn={handleGoogleSignIn} // Removed
      // isGoogleLoading={isGoogleLoading} // Removed
    >
      <SignupForm />
    </AuthFormCard>
  );
}
