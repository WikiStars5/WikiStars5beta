
"use client";

import Image from "next/image"; // Using next/image
import { ImageOff } from "lucide-react";
import type { Figure } from "@/lib/types";
import { correctMalformedUrl } from "@/lib/utils";

interface AdminFigureImageProps {
  figure: Pick<Figure, "photoUrl" | "name">;
  width?: number;
  height?: number;
}

export function AdminFigureImage({ figure, width = 50, height = 70 }: AdminFigureImageProps) {
  const correctedPhotoUrl = correctMalformedUrl(figure.photoUrl);

  return (
    <>
      {correctedPhotoUrl ? (
        <Image
          src={correctedPhotoUrl}
          alt={figure.name}
          width={width}
          height={height}
          className="rounded object-cover" // Removed aspect-[3/4] as width/height props define aspect
          data-ai-hint="thumbnail person"
        />
      ) : (
        <div 
          className="bg-muted rounded flex items-center justify-center"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <ImageOff className="h-6 w-6 text-muted-foreground" data-ai-hint="placeholder icon" />
        </div>
      )}
    </>
  );
}
