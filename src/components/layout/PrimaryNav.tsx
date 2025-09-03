
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const navLinks = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/figures', label: 'Explorar', icon: Search },
];

const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
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
              "flex flex-col items-center justify-center gap-1 h-14 w-28 rounded-lg transition-colors duration-200",
              isActive ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-muted hover:text-foreground'
            )}
          >
            <Link href={href}>
              <Icon className="h-6 w-6" />
              <span className="sr-only">{label}</span>
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


export function PrimaryNav() {
  return (
    <nav className="flex justify-center items-center gap-4 mb-8">
      {navLinks.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}
