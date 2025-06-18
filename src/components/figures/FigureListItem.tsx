
"use client";

import type { Figure, StarValue, StarValueAsString } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageOff, Star } from "lucide-react"; // Import Star icon
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/StarRating"; // Import StarRating component

interface FigureListItemProps {
  figure: Figure;
}

export function FigureListItem({ figure }: FigureListItemProps) {
  const counts = figure.starRatingCounts || { "1":0,"2":0,"3":0,"4":0,"5":0 };
  const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);
  
  let weightedSum = 0;
  for (const starKey in counts) {
    const starValue = parseInt(starKey) as StarValue;
    weightedSum += counts[starKey as StarValueAsString] * starValue;
  }
  
  const averageRating = totalVotes > 0 ? parseFloat((weightedSum / totalVotes).toFixed(1)) : 0;

  return (
    <Link href={`/figures/${figure.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50">
        <CardHeader className="p-0 relative w-full aspect-[3/4]">
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
             <div className="w-full h-full bg-muted flex items-center justify-center" data-ai-hint="placeholder abstract">
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
        <CardFooter className="p-4 flex justify-between items-center border-t">
          <div className="flex items-center gap-1.5">
            {totalVotes > 0 ? (
              <>
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-foreground">{averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({totalVotes})</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Sin calificar</span>
            )}
          </div>
          <Badge variant="secondary">Ver Perfil</Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
