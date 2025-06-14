
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FigureListItemProps {
  figure: Figure;
}

export function FigureListItem({ figure }: FigureListItemProps) {
  return (
    <Link href={`/figures/${figure.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50">
        <CardHeader className="p-0 relative">
          {figure.photoUrl ? (
            <Image
              src={figure.photoUrl}
              alt={figure.name}
              width={300}
              height={400}
              className="w-full aspect-[3/4] object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              onError={(e) => { 
                const target = e.currentTarget as HTMLImageElement;
                target.src = 'https://placehold.co/300x400.png?text=Error'; 
                target.srcset = '';
              }}
              data-ai-hint="portrait person"
            />
          ) : (
             <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center" data-ai-hint="placeholder abstract">
               <ImageOff className="h-16 w-16 text-muted-foreground" />
             </div>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-xl font-headline mb-1 group-hover:text-primary">{figure.name}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{figure.description || "Sin descripción disponible."}</p>
        </CardContent>
        <CardFooter className="p-4 flex justify-end items-center border-t">
          <Badge variant="secondary">Ver Perfil</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
