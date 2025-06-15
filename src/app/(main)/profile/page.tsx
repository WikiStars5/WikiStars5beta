
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
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If auth check is already completed and the user object reference or UID hasn't changed,
      // or if we are already in an error state from a previous attempt, avoid re-processing.
      if (authCheckCompleted && (user?.uid === currentUser?.uid || error)) {
          // If the user signed out, then we need to react.
          if (!user && currentUser) {
            setCurrentUser(null);
            setProfile(null);
            setIsLoading(false); 
            setAuthCheckCompleted(false); // Reset for next potential login
            toast({
                title: "Sesión Cerrada",
                description: "Has sido redirigido a la página de inicio de sesión.",
                variant: "default"
            });
            router.replace('/login?redirect=/profile');
          }
          // If still loading, let it finish. If not loading, and user is same, do nothing.
          if (!isLoading) return;
      }

      setIsLoading(true);
      setError(null); // Clear previous errors on new auth state change

      if (user) {
        if (user.isAnonymous) {
          toast({
            title: "Acceso Restringido",
            description: "Debes iniciar sesión con una cuenta para ver y editar tu perfil.",
            variant: "destructive"
          });
          router.replace('/login?redirect=/profile');
          setCurrentUser(null);
          setProfile(null);
          setIsLoading(false);
          setAuthCheckCompleted(true);
          return;
        }

        setCurrentUser(user); // Set current user first
        try {
          const userProfile = await ensureUserProfileExists(user);
          setProfile(userProfile);
          setError(null);
        } catch (err: any) {
          console.error("Error loading/ensuring profile:", err);
          setError("No se pudo cargar o crear tu perfil. Verifica los permisos de Firestore o inténtalo de nuevo más tarde.");
          toast({
            title: "Error de Perfil",
            description: `No se pudo cargar o crear tu perfil. Detalles: ${err.message}`,
            variant: "destructive"
          });
          setProfile(null);
        } finally {
          setIsLoading(false);
          setAuthCheckCompleted(true);
        }
      } else {
        // No user logged in
        toast({
            title: "Acceso Requerido",
            description: "Por favor, inicia sesión para ver tu perfil.",
            variant: "default"
        });
        router.replace('/login?redirect=/profile');
        setCurrentUser(null);
        setProfile(null);
        setIsLoading(false);
        setAuthCheckCompleted(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, toast, authCheckCompleted, currentUser, error, isLoading]); // Added dependencies

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (error && !profile) { // Show error prominently if profile couldn't be loaded
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
  
  // If user is set, not anonymous, auth check completed, but profile is still null (and no specific error string was set for it)
  // This could happen if ensureUserProfileExists returns null unexpectedly or some other logic flaw.
  if (currentUser && !currentUser.isAnonymous && authCheckCompleted && !profile && !error) {
     return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="default">
          <AlertTitle>Perfil No Disponible</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información de tu perfil en este momento. Intenta recargar la página o contacta a soporte si el problema persiste.
          </AlertDescription>
           <Button className="mt-6" onClick={() => router.refresh()}>
            Recargar
          </Button>
           <Button asChild className="mt-6 ml-2">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  // Render form only if we have a profile and a non-anonymous user
  if (profile && currentUser && !currentUser.isAnonymous) {
    return (
      <div className="container py-8">
        <UserProfileForm initialProfile={profile} />
      </div>
    );
  }

  // Fallback: If not loading, no error, no profile, and conditions not met for redirect/specific messages.
  // This state should ideally not be reached if logic is correct. Could indicate ongoing redirection.
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <p className="text-muted-foreground">Verificando estado de autenticación...</p>
    </div>
  );
}
