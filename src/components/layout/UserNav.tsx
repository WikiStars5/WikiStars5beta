
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
import { User, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation'; 
import { correctMalformedUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_UID } from '@/config/admin';

export function UserNav() {
  const { user: currentUser, firebaseUser, isAnonymous, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-9 w-9">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAnonymous || !currentUser) {
    return (
      <Button variant="ghost" asChild>
        <Link href="/login">
          <User className="mr-2 h-4 w-4" />
          <span>Acceder</span>
        </Link>
      </Button>
    );
  }

  const isAdmin = (firebaseUser?.uid === ADMIN_UID) || (currentUser.role === 'admin');
  const displayName = currentUser.username || "Usuario";
  const photoURL = currentUser.photoURL;
  const email = currentUser.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={correctMalformedUrl(photoURL) || undefined} alt={displayName} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
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
        
        <Link href="/profile" passHref>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>
        </Link>
        
        {isAdmin && (
          <Link href="/admin" passHref>
            <DropdownMenuItem>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Panel de Administración</span>
            </DropdownMenuItem>
          </Link>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
