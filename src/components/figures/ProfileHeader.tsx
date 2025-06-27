
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { Card, CardTitle } from "@/components/ui/card";
import { ShareButton } from "@/components/shared/ShareButton";
import { ImageOff, Heart } from "lucide-react";
import { correctMalformedUrl, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  figure: Figure;
  supportCount: number;
  isSupported: boolean;
  isLoadingSupport: boolean;
  onSupportToggle: () => void;
  canSupport: boolean;
}

export function ProfileHeader({ 
  figure, 
  supportCount, 
  isSupported, 
  isLoadingSupport, 
  onSupportToggle, 
  canSupport 
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
            <div className="flex items-center gap-1.5" title={canSupport ? `${supportCount.toLocaleString()} apoyos` : "Inicia sesión para ver y dar apoyo"}>
              <Button 
                variant={isSupported ? "destructive" : "outline"} 
                size="icon" 
                onClick={onSupportToggle} 
                disabled={isLoadingSupport || !canSupport}
                aria-label="Apoyar figura"
              >
                <Heart className={cn("h-5 w-5", isSupported && "fill-current")} />
              </Button>
              <span className="text-sm font-semibold text-foreground">{supportCount.toLocaleString()}</span>
            </div>
            <ShareButton figureName={figure.name} figureId={figure.id} />
          </div>

        </div>
      </div>
    </Card>
  );
}
