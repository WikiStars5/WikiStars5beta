
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
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      toast({
        title: "¡App Instalada!",
        description: "Ahora, activa las notificaciones para no perderte nada."
      });

      setTimeout(async () => {
        if ('Notification' in window && Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            toast({
              title: "¡Notificaciones Activadas!",
              description: "¡Todo listo! Recibirás alertas importantes.",
            });
          } else {
             toast({
              title: "Permiso de Notificación Opcional",
              description: "Puedes activar las notificaciones más tarde desde tu perfil.",
            });
          }
        }
      }, 2000);
    }
  };

  if (!deferredPrompt) {
    return null;
  }

  if (asMenuItem) {
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleInstallClick}
            className="text-foreground/70 hover:text-foreground"
            aria-label="Instalar aplicación"
          >
            <Download className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Instalar aplicación</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
