
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image"; // Reverted to next/image
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
        <CardHeader className="p-0 relative w-full aspect-[3/4]"> {/* Added w-full aspect-[3/4] for next/image fill */}
          {figure.photoUrl ? (
            <Image
              src={figure.photoUrl}
              alt={figure.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              data-ai-hint="portrait person"
              priority={false} 
            />
          ) : (
             <div className="w-full h-full bg-muted flex items-center justify-center" data-ai-hint="placeholder abstract"> {/* Ensure this div fills the aspect ratio */}
               <ImageOff className="h-16 w-16 text-muted-foreground" />
             </div>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-xl font-headline mb-1 group-hover:text-primary">{figure.name}</CardTitle>
          {figure.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{figure.description}</p>
          )}
        </CardContent>
        <CardFooter className="p-4 flex justify-end items-center border-t">
          <Badge variant="secondary">Ver Perfil</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
