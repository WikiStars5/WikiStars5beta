"use client"; 

import { Logo } from '@/components/shared/Logo';
import { UserNav } from '../auth/UserNav';
import Link from 'next/link'; 
import { MobileSearchButton } from './MobileSearchButton';
import { ThemeToggleButton } from './ThemeToggleButton';
import { SearchBar } from '@/components/shared/SearchBar'; 
import { useState } from 'react';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function Header({ theme, toggleTheme }: HeaderProps) {
  const [isHeaderSearchFocused, setIsHeaderSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="container flex h-18 max-w-4xl items-center justify-between py-3">
        <div className="flex items-center gap-2 md:gap-4">
          <Logo theme={theme} />
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
            <Link href="/home" className="text-foreground/70 hover:text-foreground transition-colors">
              Hogar
            </Link>
            <Link href="/figures" className="text-foreground/70 hover:text-foreground transition-colors">
              Explorar
            </Link>
          </nav>

          <MobileSearchButton />
          <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
