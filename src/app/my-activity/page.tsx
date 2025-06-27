
"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import UserActivity from '@/components/user/UserActivity';
import { Loader2, LogIn } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { UserProfile, Figure } from '@/lib/types';
import { ensureUserProfileExists } from '@/lib/userData';
import { getFiguresByIds } from '@/lib/placeholder-data';

export default function MyActivityPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        setCurrentUser(user);
        try {
          // This now ensures the profile exists, creating it if necessary.
          const profile = await ensureUserProfileExists(user);
          if (profile) {
            setUserProfile(profile);
            const figureIds = new Set([
              ...Object.keys(profile.attitudes || {}),
            ]);
            
            if (figureIds.size > 0) {
              const fetchedFigures = await getFiguresByIds(Array.from(figureIds));
              setFigures(fetchedFigures);
            }
          } else {
             // This case should be rare now, but is kept as a fallback.
             setError("No se pudo cargar tu perfil. Es posible que no se haya creado correctamente.");
          }
        } catch (err: any) {
          console.error("Error fetching activity data:", err);
          setError(err.message || "Ocurrió un error inesperado al cargar tu actividad.");
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando usuario...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="container max-w-md mx-auto py-10 text-center">
            <Alert>
                <LogIn className="h-4 w-4" />
                <AlertTitle>Acceso Requerido</AlertTitle>
                <AlertDescription>
                    Debes iniciar sesión con una cuenta para ver tu actividad.
                </AlertDescription>
            </Alert>
            <Button asChild className="mt-6">
                <Link href="/login?redirect=/my-activity">Iniciar Sesión</Link>
            </Button>
      </div>
    );
  }

  if (error || !userProfile) {
     return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="destructive">
            <AlertTitle>Error al Cargar Actividad</AlertTitle>
            <AlertDescription>
                {error || "No se pudieron cargar los datos de tu perfil."}
            </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
            <Link href="/home">Volver al Inicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
        <CardHeader className="px-0">
            <CardTitle className="text-3xl font-headline">Mi Actividad</CardTitle>
            <CardDescription>Aquí puedes ver todas las figuras con las que has interactuado en la plataforma.</CardDescription>
        </CardHeader>
        <UserActivity userProfile={userProfile} figures={figures} />
    </div>
  );
}
