
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

const RATING_OPTIONS: {
  value: RatingValue;
  label: string;
  colorClass: string;
  selectedClass: string;
}[] = [
  { value: 0, label: '0 Estrellas', colorClass: 'border-gray-500/50 text-gray-500 hover:bg-gray-500/10 hover:border-gray-500', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-gray-500 border-gray-500' },
  { value: 1, label: '1 Estrella', colorClass: 'border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-destructive border-destructive' },
  { value: 2, label: '2 Estrellas', colorClass: 'border-orange-500/50 text-orange-500 hover:bg-orange-500/10 hover:border-orange-500', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-orange-500 border-orange-500' },
  { value: 3, label: '3 Estrellas', colorClass: 'border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-yellow-500 border-yellow-500' },
  { value: 4, label: '4 Estrellas', colorClass: 'border-lime-500/50 text-lime-500 hover:bg-lime-500/10 hover:border-lime-500', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-lime-500 border-lime-500' },
  { value: 5, label: '5 Estrellas', colorClass: 'border-green-500/50 text-green-500 hover:bg-green-500/10 hover:border-green-500', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-green-500 border-green-500' },
];

const RATING_SOUNDS: Record<string, string> = {
  "1": "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar1.mp3?alt=media&token=a11df570-a6ee-4828-b5a9-81ccbb2c0457",
  "2": "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar2.mp3?alt=media&token=58cbf607-df0b-4bbd-b28e-291cf1951c18",
  "3": "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar3.mp3?alt=media&token=df67dc5b-28ab-4773-8266-60b9127a325f",
  "4": "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar4.mp3?alt=media&token=40c72095-e6a0-42d6-a3f6-86a81c356826",
  "5": "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar5.mp3?alt=media&token=8705fce9-1baa-4f49-8783-7bfc9d35a80f",
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
  const [selectedRating, setSelectedRating] = useState<RatingValue | null>(null);
  const [ratingCounts, setRatingCounts] = useState<Record<string, number>>(figure.ratingCounts || defaultRatingCountsData);
  const [isLoading, setIsLoading] = useState<RatingValue | null>(null);
  const { toast } = useToast();
  const audioPlayers = useMemo(() => {
    if (typeof window === 'undefined') return {};
    return Object.keys(RATING_SOUNDS).reduce((acc, key) => {
        acc[key] = new Audio(RATING_SOUNDS[key]);
        acc[key].preload = 'auto';
        return acc;
    }, {} as Record<string, HTMLAudioElement>);
  }, []);

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

    if (firebaseUser) {
        const localKey = 'wikistars5-userRatings';
        try {
            const localData = localStorage.getItem(localKey);
            if (localData) {
                const ratings: RatingVote[] = JSON.parse(localData);
                const currentVote = ratings.find(r => r.figureId === figure.id);
                if (currentVote) setSelectedRating(currentVote.rating);
            }
        } catch (e) { console.error("Error reading ratings from localStorage", e); }
    } else {
        setSelectedRating(null);
    }
    
    return () => unsubscribeFigure();
  }, [figure.id, firebaseUser]);

  const handleRatingClick = async (ratingValue: RatingValue) => {
    if (isLoading !== null) return;
    setIsLoading(ratingValue);
    
    let currentFirebaseUser = firebaseUser;
    if (!currentFirebaseUser) {
        try {
            const userCredential = await signInAnonymously(auth);
            currentFirebaseUser = userCredential.user;
        } catch (error) {
            console.error("Error signing in anonymously:", error);
            toast({ title: "Error de Votación", description: "No se pudo registrar tu identidad para votar. Inténtalo de nuevo.", variant: "destructive" });
            setIsLoading(null);
            return;
        }
    }

    const newRating = selectedRating === ratingValue ? null : ratingValue;
    try {
        await submitStarRating(figure.id, currentFirebaseUser.uid, newRating);
        setSelectedRating(newRating);

        if (newRating !== null) {
            const sound = audioPlayers[newRating];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(err => console.error("Audio playback error:", err));
            }
            toast({ title: "¡Calificación Guardada!", description: `Has calificado a ${figure.name} con ${newRating} ${newRating === 1 ? 'estrella' : 'estrellas'}.`,
            action: <ShareButton figureName={figure.name} figureId={figure.id} showText />});
        } else {
            toast({ title: "Calificación Eliminada", description: "Tu calificación ha sido eliminada." });
        }
    } catch (error: any) {
        toast({ title: "Error al Votar", description: error.message || "No se pudo guardar tu calificación.", variant: "destructive" });
    } finally {
        setIsLoading(null);
    }
  };

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Calificaciones Generales</CardTitle>
        <CardDescription>Resumen de las calificaciones de la comunidad y tu propia valoración.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Summary Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg bg-muted/30">
          <div className="flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</p>
            <RatingDisplay rating={averageRating} />
            <p className="text-sm text-muted-foreground mt-1">{totalVotes} {totalVotes === 1 ? 'calificación' : 'calificaciones'}</p>
          </div>
          <div className="w-full flex-grow space-y-1.5">
            {[5, 4, 3, 2, 1, 0].map(star => {
              const count = ratingCounts[star] || 0;
              const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-right text-muted-foreground">{star} <Star className="inline h-3 w-3 mb-0.5" /></span>
                  <Progress value={percentage} className="h-2 w-full" />
                  <span className="w-8 text-left font-mono text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voting Section */}
        <div>
          <h3 className="font-semibold text-center mb-1">Califica a {figure.name}</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">Selecciona una calificación de estrellas.</p>
          {isAuthLoading ? (
             <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {RATING_OPTIONS.map(({ value, label, colorClass, selectedClass }) => (
                <Button
                  key={value}
                  variant="outline"
                  className={cn(
                    "flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 border bg-black",
                    colorClass,
                    selectedRating === value ? selectedClass : 'ring-0',
                    isLoading === value && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => handleRatingClick(value)}
                  disabled={isLoading !== null}
                >
                    {isLoading === value ? (
                        <Loader2 className="absolute h-6 w-6 animate-spin" />
                    ) : selectedRating === value ? (
                        <Check className="absolute top-2 right-2 h-4 w-4 text-white" />
                    ) : null}
                   <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < value ? 'fill-current' : 'fill-transparent stroke-current')} />
                        ))}
                    </div>
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-sm font-bold">{ratingCounts[value] || 0}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
