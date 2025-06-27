"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { ensureUserProfileExists } from '@/lib/userData';
import UserProfileForm from '@/components/user/UserProfileForm';
import UserActivity from '@/components/user/UserActivity';
import { Loader2, Edit, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.isAnonymous) {
          toast({
            title: "Acceso Restringido",
            description: "Debes iniciar sesión con una cuenta para ver y editar tu perfil.",
            variant: "destructive"
          });
          router.replace('/login?redirect=/profile');
          setIsLoading(false);
          return;
        }

        // We have a registered user.
        setError(null);
        try {
          const userProfile = await ensureUserProfileExists(user);
          setProfile(userProfile);
        } catch (err: any) {
          console.error("Error loading/ensuring profile:", err);
          const errorMessage = `No se pudo cargar o crear tu perfil. Detalles: ${err.message}`;
          setError(errorMessage);
          toast({
            title: "Error de Perfil",
            description: errorMessage,
            variant: "destructive"
          });
          setProfile(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        // No user at all.
        toast({
          title: "Acceso Requerido",
          description: "Por favor, inicia sesión para ver tu perfil.",
          variant: "default"
        });
        router.replace('/login?redirect=/profile');
        setProfile(null);
        setIsLoading(false);
      }
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
  
  if (profile) {
    return (
      <div className="container py-8 space-y-8">
        <CardHeader className="px-0">
            <CardTitle className="text-3xl font-headline">Tu Perfil</CardTitle>
            <CardDescription>Gestiona tu información personal y visualiza tu actividad en la plataforma.</CardDescription>
        </CardHeader>
        <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" />Mi Actividad</TabsTrigger>
                <TabsTrigger value="edit-profile"><Edit className="mr-2 h-4 w-4" />Editar Información</TabsTrigger>
            </TabsList>
            <TabsContent value="activity" className="mt-6">
                <UserActivity userId={profile.uid} />
            </TabsContent>
            <TabsContent value="edit-profile" className="mt-6">
                <UserProfileForm initialProfile={profile} />
            </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Fallback for when the user is being redirected or in an unexpected state
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">
        Verificando estado...
      </p>
    </div>
  );
}
