
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

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoadAttempted, setProfileLoadAttempted] = useState(false);

  // Effect for subscribing to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount

  // Effect for handling profile logic based on auth state
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to be determined
    }

    if (!authUser) {
      toast({
        title: "Acceso Requerido",
        description: "Por favor, inicia sesión para ver tu perfil.",
        variant: "default"
      });
      router.replace('/login?redirect=/profile');
      setProfile(null); // Clear profile state
      setProfileLoading(false);
      return;
    }

    if (authUser.isAnonymous) {
      toast({
        title: "Acceso Restringido",
        description: "Debes iniciar sesión con una cuenta para ver y editar tu perfil.",
        variant: "destructive"
      });
      router.replace('/login?redirect=/profile');
      setProfile(null); // Clear profile state
      setProfileLoading(false);
      return;
    }

    // Authenticated, non-anonymous user: proceed to load profile if not already attempted
    if (!profileLoadAttempted) {
      setProfileLoading(true);
      setError(null); // Clear previous errors
      setProfileLoadAttempted(true); // Mark that we are attempting to load

      ensureUserProfileExists(authUser)
        .then((userProfile) => {
          setProfile(userProfile);
          setError(null);
        })
        .catch((err: any) => {
          console.error("Error loading/ensuring profile:", err);
          const errorMessage = `No se pudo cargar o crear tu perfil. Detalles: ${err.message}`;
          setError(errorMessage);
          toast({
            title: "Error de Perfil",
            description: errorMessage,
            variant: "destructive"
          });
          setProfile(null);
        })
        .finally(() => {
          setProfileLoading(false);
        });
    }
  }, [authUser, authLoading, profileLoadAttempted, router, toast]);

  if (authLoading || (profileLoading && !profile && !error) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          {authLoading ? "Verificando autenticación..." : "Cargando perfil..."}
        </p>
      </div>
    );
  }

  if (error && !profile) {
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

  if (profileLoadAttempted && !profile && !error && authUser && !authUser.isAnonymous) {
     return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="default">
          <AlertTitle>Perfil No Disponible</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información de tu perfil en este momento. Intenta recargar la página o contacta a soporte si el problema persiste.
          </AlertDescription>
           <Button className="mt-6" onClick={() => {
             setProfileLoadAttempted(false); // Allow re-attempt
             // Optionally, re-trigger auth check or directly call profile load logic if authUser is stable
             // For now, simple re-attempt flag reset
           }}>
            Reintentar Carga
          </Button>
           <Button asChild className="mt-6 ml-2">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  if (profile && authUser && !authUser.isAnonymous) {
    return (
      <div className="container py-8">
        <UserProfileForm initialProfile={profile} />
      </div>
    );
  }

  // Fallback, should ideally not be reached if logic is correct and auth/profile loading states are handled.
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <p className="text-muted-foreground">Estado inesperado. Por favor, recarga la página.</p>
    </div>
  );
}

