
"use client";

import type { StarValue, StarValueAsString } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StarRating } from "@/components/shared/StarRating";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface RatingSummaryDisplayProps {
  starRatingCounts?: Record<StarValueAsString, number>;
  figureName: string;
  totalReviews?: number;
  averageRating?: number;
}

const defaultCounts: Record<StarValueAsString, number> = {
  "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
};

export function RatingSummaryDisplay({ 
  starRatingCounts, 
  figureName,
  totalReviews = 0,
  averageRating = 0
}: RatingSummaryDisplayProps) {
  const counts = starRatingCounts && Object.keys(starRatingCounts).length > 0 ? starRatingCounts : defaultCounts;
  const starLevels: StarValue[] = [5, 4, 3, 2, 1];

  return (
    <Card className="mb-6 border border-white/20 bg-black">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Calificación General de {figureName}</CardTitle>
        {totalReviews === 0 && <CardDescription>Aún no hay calificaciones para esta figura.</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {totalReviews > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center sm:items-start">
              <p className="text-5xl font-bold text-primary">{averageRating.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
              <StarRating rating={averageRating} size={24} readOnly />
              <p className="text-sm text-muted-foreground mt-1">{totalReviews} {totalReviews === 1 ? 'calificación' : 'calificaciones'}</p>
            </div>

            <div className="w-full flex-1 space-y-2">
              {starLevels.map((level) => {
                const countForLevel = counts[level.toString() as StarValueAsString] || 0;
                const percentage = totalReviews > 0 ? (countForLevel / totalReviews) * 100 : 0;
                return (
                  <div key={level} className="flex items-center gap-2">
                    <div className="flex items-center text-xs text-muted-foreground w-16">
                      <span className="mr-1">{level}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    </div>
                    <Progress value={percentage} className="w-full h-2 bg-muted [&>div]:bg-yellow-400" aria-label={`${percentage.toFixed(0)}% para ${level} estrellas`} />
                    <span className="text-xs text-muted-foreground w-8 text-right">{countForLevel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
           <p className="text-center text-muted-foreground py-4">Sé el primero en calificar a esta figura dejando un comentario.</p>
        )}
      </CardContent>
    </Card>
  );
}
