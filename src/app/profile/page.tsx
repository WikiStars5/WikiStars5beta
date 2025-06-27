
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { ensureUserProfileExists } from '@/lib/userData';
import UserProfileForm from '@/components/user/UserProfileForm';
import { Loader2, User, Heart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FavoriteFiguresList from '@/components/user/FavoriteFiguresList';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoadAttempted, setProfileLoadAttempted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  useEffect(() => {
    if (authLoading) {
      return; 
    }

    if (!authUser) {
      toast({
        title: "Acceso Requerido",
        description: "Por favor, inicia sesión para ver tu perfil.",
        variant: "default"
      });
      router.replace('/login?redirect=/profile');
      setProfile(null); 
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
      setProfile(null); 
      setProfileLoading(false);
      return;
    }

    if (!profileLoadAttempted) {
      setProfileLoading(true);
      setError(null); 
      setProfileLoadAttempted(true); 

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
  
  if (profile) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Tu Perfil</CardTitle>
            <CardDescription>Gestiona tu información personal y tus figuras favoritas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="edit-profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit-profile"><User className="mr-2 h-4 w-4"/>Editar Perfil</TabsTrigger>
                <TabsTrigger value="favorites"><Heart className="mr-2 h-4 w-4"/>Mis Favoritos</TabsTrigger>
              </TabsList>
              <TabsContent value="edit-profile" className="pt-6">
                <UserProfileForm initialProfile={profile} />
              </TabsContent>
              <TabsContent value="favorites" className="pt-6">
                 <FavoriteFiguresList userProfile={profile} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <p className="text-muted-foreground">Estado inesperado. Por favor, recarga la página.</p>
    </div>
  );
}
