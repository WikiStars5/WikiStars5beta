
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, app } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from 'firebase/functions';

// This is the new, robust way to ensure user profile exists by calling a Firebase Function.
const ensureUserProfileCallable = httpsCallable(getFunctions(app), 'ensureUserProfile');

export function useAuthWithGoogle() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // This effect will run on page load to handle the result of a redirect.
  useEffect(() => {
    const handleRedirectResult = async () => {
      // Set loading true when we detect a potential redirect flow
      setIsGoogleLoading(true);
      try {
        const result = await getRedirectResult(auth);
        // If result is not null, the user has just signed in via redirect.
        if (result) {
          const user = result.user;
          
          await ensureUserProfileCallable();

          toast({
            title: "¡Sesión Iniciada!",
            description: `¡Bienvenido de nuevo, ${user.displayName || user.email}!`,
          });
          router.push('/');
          router.refresh();
        } else {
          // No redirect result, so we're not in a login flow. Stop loading.
          setIsGoogleLoading(false);
        }
      } catch (error: any) {
        // Handle errors from the redirect result, e.g., if the user canceled.
        console.error("Google sign-in redirect error:", error);
        let errorMessage = "Ocurrió un error durante el inicio de sesión con Google.";
        // You can add specific error handling here if needed.
        toast({
          title: "Error con Google",
          description: errorMessage,
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      }
    };
    
    handleRedirectResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      'auth_domain': 'wikistars5-2yctr.firebaseapp.com'
    });

    // Instead of opening a popup, this will redirect the user to Google's sign-in page.
    await signInWithRedirect(auth, provider);
    // The code execution stops here. The useEffect hook will handle the result
    // when the user is redirected back to the app.
  };

  return { handleGoogleSignIn, isGoogleLoading };
}
