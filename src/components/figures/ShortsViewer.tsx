
"use client"

import * as React from 'react';
import type { YoutubeShort } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortsViewerProps {
  shorts: YoutubeShort[];
  startIndex: number;
  onClose: () => void;
}

export function ShortsViewer({ shorts, startIndex, onClose }: ShortsViewerProps) {
  const [api, setApi] = React.useState<CarouselApi>();

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') scrollPrev();
      if (event.key === 'ArrowDown') scrollNext();
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, scrollPrev, scrollNext]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 border-0 bg-black w-screen h-screen max-w-full sm:max-w-full rounded-none flex items-center justify-center">
        <DialogTitle className="sr-only">Visor de YouTube Shorts</DialogTitle>
        <DialogDescription className="sr-only">Desliza hacia arriba o abajo para ver más videos.</DialogDescription>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white bg-black/30 hover:bg-black/60 hover:text-white"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Cerrar</span>
        </Button>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            startIndex: startIndex,
          }}
          orientation="vertical"
          className="w-full h-full max-w-[400px] max-h-[90vh] sm:max-h-[80vh] flex items-center justify-center"
        >
          <CarouselContent className="h-full -mt-0">
            {shorts.map((short, index) => (
              <CarouselItem key={index} className="pt-0 basis-full flex items-center justify-center">
                <div className="relative w-full h-full">
                   <iframe
                      src={`https://www.youtube.com/embed/${short.videoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&rel=0&modestbranding=1&controls=1`}
                      title={short.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ aspectRatio: '9/16' }}
                    ></iframe>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
           <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center">
              <Button onClick={scrollPrev} variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20 hover:text-white">
                <ChevronUp className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex flex-col items-center">
              <Button onClick={scrollNext} variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20 hover:text-white">
                <ChevronDown className="h-6 w-6" />
              </Button>
          </div>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
