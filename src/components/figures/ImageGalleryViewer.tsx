
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
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  if (!isOpen || !imageUrl) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className={`p-0 border-0 bg-black/90 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center
                    ${isFullScreen ? 'fixed inset-0 w-screen h-screen max-w-none rounded-none' : 'sm:max-w-screen-lg h-[90vh] sm:rounded-lg'}
                    transition-all duration-300 ease-in-out`}
        onInteractOutside={(e) => e.preventDefault()}
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

        <div 
          className="w-full h-full flex items-center justify-center relative"
        >
          <Image
            src={imageUrl}
            alt="Visor de imagen"
            fill
            className="object-contain p-4"
            sizes="100vw"
            priority
            data-ai-hint="full screen image"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
