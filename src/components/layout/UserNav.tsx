
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
import { User, LogIn, UserPlus, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import { correctMalformedUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_UID } from '@/config/admin';

export function UserNav() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({ title: "Cierre de Sesión Fallido", description: "No se pudo cerrar tu sesión.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-9 w-9">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    const isAdmin = user.uid === ADMIN_UID || user.role === 'admin';
    const displayName = user.username || "Usuario";
    const photoURL = user.photoURL;
    const email = user.email;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={correctMalformedUrl(photoURL) || undefined} alt={displayName} />
              <AvatarFallback>
                {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/profile">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
          </Link>
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

  // If there is no user, show login/signup buttons
  return (
    <div className="flex items-center gap-2">
      <Button asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4"/>
            Iniciar Sesión
          </Link>
      </Button>
      <Button variant="secondary" asChild>
        <Link href="/signup">
           <UserPlus className="mr-2 h-4 w-4"/>
           Registrarse
        </Link>
      </Button>
    </div>
  );
}
