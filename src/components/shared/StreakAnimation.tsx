

"use client";

import * as React from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface StreakAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'streak' | 'install';
  streakCount?: number | null;
  onInstallClick?: () => void;
}

const FIRE_GIF_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/image%2Ffire.gif?alt=media&token=fd18d32d-c443-4da6-a369-e55ae241f7c5";
const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194";


export function StreakAnimation({ streakCount, isOpen, onClose, type, onInstallClick }: StreakAnimationProps) {
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Animation duration: 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const renderContent = () => {
    if (type === 'streak' && streakCount) {
        return (
             <div className="flex flex-col items-center text-center animate-in zoom-in-90 slide-in-from-bottom-10">
                <Image
                src={FIRE_GIF_URL}
                alt="Animación de racha"
                width={250}
                height={250}
                unoptimized // GIFs are not optimized by Next.js Image component
                priority
                data-ai-hint="fire gif"
                />
                <div className="mt-2 text-orange-400 font-bold drop-shadow-lg">
                <p className="text-2xl">¡Racha de Días!</p>
                <p className="text-6xl font-headline">Día {streakCount}</p>
                </div>
            </div>
        );
    }
    
    if (type === 'install' && onInstallClick) {
        return (
            <div className="flex flex-col items-center text-center animate-in zoom-in-90 slide-in-from-bottom-10 p-4">
                <Image
                src={LOGO_URL}
                alt="Logo de WikiStars5"
                width={150}
                height={150}
                priority
                />
                <div className="mt-4 text-white font-bold drop-shadow-lg">
                    <p className="text-2xl">¡Gracias por tu primera opinión!</p>
                    <p className="text-lg mt-2">¿Quieres una mejor experiencia? Instala la aplicación.</p>
                </div>
                <Button 
                    className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6 px-8 rounded-full"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent background click
                        onInstallClick();
                    }}
                >
                   <Download className="mr-3 h-5 w-5" /> Instalar Aplicación
                </Button>
            </div>
        );
    }

    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in-50"
      onClick={onClose} // Allow closing by clicking the background
    >
      {renderContent()}
    </div>
  );
}
