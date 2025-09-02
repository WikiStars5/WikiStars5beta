
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Figure, RatingValue, RatingVote } from '@/lib/types';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signInAnonymously } from 'firebase/auth';
import { submitStarRating } from '@/lib/placeholder-data';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ShareButton } from '../shared/ShareButton';

interface StarRatingVoteProps {
  figure: Figure;
}

const defaultRatingCountsData: Record<string, number> = {
  "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
};

const RatingDisplay = ({ rating, maxRating = 5 }: { rating: number, maxRating?: number }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="flex items-center">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="w-5 h-5 text-primary fill-current" />)}
            {halfStar && <Star key="half" className="w-5 h-5 text-primary" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="w-5 h-5 text-primary" />)}
        </div>
    );
};

export const StarRatingVote: React.FC<StarRatingVoteProps> = ({ figure }) => {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const [ratingCounts, setRatingCounts] = useState<Record<string, number>>(figure.ratingCounts || defaultRatingCountsData);
  
  const { totalVotes, averageRating } = useMemo(() => {
    const votes = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
    if (votes === 0) return { totalVotes: 0, averageRating: 0 };
    const weightedSum = Object.entries(ratingCounts).reduce((sum, [rating, count]) => sum + parseInt(rating) * count, 0);
    return { totalVotes: votes, averageRating: weightedSum / votes };
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
  }, [figure.id, firebaseUser]);


  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Calificaciones de la Comunidad</CardTitle>
        <CardDescription>Resumen de las calificaciones para {figure.name}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {isAuthLoading ? (
            <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ): (
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
                        <span className="flex-shrink-0 w-12 text-right text-muted-foreground">{star} <Star className="inline h-3 w-3 mb-0.5" /></span>
                        <Progress value={percentage} className="h-2 w-full" />
                        <span className="flex-shrink-0 w-24 text-right font-mono text-muted-foreground">{count.toLocaleString()}</span>
                        </div>
                    );
                    })}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
