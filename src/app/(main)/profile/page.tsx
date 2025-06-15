
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { ensureUserProfileExists } from '@/lib/userData';
import UserProfileForm from '@/components/user/UserProfileForm';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.isAnonymous) {
          toast({
            title: "Acceso Restringido",
            description: "Debes iniciar sesión con una cuenta para ver tu perfil.",
            variant: "destructive"
          });
          router.replace('/login?redirect=/profile');
        } else {
          setCurrentUser(user);
          try {
            const userProfile = await ensureUserProfileExists(user);
            setProfile(userProfile);
          } catch (err: any) {
            console.error("Error loading profile:", err);
            setError("No se pudo cargar tu perfil. Inténtalo de nuevo más tarde.");
            toast({
              title: "Error de Perfil",
              description: "No se pudo cargar tu perfil.",
              variant: "destructive"
            });
          }
        }
      } else {
        // No user is signed in.
        router.replace('/login?redirect=/profile');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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

  if (!profile || !currentUser || currentUser.isAnonymous) {
     // This state should ideally be caught by the redirect, but as a fallback:
    return (
      <div className="container max-w-md mx-auto py-10 text-center">
        <Alert variant="default">
          <AlertTitle>Acceso Requerido</AlertTitle>
          <AlertDescription>
            Por favor, <Link href="/login?redirect=/profile" className="underline text-primary">inicia sesión</Link> para ver y editar tu perfil.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  

  return (
    <div className="container py-8">
      <UserProfileForm initialProfile={profile} />
    </div>
  );
}

// Helper for toast, as it's not directly available in server-like components
// This is a bit of a hack for the effect hook, consider moving toast to UserProfileForm fully
const toast = (options: { title: string; description: string; variant?: "default" | "destructive" }) => {
  if (typeof window !== 'undefined') {
    // A simple way to signal a toast is needed.
    // In a real app, you'd use the useToast hook if this component could fully use it,
    // or pass messages up to a layout component that can show toasts.
    // For now, this just logs, as direct toast usage here is tricky.
    console.log(`TOAST: ${options.title} - ${options.description} (${options.variant || 'default'})`);
    
    // Attempt to use a global event if a Toaster is listening elsewhere
    const event = new CustomEvent('show-toast', { detail: options });
    window.dispatchEvent(event);
  }
};
