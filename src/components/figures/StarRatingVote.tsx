

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

export const StarRatingVote: React.FC<StarRatingVoteProps> = ({ figure }) => {
  const { currentUser, firebaseUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [ratingCounts, setRatingCounts] = useState<Record<string, number>>(figure.ratingCounts || defaultRatingCountsData);
  const [userRating, setUserRating] = useState<RatingValue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseUser) {
      const storedRatings: RatingVote[] = JSON.parse(localStorage.getItem(`wikistars5-ratings-${firebaseUser.uid}`) || '[]');
      const vote = storedRatings.find(r => r.figureId === figure.id);
      if (vote) {
        setUserRating(vote.rating);
      }
    }
  }, [figure.id, firebaseUser]);
  
  const { totalVotes, averageRating } = useMemo(() => {
    if (!ratingCounts) return { totalVotes: 0, averageRating: 0 };
    
    // Contar el número total de votos (incluyendo los de 0 estrellas)
    const total = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return { totalVotes: 0, averageRating: 0 };
    }

    // Calcular la suma ponderada (los votos de 0 no suman nada, lo cual es correcto)
    const weightedSum = Object.entries(ratingCounts)
        .reduce((sum, [rating, count]) => sum + parseInt(rating) * count, 0);
    
    // El promedio se calcula sobre el total de votos.
    return { totalVotes: total, averageRating: weightedSum / total };
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


  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Calificaciones de la Comunidad</CardTitle>
        <CardDescription>Resumen de las calificaciones que los usuarios han dado al dejar una opinión sobre {figure.name}.</CardDescription>
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
         {userRating !== null && (
            <div className="text-center p-3 rounded-md bg-primary/10 border border-primary/30">
                <p className="text-sm text-primary-foreground">Tu calificación:</p>
                <RatingDisplay rating={userRating} />
            </div>
        )}
      </CardContent>
    </Card>
  );
};
