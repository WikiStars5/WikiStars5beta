
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { ensureUserProfileExists } from '@/lib/userData';
import UserProfileForm from '@/components/user/UserProfileForm';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast(); // Correctly using the hook
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileLoadAttempted, setProfileLoadAttempted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.isAnonymous) {
          toast({
            title: "Acceso Restringido",
            description: "Debes iniciar sesión con una cuenta para ver tu perfil.",
            variant: "destructive"
          });
          router.replace('/login?redirect=/profile');
          setIsLoading(false);
          setProfileLoadAttempted(false); // Reset flag if user becomes anonymous
          setProfile(null);
          setCurrentUser(null);
          return;
        }

        // User is logged in and not anonymous
        if (!profileLoadAttempted) {
          setProfileLoadAttempted(true);
          setCurrentUser(user); // Set current user here
          try {
            const userProfile = await ensureUserProfileExists(user);
            setProfile(userProfile);
            setError(null); // Clear previous errors
          } catch (err: any) {
            console.error("Error loading profile in useEffect:", err);
            setError("No se pudo cargar tu perfil. Inténtalo de nuevo más tarde.");
            toast({
              title: "Error de Perfil",
              description: "No se pudo cargar tu perfil.",
              variant: "destructive"
            });
            setProfile(null);
            // Consider if profileLoadAttempted should be reset here for a retry mechanism
            // For now, keep it true to prevent immediate retry loops on persistent errors
          } finally {
            setIsLoading(false);
          }
        } else if (currentUser && user.uid !== currentUser.uid) {
            // User changed, reset and attempt load
            setProfileLoadAttempted(false);
            setIsLoading(true);
            setProfile(null);
            setCurrentUser(null); 
            // The listener will call this block again with !profileLoadAttempted
        } else {
            // Profile load was already attempted for this user, and user hasn't changed
            setIsLoading(false);
        }

      } else {
        // No user is logged in
        toast({
            title: "Acceso Requerido",
            description: "Por favor, inicia sesión para ver tu perfil.",
            variant: "default"
        });
        router.replace('/login?redirect=/profile');
        setProfile(null);
        setCurrentUser(null);
        setIsLoading(false);
        setProfileLoadAttempted(false); // Reset flag
        return;
      }
    });

    return () => {
      unsubscribe();
      // Cleanup: Reset states if necessary, though onAuthStateChanged handles this well
    };
  }, [router, toast, profileLoadAttempted, currentUser]); // Added profileLoadAttempted and currentUser to dependencies

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  // This check ensures we don't proceed if redirection should have happened
  if (!currentUser || currentUser.isAnonymous) {
     // This state should ideally be caught by the isLoading or redirection logic
     // If still here, means redirection is pending or failed. Show loader or generic message.
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Redirigiendo o esperando autenticación...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="destructive">
          <AlertTitle>Error al Cargar Perfil</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/">Volver al Inicio</Link>
        </Button>
      </div>
    );
  }
  
  if (!profile) {
    // This implies that the user is not anonymous, but the profile could not be found/created,
    // and no specific error was set, or still loading but isLoading became false.
    // This could happen if ensureUserProfileExists returns null unexpectedly or an error wasn't caught.
    return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="default">
          <AlertTitle>Perfil No Disponible</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información de tu perfil en este momento. Intenta recargar la página.
          </AlertDescription>
           <Button asChild className="mt-6" onClick={() => router.refresh()}>
            Recargar
          </Button>
           <Button asChild className="mt-6 ml-2">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  // Only render UserProfileForm if everything is fine
  return (
    <div className="container py-8">
      <UserProfileForm initialProfile={profile} />
    </div>
  );
}
