
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, LogOut, ShieldCheck, BellRing, Award, Eye, Star, Heart, MessageSquare, Reply, Share2 } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import { ADMIN_UID } from '@/config/admin';
import { Separator } from '@/components/ui/separator';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

const achievementDetails = {
  first_glance: {
    icon: Eye,
    title: "Primer Vistazo",
    description: "Visitaste tu primer perfil.",
  },
  actitud_definida: {
    icon: Heart,
    title: "Actitud Definida",
    description: "Votaste por primera vez tu Actitud (Fan, Hater, etc).",
  },
  estrella_brillante: {
    icon: Star,
    title: "Estrella Brillante",
    description: "Emitiste tu primera calificación de estrellas.",
  },
  emocion_descubierta: {
    icon: Heart, // Placeholder, can be changed
    title: "Emoción al Descubierto",
    description: "Votaste por primera vez una Emoción.",
  },
  compartiendo_verdad: {
    icon: Share2,
    title: "Compartiendo la Verdad",
    description: "Compartiste un perfil por primera vez.",
  },
  primera_contribucion: {
    icon: MessageSquare,
    title: "Mi Primera Contribución",
    description: "Dejaste tu primer comentario.",
  },
  dialogo_abierto: {
    icon: Reply,
    title: "Diálogo Abierto",
    description: "Respondiste a un comentario por primera vez.",
  },
};

type AchievementId = keyof typeof achievementDetails;


export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        setCurrentUser(user);
        // Fetch the full user profile from Firestore
        const userDocRef = doc(db, 'registered_users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile);
        }
      } else {
        toast({
          title: "Acceso Requerido",
          description: "Debes iniciar sesión para ver tu perfil.",
          variant: "destructive"
        });
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
      router.push('/');
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

    try {
      // The PushNotificationManager will handle token registration automatically.
      // This button just triggers the browser's permission prompt.
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast({
          title: "¡Permiso Concedido!",
          description: "Todo listo para recibir notificaciones. El sistema registrará tu dispositivo.",
        });
      } else {
        toast({
          title: "Permiso Denegado",
          description: "Has bloqueado las notificaciones. Puedes cambiarlas en la configuración de tu navegador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error durante la solicitud de permiso:', error);
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error al intentar activar las notificaciones.",
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
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <p>Redirigiendo a la página de inicio de sesión...</p>
        </div>
    );
  }

  const isAdmin = currentUser.uid === ADMIN_UID;
  const displayName = userProfile?.username || currentUser.displayName || currentUser.email?.split('@')[0] || "Usuario";
  
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
          
          <div className="space-y-4">
            <h3 className="text-base font-medium">Logros Desbloqueados</h3>
            {userProfile?.achievements && userProfile.achievements.length > 0 ? (
              <div className="space-y-3">
                {userProfile.achievements.map((achId) => {
                  const details = achievementDetails[achId as AchievementId];
                  if (!details) return null;
                  const Icon = details.icon;
                  return (
                    <div key={achId} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
                      <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">{details.title}</p>
                        <p className="text-sm text-muted-foreground">{details.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center p-4 border-dashed border-2 rounded-md">
                <Award className="mx-auto h-8 w-8 mb-2" />
                <p>Aún no has desbloqueado ningún logro. ¡Empieza a explorar para ganar el primero!</p>
              </div>
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
