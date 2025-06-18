
"use client"; // Required for useState, useEffect

import { Logo } from '@/components/shared/Logo';
import { UserNav } from './UserNav';
import Link from 'next/link';
import { MobileSearchButton } from './MobileSearchButton';
import { ThemeToggleButton } from './ThemeToggleButton';
import { SearchBar } from '@/components/shared/SearchBar'; // Importar SearchBar

// Button and PlusCircle removed as "Proponer Figura" is being removed
// import { Button } from '@/components/ui/button';
// import { PlusCircle } from 'lucide-react';
// onAuthStateChanged and auth removed as they are not used now after removing propose figure button logic
// import { onAuthStateChanged } from 'firebase/auth';
// import { auth } from '@/lib/firebase';


interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function Header({ theme, toggleTheme }: HeaderProps) {
  // currentUser and authLoading state are no longer needed here as "Proponer Figura" button is removed
  // const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  // const [authLoading, setAuthLoading] = useState(true);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     setCurrentUser(user);
  //     setAuthLoading(false);
  //   });
  //   return () => unsubscribe();
  // }, []);

  // const canProposeFigure = currentUser && !currentUser.isAnonymous;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card text-card-foreground">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        {/* Grupo de elementos a la derecha del logo */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          {/* SearchBar para escritorio, visible en md y superior */}
          <div className="hidden md:block">
            <div className="w-56 lg:w-72"> {/* Ancho para la barra de búsqueda */}
              <SearchBar />
            </div>
          </div>

          {/* Enlaces de navegación para escritorio */}
          <nav className="hidden md:flex items-center gap-3 text-sm">
            <Link href="/home" className="text-foreground/70 hover:text-foreground transition-colors">
              Hogar
            </Link>
            <Link href="/figures" className="text-foreground/70 hover:text-foreground transition-colors">
              Explorar
            </Link>
            {/* "Proponer Figura" button removed */}
          </nav>

          {/* Botón de búsqueda para móviles (ya tiene md:hidden internamente) */}
           <MobileSearchButton />
           <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
