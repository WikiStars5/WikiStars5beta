
import { Logo } from '@/components/shared/Logo';
import { UserNav } from './UserNav';
import Link from 'next/link';
import { MobileSearchButton } from './MobileSearchButton';
import { ThemeToggleButton } from './ThemeToggleButton';
import { Button } from '@/components/ui/button'; // Import Button
import { PlusCircle } from 'lucide-react'; // Import Icon

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function Header({ theme, toggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 md:gap-4">
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/home" className="text-foreground/70 hover:text-foreground transition-colors">
              Hogar
            </Link>
            <Link href="/figures" className="text-foreground/70 hover:text-foreground transition-colors">
              Explorar Figuras
            </Link>
             <Button variant="ghost" size="sm" asChild className="text-foreground/70 hover:text-foreground transition-colors">
              <Link href="/propose-figure">
                <PlusCircle className="mr-2 h-4 w-4" />
                Proponer Figura
              </Link>
            </Button>
          </nav>
           <MobileSearchButton />
           <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
