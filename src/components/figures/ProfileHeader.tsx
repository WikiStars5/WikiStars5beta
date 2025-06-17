
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { Card, CardTitle } from "@/components/ui/card"; // CardHeader removed as it's not strictly needed for this layout
import { ShareButton } from "@/components/shared/ShareButton";
import { ImageOff } from "lucide-react";

interface ProfileHeaderProps {
  figure: Figure;
}

export function ProfileHeader({ figure }: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden shadow-lg p-4 md:p-6">
      {/* Flex container to center the content column. */}
      <div className="flex justify-center w-full">
        {/* Content column: items will be stacked vertically.
            items-center will center children on extra-small screens.
            md:items-start will left-align children on medium screens and up within this column.
            max-w-xl provides a boundary for the content.
        */}
        <div className="flex flex-col items-center md:items-start w-full max-w-xl space-y-4">
          
          {/* Name and Share Button Section */}
          {/* This div itself will be left-aligned on md+ screens due to md:items-start on parent.
              Inside, on sm+ screens, name and share button are in a row.
              justify-center ensures centering on xs screens where name/share might stack or be in a row.
              sm:justify-start aligns the row content to the start on sm+ screens.
          */}
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-4 w-full justify-center sm:justify-start">
            <CardTitle className="text-3xl lg:text-4xl font-headline text-primary text-center sm:text-left">
              {figure.name}
            </CardTitle>
            <ShareButton figureName={figure.name} figureId={figure.id} />
          </div>

          {/* Image Section */}
          {/* Image container:
              - On small screens (xs), centered due to `items-center` on the parent column. `w-4/5` makes it not touch edges.
              - On `sm` screens and up, `w-full` makes it take the width of `max-w-xl` parent.
              - `md:self-start` ensures it aligns to the start of the column on medium screens, matching the text block.
           */}
          <div className="relative w-4/5 sm:w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden shadow-md md:self-start">
            {figure.photoUrl ? (
              <Image
                src={figure.photoUrl}
                alt={figure.name}
                fill
                sizes="(max-width: 639px) 80vw, (max-width: 1023px) 100vw, 672px" // max-w-xl is 672px
                className="object-contain" // Using object-contain as the image seems to be a portrait
                data-ai-hint="portrait person"
                priority={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted" data-ai-hint="placeholder abstract">
                <ImageOff className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
