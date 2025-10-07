

"use client";

import * as React from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface StreakAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'streak'; // Removed 'install' as it's now handled by a toast
  streakCount?: number | null;
}

const FIRE_GIF_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/image%2Ffire.gif?alt=media&token=fd18d32d-c443-4da6-a369-e55ae241f7c5";

export function StreakAnimation({ streakCount, isOpen, onClose, type }: StreakAnimationProps) {
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Animation duration: 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || type !== 'streak' || !streakCount) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in-50"
      onClick={onClose} // Allow closing by clicking the background
    >
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
    </div>
  );
}
