"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, LogOut, ShieldCheck, BellRing } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import { ADMIN_UID } from '@/config/admin';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Set initial permission state from browser
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        setCurrentUser(user);
      } else {
        // Redirect to login if user is not logged in or is anonymous
        toast({
          title: "Acceso Requerido",
          description: "Debes iniciar sesión para ver tu perfil.",
          variant: "destructive"
        })
        router.replace('/login?redirect=/profile');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/home');
    } catch (error) {
      console.error("Error logging out from profile:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "No Soportado",
        description: "Tu navegador no soporta notificaciones push.",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      toast({
        title: "¡Permiso Concedido!",
        description: "¡Genial! Has activado las notificaciones. La funcionalidad completa se implementará pronto.",
      });
      // Future steps:
      // 1. Register a service worker.
      // 2. Get the push subscription token.
      // 3. Send the token to the server to save it.
    } else if (permission === 'denied') {
      toast({
        title: "Permiso Denegado",
        description: "Has bloqueado las notificaciones. Puedes cambiarlas en la configuración de tu navegador si cambias de opinión.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    // This state should ideally not be reached due to the redirect in useEffect,
    // but it's a good fallback.
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <p>Redirigiendo a la página de inicio de sesión...</p>
        </div>
    );
  }

  const isAdmin = currentUser.uid === ADMIN_UID;
  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || "Usuario";
  
  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={correctMalformedUrl(currentUser.photoURL) || undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            {displayName}
            {isAdmin && (
              <Link href="/admin" title="Ir al Panel de Administración">
                <ShieldCheck className="h-6 w-6 text-primary cursor-pointer"/>
              </Link>
            )}
          </CardTitle>
          <CardDescription>{currentUser.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 border-t space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-medium">Notificaciones Push</h3>
            <p className="text-sm text-muted-foreground">
              Recibe alertas en tu dispositivo incluso cuando no estés en la web.
            </p>
            {notificationPermission === 'granted' && (
              <div className="text-sm text-green-600 flex items-center gap-2 p-2 bg-green-500/10 rounded-md border border-green-500/20">
                <BellRing className="h-4 w-4" />
                <p>Las notificaciones push están activadas.</p>
              </div>
            )}
            {notificationPermission === 'denied' && (
              <div className="text-sm text-destructive flex items-center gap-2 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                <BellRing className="h-4 w-4" />
                <p>Bloqueaste las notificaciones. Para activarlas, ve a la configuración de tu navegador.</p>
              </div>
            )}
            {notificationPermission === 'default' && (
              <Button onClick={handleRequestNotificationPermission} variant="outline" className="w-full">
                <BellRing className="mr-2 h-4 w-4" />
                Activar Notificaciones
              </Button>
            )}
          </div>
          
          <Separator />

          <p className="text-sm text-center text-muted-foreground">
            ¡Bienvenido a tu perfil! Más funcionalidades próximamente.
          </p>
          <Button onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
