
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
    // Este efecto se ejecuta una vez para configurar el listener de autenticación.
    // Las actualizaciones de estado dentro del callback de onAuthStateChanged
    // provocarán re-renderizados, pero no que este efecto se vuelva a ejecutar.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true); // Inicia la carga en cada cambio de estado de autenticación
      if (user) {
        if (user.isAnonymous) {
          toast({
            title: "Acceso Restringido",
            description: "Debes iniciar sesión con una cuenta para ver tu perfil.",
            variant: "destructive"
          });
          router.replace('/login?redirect=/profile');
          setCurrentUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Usuario está logueado y no es anónimo
        setCurrentUser(user);
        try {
          const userProfile = await ensureUserProfileExists(user);
          setProfile(userProfile);
          setError(null);
        } catch (err: any) {
          console.error("Error loading profile in onAuthStateChanged:", err);
          setError("No se pudo cargar tu perfil. Inténtalo de nuevo más tarde.");
          toast({
            title: "Error de Perfil",
            description: "No se pudo cargar tu perfil.",
            variant: "destructive"
          });
          setProfile(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // No hay usuario logueado
        toast({
            title: "Acceso Requerido",
            description: "Por favor, inicia sesión para ver tu perfil.",
            variant: "default"
        });
        router.replace('/login?redirect=/profile');
        setCurrentUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe(); // Limpiar el listener al desmontar el componente
    };
  }, [router, toast]); // router y toast son hooks externos, sus referencias deberían ser estables.

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  // Si después de la carga, no hay currentUser (p.ej. redirección fallida o estado intermedio)
  if (!currentUser) {
    // Esto podría indicar que la redirección está en proceso o hubo un problema.
    // Podrías mostrar un mensaje genérico o un loader diferente.
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Esperando autenticación o redirigiendo...</p>
      </div>
    );
  }
  
  // Si currentUser existe pero es anónimo (esto debería ser capturado por la redirección, pero como salvaguarda)
  if (currentUser.isAnonymous) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Redirigiendo a inicio de sesión...</p>
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
    // Esto ocurre si no hay error, pero el perfil es null (p.ej. ensureUserProfileExists devolvió null
    // o algo inesperado ocurrió sin lanzar un error explícito capturado).
    return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="default">
          <AlertTitle>Perfil No Disponible</AlertTitle>
          <AlertDescription>
            No pudimos cargar la información de tu perfil en este momento. Intenta recargar la página.
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

  // Solo renderiza UserProfileForm si todo está bien
  return (
    <div className="container py-8">
      <UserProfileForm initialProfile={profile} />
    </div>
  );
}
