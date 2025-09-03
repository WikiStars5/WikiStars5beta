
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
import { User, Home, Compass, Search as SearchIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const NavLink = ({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="ghost"
            className={cn(
              "h-12 w-16 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center gap-1",
              isActive ? "bg-primary/10 text-primary" : "text-foreground/60 hover:bg-muted hover:text-foreground"
            )}
          >
            <Link href={href}>
              <Icon className="h-6 w-6" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function Header() {
  const [isHeaderSearchFocused, setIsHeaderSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="flex h-18 w-full max-w-6xl items-center justify-between mx-auto py-3 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Logo />
        </div>

        {/* Center Section - Main Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm bg-card p-2 rounded-xl">
          <NavLink href="/" label="Inicio" icon={Home} />
          <NavLink href="/figures" label="Explorar" icon={SearchIcon} />
        </nav>
        
        {/* Right Section */}
        <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
          <div className="hidden md:flex items-center">
            <SearchBar />
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
