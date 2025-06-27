
"use client";

import type { Figure, UserProfile } from "@/lib/types";
import Image from "next/image";
import { Card, CardTitle } from "@/components/ui/card";
import { ShareButton } from "@/components/shared/ShareButton";
import { ImageOff } from "lucide-react";
import { correctMalformedUrl } from "@/lib/utils";
import type { User } from 'firebase/auth';

interface ProfileHeaderProps {
  figure: Figure;
  currentUser: User | null;
  userProfile: UserProfile | null;
}

export function ProfileHeader({ 
  figure, 
  currentUser,
  userProfile
}: ProfileHeaderProps) {
  const correctedPhotoUrl = correctMalformedUrl(figure.photoUrl);

  return (
    <Card className="overflow-hidden shadow-lg p-4 md:p-6">
      <div className="flex justify-center w-full">
        <div className="flex flex-col items-center w-full max-w-xl space-y-4">
          
          <CardTitle className="text-3xl lg:text-4xl font-headline text-primary text-center">
            {figure.name}
          </CardTitle>

          <div className="relative w-4/5 sm:w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden shadow-md">
            {correctedPhotoUrl ? (
              <Image
                src={correctedPhotoUrl}
                alt={figure.name}
                fill
                sizes="(max-width: 639px) 80vw, (max-width: 1023px) 100vw, 672px"
                className="object-contain"
                data-ai-hint="portrait person"
                priority={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted" data-ai-hint="placeholder abstract">
                <ImageOff className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 w-full">
            <ShareButton figureName={figure.name} figureId={figure.id} showText={true} />
          </div>

        </div>
      </div>
    </Card>
  );
}
