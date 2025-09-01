
"use client";

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryViewerProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGalleryViewer({ imageUrl, isOpen, onClose }: ImageGalleryViewerProps) {
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false); // First, exit fullscreen mode
        } else {
          onClose(); // Then, close the dialog
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isFullScreen]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  if (!isOpen || !imageUrl) {
    return null;
  }
  
  // This is the corrected implementation. It uses `cn` to conditionally apply classes,
  // which is a cleaner and more reliable way to handle dynamic styling.
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className={cn(
          "p-0 border-0 bg-black/90 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
          isFullScreen 
            ? 'fixed inset-0 w-screen h-screen max-w-none rounded-none' 
            : 'sm:max-w-screen-lg h-[90vh] sm:rounded-lg'
        )}
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside if in fullscreen mode
          if (isFullScreen) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">Visor de Imágenes</DialogTitle>
        <DialogDescription className="sr-only">
          Imagen de perfil.
        </DialogDescription>
        <div className="absolute top-2 right-2 z-50 flex gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-white/20 hover:text-white">
            {isFullScreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
            <span className="sr-only">{isFullScreen ? "Salir de pantalla completa" : "Pantalla completa"}</span>
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
              <X className="h-6 w-6" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DialogClose>
        </div>

        <div className="w-full h-full flex items-center justify-center relative p-4">
          <Image
            src={imageUrl}
            alt="Visor de imagen"
            fill
            className="object-contain"
            sizes="100vw"
            priority
            data-ai-hint="full screen image"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
