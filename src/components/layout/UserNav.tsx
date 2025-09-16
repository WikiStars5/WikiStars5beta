
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { LogOut, User, ShieldCheck, Loader2, Globe, UserPlus } from 'lucide-react';
import { correctMalformedUrl } from "@/lib/utils";
import { CreateWebsiteProfile } from "../admin/CreateWebsiteProfile";
import React from "react";
import { CreateProfileFromWikipedia } from "../admin/CreateProfileFromWikipedia";

export function UserNav() {
  const { currentUser, firebaseUser, isAdmin, isLoading, logout, localProfile, isAnonymous } = useAuth();
  const [isWebsiteDialogOpen, setIsWebsiteDialogOpen] = React.useState(false);
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = React.useState(false);
  
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
    <Dialog>
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
             <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsCharacterDialogOpen(true); }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Crear Perfil de Personaje</span>
                </DropdownMenuItem>
              </DialogTrigger>
             <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsWebsiteDialogOpen(true); }}>
                  <Globe className="mr-2 h-4 w-4" />
                  <span>Crear Perfil Web</span>
                </DropdownMenuItem>
              </DialogTrigger>
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

      <Dialog open={isWebsiteDialogOpen} onOpenChange={setIsWebsiteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Perfil Web</DialogTitle>
            <DialogDescription>
              Añade un nuevo perfil para un sitio web introduciendo su dominio.
            </DialogDescription>
          </DialogHeader>
          <CreateWebsiteProfile />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCharacterDialogOpen} onOpenChange={setIsCharacterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Perfil de Personaje</DialogTitle>
            <DialogDescription>
              Busca una figura pública en Wikipedia para crear su perfil.
            </DialogDescription>
          </DialogHeader>
          <CreateProfileFromWikipedia onProfileCreated={() => setIsCharacterDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
