
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { LogOut, User, ShieldCheck, Loader2 } from 'lucide-react';
import { correctMalformedUrl } from "@/lib/utils";

export function UserNav() {
  const { currentUser, firebaseUser, isAdmin, isLoading, logout, localProfile, isAnonymous } = useAuth();
  
  if (isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  // If user is not authenticated (which they always should be, even anon), show nothing.
  if (!firebaseUser) {
    return null; 
  }

  const isGuest = firebaseUser.isAnonymous;
  
  // Do not show the nav if the user is a guest AND has not created a local profile yet.
  if (isGuest && !localProfile) {
      return null;
  }

  const displayName = isAdmin 
    ? currentUser?.username 
    : (isGuest ? localProfile?.username : (currentUser?.username || 'Usuario'));

  const displayEmail = isAdmin ? currentUser?.email : (isGuest ? "Invitado" : currentUser?.email);
  const photoURL = isAdmin ? currentUser?.photoURL : null;

  if (!displayName) {
     return null; // Don't render the nav if there's no profile info to show
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={correctMalformedUrl(photoURL)} alt={displayName} />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Panel de Administración</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {!isAnonymous && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
