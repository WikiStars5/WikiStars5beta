
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareButton } from "@/components/shared/ShareButton";
import { ImageOff } from "lucide-react";

interface ProfileHeaderProps {
  figure: Figure;
}

export function ProfileHeader({ figure }: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden shadow-lg p-4 md:p-6">
      <div className="flex flex-col items-center w-full space-y-6">

        {/* Text Section: Name, Description, Share Button */}
        <div className="w-full">
          <CardHeader className="p-0 text-left">
            <div className="flex justify-between items-start mb-2">
              <CardTitle className="text-3xl lg:text-4xl font-headline text-primary">
                {figure.name}
              </CardTitle>
              <ShareButton figureName={figure.name} figureId={figure.id} />
            </div>
            <CardDescription className="text-lg text-muted-foreground">
              {figure.description || "Sin descripción proporcionada."}
            </CardDescription>
          </CardHeader>
        </div>

        {/* Image Section: Centered and smaller */}
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto aspect-[3/4] bg-muted rounded-lg overflow-hidden shadow-md">
          {figure.photoUrl ? (
            <Image
              src={figure.photoUrl}
              alt={figure.name}
              layout="fill"
              objectFit="cover"
              priority
              data-ai-hint="portrait person"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted" data-ai-hint="placeholder abstract">
              <ImageOff className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>
        
      </div>
    </Card>
  );
}
