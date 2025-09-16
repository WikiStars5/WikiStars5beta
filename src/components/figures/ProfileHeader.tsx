
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { ShareButton } from "@/components/shared/ShareButton";
import { correctMalformedUrl } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { VerificationCountdown } from "./VerificationCountdown";

const FIRE_GIF_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/image%2Ffire.gif?alt=media&token=fd18d32d-c443-4da6-a369-e55ae241f7c5";


interface ProfileHeaderProps {
  figure: Figure;
  onImageClick: (imageUrl: string) => void;
  currentStreak: number | null;
}

export function ProfileHeader({ 
  figure, 
  onImageClick,
  currentStreak,
}: ProfileHeaderProps) {
  const correctedPhotoUrl = correctMalformedUrl(figure.photoUrl);
  const { isAdmin } = useAuth();
  
  const showCountdown = figure.creationMethod === 'manual' && 
                        !figure.isCommunityVerified && 
                        figure.manualVerificationExpiresAt;

  return (
    <div className="w-full bg-black border border-white/20 p-4 sm:p-6 rounded-lg shadow-md">
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
            <div className="flex-grow flex flex-col md:flex-row justify-between items-center w-full gap-2">
              <h1 className="text-2xl md:text-4xl font-headline font-bold text-foreground drop-shadow-lg">
                {figure.name}
              </h1>
              <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-2">
                 <div className="flex items-center gap-2">
                    {showCountdown && (
                      <VerificationCountdown expiresAt={figure.manualVerificationExpiresAt!} />
                    )}
                    <ShareButton figureName={figure.name} figureId={figure.id} showText={false} />
                </div>
                {currentStreak && currentStreak > 0 && (
                    <div className="flex items-center gap-1.5 text-orange-400 font-bold text-lg">
                         <Image
                            src={FIRE_GIF_URL}
                            alt="Racha activa"
                            width={24}
                            height={24}
                            unoptimized
                            data-ai-hint="fire gif"
                        />
                        <span>Día {currentStreak}</span>
                    </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
    </div>
  );
}
