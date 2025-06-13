import { Logo } from '@/components/shared/Logo';
import { UserNav } from './UserNav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="text-foreground/70 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/#browse" className="text-foreground/70 hover:text-foreground transition-colors">
              Browse Figures
            </Link>
            {/* Add more nav links if needed */}
          </nav>
           <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
