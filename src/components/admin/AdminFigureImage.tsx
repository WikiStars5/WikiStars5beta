
"use client";

// import Image from "next/image"; // No longer using next/image directly here
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
        <img
          src={figure.photoUrl}
          alt={figure.name}
          style={{ width: `${width}px`, height: `${height}px` }}
          className="rounded object-cover aspect-[3/4]"
          loading="lazy"
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
