
"use client"; 

import { Logo } from '@/components/shared/Logo';
import { UserNav } from '@/components/layout/UserNav';
import Link from 'next/link'; 
import { MobileSearchButton } from './MobileSearchButton';
import { SearchBar } from '@/components/shared/SearchBar'; 
import { useState } from 'react';
import { NotificationBell } from './NotificationBell';
import { GuestNotificationBell } from './GuestNotificationBell'; // Import the new component
import { InstallPwaButton } from './InstallPwaButton';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/button';
import { Rocket } from 'lucide-react';

export function Header() {
  const [isHeaderSearchFocused, setIsHeaderSearchFocused] = useState(false);
  const { isAnonymous, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="flex h-18 w-full max-w-6xl items-center justify-between mx-auto py-3 px-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Logo />
          <div className={`hidden md:block transition-all duration-300 ease-in-out ${isHeaderSearchFocused ? 'w-72' : 'w-auto'}`}>
            <SearchBar 
              startAsIcon={true} 
              onFocusChange={setIsHeaderSearchFocused}
              className={isHeaderSearchFocused ? "w-full" : "w-9"}
            />
          </div>
        </div>
        
        <div className={`flex items-center gap-1 md:gap-2 lg:gap-3 transition-opacity duration-300 ${isHeaderSearchFocused && !isHeaderSearchFocused ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
          <nav className={`flex items-center gap-4 text-sm transition-opacity duration-300 ${isHeaderSearchFocused ? 'lg:flex opacity-0 lg:opacity-100' : 'flex opacity-100'}`}>
            <Link href="/figures" className="text-foreground/70 hover:text-foreground transition-colors">
              Explorar
            </Link>
            <Link href="/crowdfunding" className="text-foreground/70 hover:text-foreground transition-colors font-semibold">
              <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                <Rocket className="mr-2 h-4 w-4" />
                Apóyanos
              </Button>
            </Link>
            {isAnonymous && (
              <Link href="/profile" className="text-foreground/70 hover:text-foreground transition-colors">
                Mi Perfil
              </Link>
            )}
          </nav>

          <InstallPwaButton />
          <MobileSearchButton />
          
          {/* Conditional rendering for notification bells */}
          {!isLoading && (
            isAnonymous ? <GuestNotificationBell /> : <NotificationBell />
          )}

          <UserNav />
        </div>
      </div>
    </header>
  );
}
