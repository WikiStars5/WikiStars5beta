
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, LogOut, ShieldCheck } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';

const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
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
              <Link href="/admin" legacyBehavior>
                <a title="Ir al Panel de Administración">
                  <ShieldCheck className="h-6 w-6 text-primary cursor-pointer"/>
                </a>
              </Link>
            )}
          </CardTitle>
          <CardDescription>{currentUser.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 border-t">
          <p className="text-sm text-center text-muted-foreground">
            ¡Bienvenido a tu perfil! Más funcionalidades próximamente.
          </p>
          <Button onClick={handleLogout} className="w-full mt-6">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
