
"use client";

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import UserActivity from '@/components/user/UserActivity';
import { Loader2, LogIn, AlertTriangle } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Figure, AttitudeKey } from '@/lib/types';
import { getAllUserAttitudes } from '@/lib/userData';
import { getFiguresByIds } from '@/lib/placeholder-data';
import { ensureUserProfileExists } from '@/lib/userData';

export default function MyActivityPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [attitudes, setAttitudes] = useState<Record<string, AttitudeKey>>({});
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure profile exists before fetching activity.
        // This prevents race conditions where activity is fetched for a non-existent profile.
        try {
          await ensureUserProfileExists(user);
        } catch (profileError: any) {
           setError(`No se pudo verificar o crear tu perfil de usuario. Error: ${profileError.message}`);
           setIsLoading(false);
           return;
        }

        setCurrentUser(user);
        
        // Now fetch activity data
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
              errorMessage = `Error Crítico de Permisos de Firestore. Esto significa que las Reglas de Seguridad están bloqueando la consulta.

**ACCIÓN REQUERIDA:**
1. Ve al archivo \`src/lib/firebase.ts\`.
2. Copia el bloque de reglas de seguridad completo que está en los comentarios.
3. Ve a tu Consola de Firebase -> Firestore Database -> Pestaña 'Rules'.
4. Reemplaza las reglas antiguas con las que copiaste y publica los cambios.

Si el error persiste después de actualizar las reglas, revisa la consola del navegador (F12) para ver si hay un enlace para crear un índice de Firestore automáticamente.`;
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

  if (error) {
     return (
      <div className="container max-w-lg mx-auto py-10">
        <Alert variant="destructive" className="whitespace-pre-wrap">
            <AlertTriangle className="h-5 w-5"/>
            <AlertTitle>Error al Cargar Actividad</AlertTitle>
            <AlertDescription>
                {error}
            </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
            <Link href="/home">Volver al Inicio</Link>
        </Button>
      </div>
    );
  }

  if (!currentUser || currentUser.isAnonymous) {
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
