
"use client"; 

import { Logo } from '@/components/shared/Logo';
import { MobileSearchButton } from './MobileSearchButton';
import { SearchBar } from '@/components/shared/SearchBar'; 
import { InstallPwaButton } from './InstallPwaButton';
import { PrimaryNav } from './PrimaryNav';
import { UserNav } from './UserNav';
import { NotificationBell } from './NotificationBell';

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="flex h-18 w-full max-w-6xl items-center justify-between mx-auto py-3 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 md:gap-4">
          <Logo />
          <div className="hidden md:flex items-center">
             <SearchBar />
          </div>
        </div>
        
        {/* Center Section - Navigation */}
        <div className="hidden md:flex flex-grow items-center justify-center">
          <PrimaryNav />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
          <InstallPwaButton />
          <NotificationBell />
          <UserNav />
          <MobileSearchButton />
        </div>
      </div>
    </header>
  );
}
