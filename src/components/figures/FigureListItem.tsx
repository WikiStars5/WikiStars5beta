
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ImageOff, Star } from "lucide-react";
import { correctMalformedUrl, cn } from "@/lib/utils";
import * as React from 'react';

interface FigureListItemProps {
  figure: Figure;
  cardStyle?: 'default' | 'playstore';
}

const StarRating = ({ ratingCounts }: { ratingCounts: Record<string, number> | undefined }) => {
    const { averageRating, totalVotes } = React.useMemo(() => {
        if (!ratingCounts) return { averageRating: 0, totalVotes: 0 };
        const votes = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
        if (votes === 0) return { averageRating: 0, totalVotes: 0 };
        const weightedSum = Object.entries(ratingCounts).reduce((sum, [rating, count]) => sum + parseInt(rating) * count, 0);
        return { totalVotes: votes, averageRating: weightedSum / votes };
    }, [ratingCounts]);

    if (totalVotes === 0) {
        return null; // No mostrar nada si no hay votos
    }

    return (
        <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-bold">{averageRating.toFixed(1)}</span>
            <Star className="h-3 w-3 text-primary fill-current" />
        </div>
    );
};


export function FigureListItem({ figure, cardStyle = 'default' }: FigureListItemProps) {
  const correctedPhotoUrl = correctMalformedUrl(figure.photoUrl);

  if (cardStyle === 'playstore') {
    return (
      <Link href={`/figures/${figure.id}`} className="block group w-full">
        <div className="flex flex-col gap-2">
           <Card className="overflow-hidden w-full aspect-square rounded-2xl transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50">
              <div className="relative w-full h-full">
                {correctedPhotoUrl ? (
                  <Image
                    src={correctedPhotoUrl}
                    alt={figure.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                    data-ai-hint="portrait person"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center" data-ai-hint="placeholder abstract">
                    <ImageOff className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
          </Card>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">{figure.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
               {figure.category && <span className="text-xs text-muted-foreground">{figure.category}</span>}
               {figure.ratingCounts && (
                   <>
                    {figure.category && <span className="mx-1">•</span>}
                    <StarRating ratingCounts={figure.ratingCounts} />
                   </>
                )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default card style
  return (
    <Link href={`/figures/${figure.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50">
        <div className="p-0 relative w-full aspect-[3/4]">
          {correctedPhotoUrl ? (
            <Image
              src={correctedPhotoUrl}
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
        </div>
        <CardContent className="p-4 flex-grow flex flex-col">
           <h3 className="text-lg font-headline mb-1 group-hover:text-primary flex-grow">{figure.name}</h3>
           <StarRating ratingCounts={figure.ratingCounts} />
           {figure.category && (
            <div className="flex items-center gap-1.5 text-sm mt-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">{figure.category}</span>
            </div>
           )}
        </CardContent>
      </Card>
    </Link>
  );
}
