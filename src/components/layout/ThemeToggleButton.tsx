
"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface ThemeToggleButtonProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function ThemeToggleButton({ theme, toggleTheme }: ThemeToggleButtonProps) {
  const [mounted, setMounted] = useState(false);

  // When the component mounts on the client, we can safely show the UI.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // To prevent hydration mismatch, render a disabled placeholder button on the server
    // and on the initial client render. This ensures the component structure matches.
    return <Button variant="ghost" size="icon" disabled />;
  }

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
