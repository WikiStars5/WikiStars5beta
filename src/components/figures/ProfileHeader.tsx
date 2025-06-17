
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card"; // CardDescription removed from imports
import { ShareButton } from "@/components/shared/ShareButton";
import { ImageOff } from "lucide-react";

interface ProfileHeaderProps {
  figure: Figure;
}

export function ProfileHeader({ figure }: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden shadow-lg p-4 md:p-6">
      {/* Main container for image and text blocks */}
      {/* On md screens and up: centers the (image + text) group, image on left, text on right, vertically centered */}
      {/* On smaller screens: items stack vertically and are centered */}
      <div className="flex flex-col md:flex-row items-center md:items-center justify-center w-full md:space-x-8 space-y-4 md:space-y-0">
        
        {/* Image Section */}
        <div className="relative w-4/5 max-w-[260px] sm:max-w-[280px] md:w-[240px] lg:w-[280px] aspect-[3/4] bg-muted rounded-lg overflow-hidden shadow-md mx-auto md:mx-0 flex-shrink-0">
          {figure.photoUrl ? (
            <Image
              src={figure.photoUrl}
              alt={figure.name}
              fill
              sizes="(max-width: 639px) 80vw, (max-width: 767px) 280px, (max-width: 1023px) 240px, 280px"
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

        {/* Text Section: Name, Share Button */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <CardHeader className="p-0">
            {/* Container for Title and Share button for better alignment control */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 md:justify-start">
              <CardTitle className="text-3xl lg:text-4xl font-headline text-primary">
                {figure.name}
              </CardTitle>
              <ShareButton figureName={figure.name} figureId={figure.id} />
            </div>
            {/* The CardDescription previously here has been removed */}
          </CardHeader>
        </div>
      </div>
    </Card>
  );
}

