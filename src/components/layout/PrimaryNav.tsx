"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const navLinks: { href: string; label: string; icon: React.ElementType }[] = [
  { href: '/', label: 'Inicio', icon: Home },
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
            size="icon"
            className={cn(
              "h-9 w-9", // Compact icon button style
              isActive ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:text-foreground'
            )}
          >
            <Link href={href}>
              <Icon className="h-5 w-5" />
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
  if (navLinks.length === 0) {
    return null; // Don't render the nav if there are no links
  }
  
  return (
    <nav className="flex items-center gap-1">
      {navLinks.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}
