
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

interface InstallPwaButtonProps {
  asMenuItem?: boolean;
}

export function InstallPwaButton({ asMenuItem = false }: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null); // The prompt can only be used once.

    if (outcome === 'accepted') {
      toast({
        title: "¡App Instalada!",
        description: "Ahora puedes abrir WikiStars5 desde tu pantalla de inicio."
      });
    }
  };

  const canInstall = !!deferredPrompt;

  if (asMenuItem) {
    if (!canInstall) return null; // Don't show in dropdown if not installable
    return (
      <DropdownMenuItem onSelect={handleInstallClick}>
        <Download className="mr-2 h-4 w-4" />
        <span>Instalar aplicación</span>
      </DropdownMenuItem>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(!canInstall && "cursor-not-allowed")}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstallClick}
              disabled={!canInstall}
              className={cn(
                  "text-foreground/70 hover:text-foreground",
                  canInstall && "animate-color-pulse"
              )}
              aria-label="Instalar aplicación"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{canInstall ? 'Instalar aplicación' : 'Instalación no disponible en este momento.'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
