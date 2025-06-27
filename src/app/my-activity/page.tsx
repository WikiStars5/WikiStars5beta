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

export default function MyActivityPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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

  if (!currentUser || currentUser.isAnonymous) {
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

  return (
    <div className="container py-8 space-y-8">
        <CardHeader className="px-0">
            <CardTitle className="text-3xl font-headline">Mi Actividad</CardTitle>
            <CardDescription>Aquí puedes ver todas las figuras con las que has interactuado en la plataforma.</CardDescription>
        </CardHeader>
        <UserActivity userId={currentUser.uid} />
    </div>
  );
}
