
"use client";

import type { Figure, StarValueAsString } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { StarRating } from "@/components/shared/StarRating";

interface RatingSummaryDisplayProps {
  figure: Figure;
}

export function RatingSummaryDisplay({ figure }: RatingSummaryDisplayProps) {
  const { overallRating = 0, reviewCount = 0, ratingDistribution } = figure;

  if (reviewCount === 0) {
    return (
      <Card className="w-full border border-white/20 bg-black">
        <CardHeader>
          <CardTitle>Calificación General de {figure.name}</CardTitle>
          <CardDescription>Aún no hay calificaciones para esta figura.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const defaultDistribution: Record<StarValueAsString, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
  const counts = ratingDistribution || defaultDistribution;

  return (
    <Card className="w-full border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Calificación General de {figure.name}</CardTitle>
        <CardDescription>
          Basado en {reviewCount} reseña{reviewCount !== 1 ? 's' : ''}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p className="text-5xl font-bold font-headline text-primary">{overallRating.toFixed(1)}</p>
          <StarRating rating={overallRating} size={24} readOnly />
          <p className="text-sm text-muted-foreground">{reviewCount} reseña{reviewCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="w-full space-y-2">
          {(Object.keys(counts) as StarValueAsString[]).sort((a,b) => parseInt(b) - parseInt(a)).map((starLevel) => {
            const countForLevel = counts[starLevel] || 0;
            const percentage = reviewCount > 0 ? (countForLevel / reviewCount) * 100 : 0;
            return (
              <div key={starLevel} className="flex items-center gap-2 text-sm">
                <span className="font-medium w-4">{starLevel}</span>
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <Progress value={percentage} className="w-full h-2" aria-label={`${countForLevel} calificaciones de ${starLevel} estrellas`} />
                <span className="text-muted-foreground w-12 text-right">{countForLevel.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
