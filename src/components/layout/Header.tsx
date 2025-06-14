
import { Logo } from '@/components/shared/Logo';
import { UserNav } from './UserNav';
import Link from 'next/link';
import { MobileSearchButton } from './MobileSearchButton';
import { ThemeToggleButton } from './ThemeToggleButton'; // Import the new component

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function Header({ theme, toggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 md:gap-4"> {/* Adjusted gap for smaller screens */}
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="text-foreground/70 hover:text-foreground transition-colors">
              Hogar
            </Link>
            <Link href="/figures" className="text-foreground/70 hover:text-foreground transition-colors">
              Explorar Figuras
            </Link>
            {/* Add more nav links if needed */}
          </nav>
           <MobileSearchButton />
           <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} /> {/* Add the theme toggle button */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
