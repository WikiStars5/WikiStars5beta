
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
  const [isEnlarged, setIsEnlarged] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        if (isEnlarged) {
          setIsEnlarged(false); // First, exit enlarged mode
          event.preventDefault(); // Prevent the dialog from closing immediately
        } else {
          onClose(); // Then, close the dialog
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isEnlarged]);

  // Reset state when dialog is closed
  React.useEffect(() => {
    if (!isOpen) {
      setIsEnlarged(false);
    }
  }, [isOpen]);
  
  if (!isOpen || !imageUrl) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className={cn(
          "p-0 border-0 bg-black/90 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
          isEnlarged
            ? 'w-[98vw] h-[98vh] max-w-[98vw]' 
            : 'sm:max-w-screen-lg h-[90vh]'
        )}
        onInteractOutside={(e) => {
          if (isEnlarged) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">Visor de Imágenes</DialogTitle>
        <DialogDescription className="sr-only">
          Imagen de perfil.
        </DialogDescription>
        <div className="absolute top-2 right-2 z-50 flex gap-2">
          {isEnlarged ? (
             <Button variant="ghost" size="icon" onClick={() => setIsEnlarged(false)} className="text-white hover:bg-white/20 hover:text-white">
                <Minimize className="h-6 w-6" />
                <span className="sr-only">Achicar</span>
            </Button>
          ) : (
             <Button variant="ghost" size="icon" onClick={() => setIsEnlarged(true)} className="text-white hover:bg-white/20 hover:text-white">
                <Maximize className="h-6 w-6" />
                <span className="sr-only">Agrandar</span>
            </Button>
          )}

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
