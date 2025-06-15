
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as FirebaseUser, getAuth, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { User, LogIn, UserPlus, LogOut, ShieldCheck, Settings, LayoutDashboard, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase'; // Ensure auth is exported from firebase.ts
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// IMPORTANT: Ensure this is your actual Admin User ID from Firebase Authentication
const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

export function UserNav() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/login'); // Redirect to login after logout
      router.refresh(); // Refresh to update any server-side auth checks
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({ title: "Cierre de Sesión Fallido", description: "No se pudo cerrar tu sesión. Por favor, inténtalo de nuevo.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentUser) {
    const isAdmin = currentUser.uid === ADMIN_UID;
    const userProfile: UserProfile = { // Adapt FirebaseUser to UserProfile
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.displayName || "User Avatar"} />
              <AvatarFallback>
                {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userProfile.displayName || "Usuario"}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userProfile.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
          {isAdmin && (
            <Link href="/admin">
              <DropdownMenuItem>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Panel de Administración</span>
              </DropdownMenuItem>
            </Link>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" asChild>
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
        </Link>
      </Button>
      <Button asChild>
        <Link href="/signup">
          <UserPlus className="mr-2 h-4 w-4" /> Registrarse
        </Link>
      </Button>
    </div>
  );
}
