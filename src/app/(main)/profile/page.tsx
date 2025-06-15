
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
          return; // Salir temprano si se redirige
        }
        // Usuario no anónimo, proceder a cargar perfil
        setCurrentUser(user);
        try {
          const userProfile = await ensureUserProfileExists(user);
          setProfile(userProfile);
        } catch (err: any) {
          console.error("Error loading profile:", err);
          setError("No se pudo cargar tu perfil. Inténtalo de nuevo más tarde.");
          toast({
            title: "Error de Perfil",
            description: "No se pudo cargar tu perfil.",
            variant: "destructive"
          });
        }
      } else {
        // No hay usuario logueado
        toast({
            title: "Acceso Requerido",
            description: "Por favor, inicia sesión para ver tu perfil.",
            variant: "default"
          });
        router.replace('/login?redirect=/profile');
        setIsLoading(false);
        return; // Salir temprano si se redirige
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  // Si se decidió redirigir, isLoading sería false, pero currentUser/profile podrían ser null.
  // Esta es una salvaguarda. Los 'return;' en useEffect deberían prevenir esto.
  if (!currentUser || currentUser.isAnonymous) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {/* Podrías mostrar un spinner aquí también, o un mensaje simple */}
        <p className="text-muted-foreground">Redirigiendo...</p>
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
    // Esto implica que el usuario no es anónimo, pero el perfil no se pudo encontrar/crear.
    return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="default">
          <AlertTitle>Perfil No Encontrado</AlertTitle>
          <AlertDescription>
            No pudimos encontrar o crear tu perfil. Por favor, intenta recargar la página o contacta a soporte.
          </AlertDescription>
           <Button asChild className="mt-6">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <UserProfileForm initialProfile={profile} />
    </div>
  );
}
