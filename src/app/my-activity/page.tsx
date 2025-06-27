
"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import UserActivity from '@/components/user/UserActivity';
import { Loader2, LogIn, AlertTriangle } from 'lucide-react';
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
          let errorMessage = "Ocurrió un error inesperado al cargar tu actividad.";
          if (err.message && (err.message.includes('permission-denied') || err.message.includes('missing-permission'))) {
              errorMessage = "Error de permisos. Es posible que falte un índice en tu base de datos Firestore. Revisa la consola del navegador (F12) para ver si hay un enlace para crearlo automáticamente.";
          } else if(err.message) {
              errorMessage = err.message;
          }
          setError(errorMessage);
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
      <div className="container max-w-lg mx-auto py-10 text-center">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4"/>
            <AlertTitle>Error al Cargar Actividad</AlertTitle>
            <AlertDescription>
                <p className="mb-2">{error}</p>
                <p className="text-xs">
                    <strong>Nota para desarrolladores:</strong> Este error suele indicar que las Reglas de Seguridad de Firestore no permiten la consulta o que falta un índice compuesto. Asegúrate de haber desplegado las reglas más recientes de `src/lib/firebase.ts` y revisa la consola del navegador en busca de errores de Firestore para obtener un enlace para crear el índice si es necesario.
                </p>
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
