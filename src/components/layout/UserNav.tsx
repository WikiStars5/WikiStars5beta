
"use client";

import Link from 'next-intl/link'; // Changed to next-intl's Link
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
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { User, LogIn, UserPlus, LogOut, ShieldCheck, Settings, Loader2, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next-intl/client'; // Changed to next-intl's useRouter
import { useTranslations } from 'next-intl';

const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

export function UserNav() {
  const t = useTranslations('UserNav');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: t('logoutSuccessTitle'), description: t('logoutSuccessDescription') });
      router.push('/login');
      router.refresh(); 
    } catch (error) {
      console.error("Error logging out: ", error);
      toast({ title: t('logoutErrorTitle'), description: t('logoutErrorDescription'), variant: "destructive" });
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
    const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || "Usuario";
    const photoURL = currentUser.photoURL;
    const email = currentUser.email;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={photoURL || undefined} alt={displayName} />
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
              <span>{t('profile')}</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem disabled>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('settings')}</span>
          </DropdownMenuItem>
          {isAdmin && !currentUser.isAnonymous && (
            <Link href="/admin">
              <DropdownMenuItem>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>{t('adminPanel')}</span>
              </DropdownMenuItem>
            </Link>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <UserCircle className="h-6 w-6 text-foreground/70" />
          <span className="sr-only">{t('openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end" forceMount>
        <DropdownMenuLabel>{t('access')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/login">
          <DropdownMenuItem>
            <LogIn className="mr-2 h-4 w-4" />
            <span>{t('login')}</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/signup">
          <DropdownMenuItem>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>{t('signup')}</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
