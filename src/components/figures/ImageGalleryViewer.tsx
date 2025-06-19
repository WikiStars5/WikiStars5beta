
"use client";

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { GalleryImage } from '@/lib/types';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';

interface ImageGalleryViewerProps {
  images: GalleryImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGalleryViewer({ images, initialIndex, isOpen, onClose }: ImageGalleryViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const element = scrollContainerRef.current.children[initialIndex] as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }
    setCurrentIndex(initialIndex); // Reset index when re-opened or initialIndex changes
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        scrollToImage((currentIndex + 1) % images.length);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        scrollToImage((currentIndex - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentIndex, images.length]);

  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const element = scrollContainerRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentIndex(index);
      }
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className={`p-0 border-0 bg-black/90 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center
                    ${isFullScreen ? 'fixed inset-0 w-screen h-screen max-w-none rounded-none' : 'sm:max-w-screen-lg h-[90vh] sm:rounded-lg'}
                    transition-all duration-300 ease-in-out`}
        onInteractOutside={(e) => e.preventDefault()} // Prevents closing on outside click
      >
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

        {images.length > 0 && (
          <>
            <div 
              ref={scrollContainerRef}
              className="w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                const newIndex = Math.round(target.scrollTop / target.clientHeight);
                if (newIndex !== currentIndex) {
                    setCurrentIndex(newIndex);
                }
              }}
            >
              {images.map((image, index) => (
                <div
                  key={image.id || index}
                  className="w-full h-full flex items-center justify-center snap-start relative"
                  id={`viewer-image-${index}`}
                >
                  <Image
                    src={image.imageUrl}
                    alt={`Imagen de galería ${index + 1}`}
                    fill
                    className="object-contain p-4" // p-4 to avoid touching edges
                    sizes="100vw"
                    priority={index === initialIndex}
                    data-ai-hint="full screen image"
                  />
                </div>
              ))}
            </div>
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollToImage((currentIndex - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 hover:text-white"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollToImage((currentIndex + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 hover:text-white"
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
