
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
      <div className="flex flex-col md:flex-row items-center md:items-start w-full space-y-6 md:space-y-0 md:space-x-6">
        {/* Image Section */}
        <div className="relative w-full md:w-1/3 max-w-xs sm:max-w-sm md:max-w-md mx-auto md:mx-0 aspect-[3/4] bg-muted rounded-lg overflow-hidden shadow-md">
          {figure.photoUrl ? (
            <Image
              src={figure.photoUrl}
              alt={figure.name}
              fill
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 80vw, 33vw"
              className="object-contain" // Changed from object-cover
              data-ai-hint="portrait person"
              priority={true}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted" data-ai-hint="placeholder abstract">
              <ImageOff className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Text Section: Name, Description, Share Button */}
        <div className="w-full md:w-2/3 text-center md:text-left">
          <CardHeader className="p-0">
            <div className="flex flex-col sm:flex-row justify-center md:justify-between items-center mb-2 gap-2">
              <CardTitle className="text-3xl lg:text-4xl font-headline text-primary">
                {figure.name}
              </CardTitle>
              <ShareButton figureName={figure.name} figureId={figure.id} />
            </div>
            {/* Displaying a brief, non-editable description in the header */}
            <CardDescription className="text-lg text-muted-foreground mt-2">
              {figure.description?.substring(0, 150) || "Información detallada abajo."}
              {figure.description && figure.description.length > 150 ? "..." : ""}
            </CardDescription>
          </CardHeader>
        </div>
      </div>
    </Card>
  );
}
