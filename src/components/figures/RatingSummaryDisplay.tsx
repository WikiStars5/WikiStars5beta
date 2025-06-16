
"use client";

import type { Figure } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingSummaryDisplayProps {
  averageRating?: number;
  totalRatings?: number;
  ratingDistribution?: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  figureName: string;
}

const STAR_LEVELS = ['5', '4', '3', '2', '1'] as const;

export function RatingSummaryDisplay({
  averageRating = 0,
  totalRatings = 0,
  ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  figureName,
}: RatingSummaryDisplayProps) {

  const formattedAverage = averageRating.toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calificaciones de {figureName}</CardTitle>
        <CardDescription>Resumen de cómo los usuarios han calificado a esta figura.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalRatings > 0 ? (
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Left Side: Average Rating */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-1/3">
              <p className="text-6xl font-bold text-foreground">{formattedAverage}</p>
              <div className="flex my-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={cn(
                      i < Math.round(averageRating) ? "text-primary fill-primary" : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{totalRatings.toLocaleString()} calificaciones</p>
            </div>

            {/* Right Side: Rating Distribution Bars */}
            <div className="w-full sm:w-2/3 space-y-1.5">
              {STAR_LEVELS.map((star) => {
                const count = ratingDistribution[star] || 0;
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-6 text-right">{star}</span>
                    <Star size={14} className="text-primary fill-primary" />
                    <Progress value={percentage} className="h-2 flex-grow" aria-label={`${count} calificaciones de ${star} estrellas, ${percentage.toFixed(0)}%`} />
                    <span className="text-xs text-muted-foreground w-10 text-right">{count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aún no hay calificaciones para {figureName}.</p>
            <p className="text-sm text-muted-foreground">¡Sé el primero en calificar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
