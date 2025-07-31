
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { ShareButton } from "@/components/shared/ShareButton";
import { correctMalformedUrl, cn } from "@/lib/utils";
import type { User } from 'firebase/auth';
import { Badge } from "@/components/ui/badge";
import { Flame, Heart } from "lucide-react";
import { Button } from "../ui/button";

interface ProfileHeaderProps {
  figure: Figure;
  currentUser: User | null;
  currentUserStreak: number | null;
  isFan: boolean;
  onFanToggle: () => void;
  onImageClick: (imageUrl: string) => void;
}

export function ProfileHeader({ 
  figure, 
  currentUser,
  currentUserStreak,
  isFan,
  onFanToggle,
  onImageClick,
}: ProfileHeaderProps) {
  const correctedPhotoUrl = correctMalformedUrl(figure.photoUrl);

  return (
    <div className="w-full bg-card p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-5">
          <div className="relative flex-shrink-0 w-28 h-28 md:w-36 md:h-36">
             <button 
                onClick={() => correctedPhotoUrl && onImageClick(correctedPhotoUrl)} 
                disabled={!correctedPhotoUrl} 
                className="w-full h-full block rounded-full border-4 border-black shadow-xl bg-card overflow-hidden group/avatar drop-shadow-lg"
                aria-label={`Ver foto de perfil de ${figure.name} en pantalla completa`}
              >
              {correctedPhotoUrl ? (
                <Image
                  src={correctedPhotoUrl}
                  alt={figure.name}
                  fill
                  className="rounded-full object-cover group-hover/avatar:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 112px, 144px"
                  data-ai-hint="portrait person"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-full bg-muted">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {figure.name.split(' ').map(n => n[0]).join('').substring(0, 3)}
                  </span>
                </div>
              )}
            </button>
          </div>

          <div className="flex-grow flex flex-col items-center md:items-start text-center md:text-left mt-4 md:mt-0 w-full">
            <div className="flex-grow flex flex-col md:flex-row justify-between items-center w-full">
              <h1 className="text-2xl md:text-4xl font-headline font-bold text-foreground drop-shadow-lg">
                {figure.name}
              </h1>
              <div className="mt-3 md:mt-0 flex-shrink-0 flex flex-col items-center md:items-end gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={onFanToggle} aria-label={isFan ? 'Quitar de fans' : 'Añadir a fans'}>
                      <Heart className={cn("h-5 w-5", isFan ? "fill-red-500 text-red-500" : "text-foreground/70")} />
                    </Button>
                    <ShareButton figureName={figure.name} figureId={figure.id} showText={false} />
                </div>
                {currentUserStreak && currentUserStreak > 0 && (
                  <div className="flex items-center gap-2 text-orange-400 font-semibold bg-orange-400/10 px-3 py-1 rounded-full text-sm">
                    <Flame className="h-5 w-5" />
                    <span>Racha actual: {currentUserStreak} {currentUserStreak === 1 ? 'día' : 'días'}</span>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
    </div>
  );
}
