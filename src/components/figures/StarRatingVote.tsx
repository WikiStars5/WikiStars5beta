
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Figure, RatingValue, RatingVote } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, StarOff } from 'lucide-react';
import { submitStarRating } from '@/lib/placeholder-data';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface StarRatingVoteProps {
  figure: Figure;
}

const defaultRatingCountsData: Record<string, number> = {
  "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
};

const RatingDisplay = ({ rating, maxRating = 5 }: { rating: number, maxRating?: number }) => {
    const fullStars = Math.floor(rating);
    const emptyStars = maxRating - fullStars;

    return (
        <div className="flex items-center gap-0.5">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="w-5 h-5 text-primary fill-current" />)}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="w-5 h-5 text-muted-foreground/30" />)}
        </div>
    );
};

const StarRatingInput = ({ value, onChange, disabled }: { value: RatingValue | null, onChange: (value: RatingValue) => void, disabled: boolean }) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  return (
    <div className="flex items-center gap-2">
      <button type="button" key={0} onClick={() => onChange(0)} onMouseEnter={() => setHoverRating(0)} onMouseLeave={() => setHoverRating(null)} className="focus:outline-none" disabled={disabled} aria-label="Calificar con 0 estrellas">
        <StarOff className={cn("h-7 w-7 transition-colors", (hoverRating === 0 || value === 0) ? "text-destructive" : "text-muted-foreground/30")} />
      </button>
      {[...Array(5)].map((_, i) => {
        const ratingValue = (i + 1) as RatingValue;
        return (
          <button type="button" key={ratingValue} onClick={() => onChange(ratingValue)} onMouseEnter={() => setHoverRating(ratingValue)} onMouseLeave={() => setHoverRating(null)} className="focus:outline-none" disabled={disabled} aria-label={`Calificar con ${ratingValue} estrellas`}>
            <Star className={cn("h-7 w-7 transition-colors", (hoverRating ?? value ?? -1) >= ratingValue ? "text-primary fill-current" : "text-muted-foreground/30")} />
          </button>
        );
      })}
    </div>
  );
};

export const StarRatingVote: React.FC<StarRatingVoteProps> = ({ figure }) => {
  const { currentUser, firebaseUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [ratingCounts, setRatingCounts] = useState<Record<string, number>>(figure.ratingCounts || defaultRatingCountsData);
  const [userRating, setUserRating] = useState<RatingValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRatings: RatingVote[] = JSON.parse(localStorage.getItem('wikistars5-userRatings') || '[]');
      const vote = storedRatings.find(r => r.figureId === figure.id);
      if (vote) {
        setUserRating(vote.rating);
      }
    }
  }, [figure.id]);
  
  const { totalVotes, averageRating } = useMemo(() => {
    if (!ratingCounts) return { totalVotes: 0, averageRating: 0 };
    const total = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
    const votesForAverage = Object.entries(ratingCounts).filter(([key]) => key !== "0").reduce((acc, [, count]) => acc + count, 0);
    if (votesForAverage === 0) {
      return { totalVotes: total, averageRating: 0 };
    }
    const weightedSum = Object.entries(ratingCounts).filter(([key]) => key !== "0").reduce((sum, [rating, count]) => sum + parseInt(rating) * count, 0);
    return { totalVotes: total, averageRating: weightedSum / votesForAverage };
  }, [ratingCounts]);

  useEffect(() => {
    if (!figure.id) return;
    const figureDocRef = doc(db, "figures", figure.id);
    const unsubscribeFigure = onSnapshot(figureDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Figure;
        setRatingCounts(data.ratingCounts || defaultRatingCountsData);
      }
    }, (error) => console.error("Error listening to figure document for ratings:", error));
    
    return () => unsubscribeFigure();
  }, [figure.id]);

  const handleRatingChange = async (newRating: RatingValue) => {
    const userId = firebaseUser?.uid || localStorage.getItem('wikistars5-guestId');
    if (!userId) {
      toast({ title: "Error", description: "No se pudo identificar al usuario.", variant: "destructive" });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await submitStarRating(figure.id, userId, newRating);
      setUserRating(newRating);
      toast({ title: "¡Gracias por tu calificación!", description: `Has calificado a ${figure.name} con ${newRating} ${newRating === 1 ? 'estrella' : 'estrellas'}.` });
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      toast({ title: "Error", description: "No se pudo guardar tu calificación. " + error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Calificaciones de la Comunidad</CardTitle>
        <CardDescription>Califica a {figure.name} para que tu opinión cuente en el promedio general. Solo tu última calificación es válida.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
         <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg bg-muted/30">
            <div className="flex flex-col items-center justify-center">
                <p className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</p>
                <RatingDisplay rating={averageRating} />
                <p className="text-sm text-muted-foreground mt-1">{totalVotes.toLocaleString()} {totalVotes === 1 ? 'calificación' : 'calificaciones'}</p>
            </div>
            <div className="w-full flex-grow space-y-1.5">
                {[5, 4, 3, 2, 1, 0].map(star => {
                    const count = ratingCounts[star] || 0;
                    const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                    return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                            <span className="flex-shrink-0 w-16 text-right text-muted-foreground flex items-center justify-end gap-1">
                                {star} <Star className="inline h-3 w-3 mb-0.5" />
                            </span>
                            <Progress value={percentage} className="h-2 w-full" />
                            <span className="flex-shrink-0 w-24 text-right font-mono text-muted-foreground">{count.toLocaleString()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 pt-4 border-t border-dashed">
            <h3 className="text-lg font-medium">Tu Calificación</h3>
            <StarRatingInput value={userRating} onChange={handleRatingChange} disabled={isSubmitting || isAuthLoading} />
             {isSubmitting && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</div>}
             {userRating !== null && !isSubmitting && <p className="text-xs text-muted-foreground">Gracias. Puedes cambiar tu calificación en cualquier momento.</p>}
        </div>
      </CardContent>
    </Card>
  );
};
