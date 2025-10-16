
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
import { Share2, Link as LinkIcon, Facebook, Twitter, Linkedin, MessageCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple inline SVG component for Reddit Icon
const RedditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props} // Allows passing className, size, etc.
  >
    <title>Reddit</title>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zm-3 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zm-1.79-4.71L10.5 6h3l3.79 3.79c.2.2.2.51 0 .71l-1.06 1.06c-.2.2-.51.2-.71 0L14.41 10H9.59l-1.12 1.56c-.2.2-.51.2-.71 0l-1.06-1.06c-.2-.2-.2-.51 0-.71z" fill="currentColor"/>
  </svg>
);


interface ShareButtonProps {
  figureName: string;
  figureId: string;
  showText?: boolean;
}

interface SocialShareOption {
  name: string;
  icon: React.ElementType;
  url: string;
  isMailto?: boolean;
}

export function ShareButton({ figureName, figureId, showText = false }: ShareButtonProps) {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = useState('');
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin + `/figures/${figureId}`);
      if (navigator.share) {
        setIsWebShareSupported(true);
      }
    }
  }, [figureId]);

  const buttonSize = showText ? "default" : "icon";


  if (!currentUrl) {
    // Return a disabled button or a placeholder while URL is not available
    return (
      <Button variant="outline" size={buttonSize} aria-label="Cargando opciones para compartir" disabled>
        <Share2 className="h-5 w-5" />
        {showText && <span className="ml-2">Compartir</span>}
      </Button>
    );
  }

  // If Web Share API is supported, show a direct share button.
  const handleNativeShare = async () => {
    if (navigator.share) {
      const shareTitle = `¡Mira a ${figureName} en WikiStars5!`;
      const shareText = `¡Echa un vistazo al perfil, opiniones y calificaciones de ${figureName} en WikiStars5!`;
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
      } catch (error) {
        // This can happen if the user cancels the share dialog. We don't need to show an error for that.
        console.log("Web Share API was cancelled or failed:", error);
      }
    }
  };

  if (isWebShareSupported) {
    return (
      <Button
        variant="outline"
        size={buttonSize}
        onClick={handleNativeShare}
        aria-label={`Compartir perfil de ${figureName}`}
      >
        <Share2 className="h-5 w-5" />
        {showText && <span className="ml-2">Compartir</span>}
      </Button>
    );
  }

  // --- Fallback for browsers that don't support Web Share API (e.g., desktop) ---

  const encodedUrl = encodeURIComponent(currentUrl);
  const shareTitle = `¡Mira a ${figureName} en WikiStars5!`;
  const encodedTitle = encodeURIComponent(shareTitle);
  const emailSubject = encodeURIComponent(`Perfil de ${figureName} en WikiStars5`);
  const emailBody = encodeURIComponent(`Hola,\n\nEcha un vistazo al perfil de ${figureName} en WikiStars5:\n`);


  const socialOptions: SocialShareOption[] = [
    {
      name: "Copiar Enlace",
      icon: LinkIcon,
      url: "#copy",
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
        <Button variant="outline" size={buttonSize} aria-label={`Compartir perfil de ${figureName}`}>
          <Share2 className="h-5 w-5" />
          {showText && <span className="ml-2">Compartir</span>}
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
