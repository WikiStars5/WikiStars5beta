
"use client";

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Facebook, Twitter, Linkedin, MessageCircle, Mail, Reddit as RedditIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  figureName: string;
  figureId: string;
}

interface SocialShareOption {
  name: string;
  icon: React.ElementType;
  url: string;
  isMailto?: boolean;
}

export function ShareButton({ figureName, figureId }: ShareButtonProps) {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin + `/figures/${figureId}`);
    }
  }, [figureId]);

  if (!currentUrl) {
    // Return a disabled button or a placeholder while URL is not available
    return (
      <Button variant="outline" size="icon" aria-label="Cargando opciones para compartir" disabled>
        <Share2 className="h-5 w-5" />
      </Button>
    );
  }

  const encodedUrl = encodeURIComponent(currentUrl);
  const shareTitle = `¡Mira a ${figureName} en StarSage!`; // Updated app name
  const encodedTitle = encodeURIComponent(shareTitle);
  const emailSubject = encodeURIComponent(`Perfil de ${figureName} en StarSage`);
  const emailBody = encodeURIComponent(`Hola,\n\nEcha un vistazo al perfil de ${figureName} en StarSage:\n`);


  const socialOptions: SocialShareOption[] = [
    {
      name: "Copiar Enlace",
      icon: LinkIcon,
      url: "#copy", // Special handler for copying
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "Twitter (X)",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: "Reddit",
      icon: RedditIcon,
      url: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      name: "Correo Electrónico",
      icon: Mail,
      url: `mailto:?subject=${emailSubject}&body=${emailBody}${encodedUrl}`,
      isMailto: true,
    },
  ];

  const handleShareOptionClick = async (option: SocialShareOption) => {
    if (option.url === "#copy") {
      try {
        await navigator.clipboard.writeText(currentUrl);
        toast({ title: "¡Enlace Copiado!", description: "Enlace del perfil copiado al portapapeles." });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast({ title: "No se pudo copiar el enlace", variant: "destructive" });
      }
    } else if (option.isMailto) {
        window.location.href = option.url;
    }
    else {
      // For other social media, open in a new tab
      window.open(option.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`Compartir perfil de ${figureName}`}>
          <Share2 className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Compartir Perfil</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {socialOptions.map((option) => (
          <DropdownMenuItem key={option.name} onClick={() => handleShareOptionClick(option)} className="cursor-pointer">
            <option.icon className="mr-2 h-4 w-4" />
            <span>{option.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
