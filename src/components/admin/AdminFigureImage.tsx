
"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { Figure } from "@/lib/types";

interface AdminFigureImageProps {
  figure: Pick<Figure, "photoUrl" | "name">;
  width?: number;
  height?: number;
}

export function AdminFigureImage({ figure, width = 50, height = 70 }: AdminFigureImageProps) {
  return (
    <>
      {figure.photoUrl ? (
        <Image
          src={figure.photoUrl}
          alt={figure.name}
          width={width}
          height={height}
          className="rounded object-cover aspect-[3/4]"
          onError={(e) => { 
            const target = e.currentTarget as HTMLImageElement;
            target.src = `https://placehold.co/${width}x${height}.png?text=Error`;
            target.srcset = ''; 
          }}
        />
      ) : (
        <div 
          className="bg-muted rounded flex items-center justify-center"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <ImageOff className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </>
  );
}
