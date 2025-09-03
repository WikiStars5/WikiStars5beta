
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Home, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
              "h-14 w-28 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center gap-1 text-foreground/70",
              isActive ? "bg-primary/10 text-primary" : "hover:bg-muted hover:text-foreground"
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

export function PrimaryNav() {
  return (
    <nav className="flex justify-center items-center gap-4 mb-8">
      <NavLink href="/" label="Inicio" icon={Home} />
      <NavLink href="/figures" label="Explorar" icon={SearchIcon} />
    </nav>
  );
}
