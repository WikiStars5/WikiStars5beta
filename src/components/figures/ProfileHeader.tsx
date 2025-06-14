
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// REMOVIDO: import { StarRating } from "@/components/shared/StarRating";
import { ShareButton } from "@/components/shared/ShareButton";
import { ImageOff } from "lucide-react";

interface ProfileHeaderProps {
  figure: Figure;
}

export function ProfileHeader({ figure }: ProfileHeaderProps) {
  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="md:flex">
        <div className="md:w-1/3 relative bg-muted">
          {figure.photoUrl ? (
            <Image
              src={figure.photoUrl}
              alt={figure.name}
              width={400}
              height={500}
              className="w-full h-auto md:h-full object-cover"
              priority 
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x500.png?text=Error'; e.currentTarget.srcset = '' }}
            />
          ) : (
            <div className="w-full aspect-[4/5] md:h-full flex items-center justify-center">
               <ImageOff className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 mb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-3xl lg:text-4xl font-headline text-primary">{figure.name}</CardTitle>
                <ShareButton figureName={figure.name} figureId={figure.id} />
              </div>
              <CardDescription className="text-lg text-muted-foreground">{figure.description || "Sin descripción proporcionada."}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Sección de Calificación Pública Promedio eliminada */}
            </CardContent>
          </div>
        </div>
      </div>
    </Card>
  );
}
