
"use client"; 

import { Logo } from '@/components/shared/Logo';
import { UserNav } from '@/components/layout/UserNav';
import Link from 'next/link'; 
import { MobileSearchButton } from './MobileSearchButton';
import { SearchBar } from '@/components/shared/SearchBar'; 
import { useState } from 'react';
import { NotificationBell } from './NotificationBell';
import { InstallPwaButton } from './InstallPwaButton';

export function Header() {
  const [isHeaderSearchFocused, setIsHeaderSearchFocused] = useState(false);

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
          <nav className={`hidden md:flex items-center gap-3 text-sm transition-opacity duration-300 ${isHeaderSearchFocused ? 'lg:flex opacity-0 lg:opacity-100' : 'flex opacity-100'}`}>
            <Link href="/" className="text-foreground/70 hover:text-foreground transition-colors">
              Hogar
            </Link>
            <Link href="/figures" className="text-foreground/70 hover:text-foreground transition-colors">
              Explorar
            </Link>
             <Link href="/foryou" className="text-foreground/70 hover:text-foreground transition-colors">
              Para Ti
            </Link>
          </nav>

          <InstallPwaButton />
          <MobileSearchButton />
          <NotificationBell />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
