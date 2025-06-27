
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
import type { Figure, AttitudeKey } from '@/lib/types';
import { getAllUserAttitudes } from '@/lib/userData';
import { getFiguresByIds } from '@/lib/placeholder-data';

export default function MyActivityPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [attitudes, setAttitudes] = useState<Record<string, AttitudeKey>>({});
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userAttitudes = await getAllUserAttitudes(user.uid);
          setAttitudes(userAttitudes);
          
          const figureIds = Object.keys(userAttitudes);
          
          if (figureIds.length > 0) {
            const fetchedFigures = await getFiguresByIds(figureIds);
            setFigures(fetchedFigures);
          } else {
            setFigures([]);
          }
        } catch (err: any) {
          console.error("Error fetching activity data:", err);
          setError(err.message || "Ocurrió un error inesperado al cargar tu actividad.");
        }
      } else {
        setCurrentUser(null);
        setAttitudes({});
        setFigures([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando actividad...</p>
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
                    Debes iniciar sesión para ver tu actividad. Los votos de invitado no se guardan aquí.
                </AlertDescription>
            </Alert>
            <Button asChild className="mt-6">
                <Link href="/login?redirect=/my-activity">Iniciar Sesión</Link>
            </Button>
      </div>
    );
  }

  if (error) {
     return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="destructive">
            <AlertTitle>Error al Cargar Actividad</AlertTitle>
            <AlertDescription>
                {error || "No se pudieron cargar tus datos de actividad."}
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
        <UserActivity attitudes={attitudes} figures={figures} />
    </div>
  );
}
