
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  figureName: string;
  figureId: string;
}

export function ShareButton({ figureName, figureId }: ShareButtonProps) {
  const { toast } = useToast();
  const [canShareNatively, setCanShareNatively] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof navigator !== 'undefined' && navigator.share) {
      setCanShareNatively(true);
    }
  }, []);

  const handleShare = async () => {
    if (typeof window === 'undefined') return; 

    const shareUrl = `${window.location.origin}/figures/${figureId}`;
    const shareTitle = `¡Mira a ${figureName} en WikiStars5!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Califica y discute sobre ${figureName} en WikiStars5.`,
          url: shareUrl,
        });
        toast({ title: "¡Compartido exitosamente!" });
      } catch (error) {
        console.error("Error sharing:", error);
        if ((error as DOMException)?.name !== 'AbortError') {
          toast({ title: "No se pudo compartir", description: "Se canceló o falló la acción de compartir.", variant: "destructive" });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "¡Enlace Copiado!", description: "Enlace del perfil copiado al portapapeles." });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast({ title: "No se pudo copiar el enlace", variant: "destructive" });
      }
    }
  };

  const ShareOrLinkIcon = canShareNatively ? Share2 : LinkIcon;

  return (
    <Button variant="outline" onClick={handleShare} size="icon" aria-label={`Compartir perfil de ${figureName}`}>
      {isClient ? <ShareOrLinkIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" /> }
    </Button>
  );
}
