"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { ShareButton } from "@/components/shared/ShareButton";
import { correctMalformedUrl } from "@/lib/utils";
import type { User } from 'firebase/auth';

interface ProfileHeaderProps {
  figure: Figure;
  currentUser: User | null;
  onImageClick: (imageUrl: string) => void;
}

export function ProfileHeader({ 
  figure, 
  currentUser,
  onImageClick
}: ProfileHeaderProps) {
  const correctedCoverPhotoUrl = correctMalformedUrl(figure.coverPhotoUrl);
  const correctedPhotoUrl = correctMalformedUrl(figure.photoUrl);

  const coverImage = correctedCoverPhotoUrl || 'https://placehold.co/1200x400.png';

  return (
    <div className="w-full">
      <div className="relative h-48 md:h-64 bg-muted rounded-lg overflow-hidden shadow-lg group">
        <button onClick={() => onImageClick(coverImage)} className="w-full h-full block" aria-label={`Ver imagen de portada de ${figure.name} en pantalla completa`}>
          <Image
            src={coverImage}
            alt={`Portada de ${figure.name}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
            data-ai-hint={correctedCoverPhotoUrl ? "background landscape" : "abstract pattern"}
          />
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
      </div>

      <div className="bg-card p-4 rounded-b-lg shadow-lg">
        <div className="relative -mt-16 md:-mt-20 flex flex-col items-center md:flex-row md:items-end md:space-x-5">
          <div className="relative flex-shrink-0 w-28 h-28 md:w-36 md:h-36">
             <button 
                onClick={() => correctedPhotoUrl && onImageClick(correctedPhotoUrl)} 
                disabled={!correctedPhotoUrl} 
                className="w-full h-full block rounded-full border-4 border-card shadow-xl bg-muted overflow-hidden group/avatar"
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
                <div className="w-full h-full flex items-center justify-center rounded-full">
                  <span className="text-4xl font-bold text-muted-foreground">
                    {figure.name.split(' ').map(n => n[0]).join('').substring(0, 3)}
                  </span>
                </div>
              )}
            </button>
          </div>

          <div className="flex-grow flex flex-col md:flex-row justify-between items-center w-full mt-3 md:mt-0">
             <h1 className="text-2xl md:text-4xl font-headline font-bold text-foreground text-center md:text-left">
              {figure.name}
            </h1>
            <div className="mt-3 md:mt-0 md:pb-4 flex-shrink-0">
              <ShareButton figureName={figure.name} figureId={figure.id} showText={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
