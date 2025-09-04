
"use client"; 

import { Logo } from '@/components/shared/Logo';
import { UserNav } from '@/components/layout/UserNav';
import Link from 'next/link'; 
import { MobileSearchButton } from './MobileSearchButton';
import { SearchBar } from '@/components/shared/SearchBar'; 
import { useState, useEffect } from 'react';
import { InstallPwaButton } from './InstallPwaButton';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from './NotificationBell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { PrimaryNav } from './PrimaryNav';


export function Header() {
  const [isHeaderSearchFocused, setIsHeaderSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="flex h-18 w-full max-w-6xl items-center justify-between mx-auto py-3 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Logo />
        </div>
        
        {/* Center Section - Navigation */}
        <div className="hidden md:flex flex-grow items-center justify-center">
          <PrimaryNav />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
          <div className="hidden md:flex items-center">
             <SearchBar 
              startAsIcon={true}
              onFocusChange={setIsHeaderSearchFocused} 
            />
            <NotificationBell />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/profile" className="text-foreground/70 hover:text-foreground transition-colors p-2 rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Mi Perfil</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mi Perfil</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <InstallPwaButton />
          </div>
          <MobileSearchButton />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
