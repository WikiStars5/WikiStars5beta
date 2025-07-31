
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
import { User, LogOut, ShieldCheck, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 
import { correctMalformedUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_UID } from '@/config/admin';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function UserNav() {
  const { user: currentUser, isAnonymous, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/'); 
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

  if (!currentUser) {
    // This case should rarely happen with the new anonymous auth model,
    // but it's good to have a fallback.
    return (
       <Button variant="ghost" className="relative h-9 w-9 rounded-full" disabled>
          <Avatar className="h-9 w-9"><AvatarFallback><User/></AvatarFallback></Avatar>
       </Button>
    );
  }
  
  const isAdmin = !isAnonymous && (currentUser.uid === ADMIN_UID || currentUser.role === 'admin');
  const displayName = isAnonymous ? "Invitado" : (currentUser.username || "Usuario");
  const photoURL = isAnonymous ? null : currentUser.photoURL;
  const email = isAnonymous ? "Sesión de invitado" : currentUser.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={correctMalformedUrl(photoURL) || undefined} alt={displayName} />
            <AvatarFallback>
              {isAnonymous ? <User className="h-5 w-5"/> : displayName.charAt(0).toUpperCase()}
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

        {!isAnonymous && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
