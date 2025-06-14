
"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeToggleButtonProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function ThemeToggleButton({ theme, toggleTheme }: ThemeToggleButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      aria-label="Toggle theme"
      className="text-foreground/70 hover:text-foreground transition-colors"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
