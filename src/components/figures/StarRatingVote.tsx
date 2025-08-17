
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Figure, UserStarRating, StarValue, StarValueAsString } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, runTransaction, onSnapshot, setDoc, deleteDoc, serverTimestamp, type Unsubscribe } from 'firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Star, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { grantEstrellaBrillanteAchievement } from '@/app/actions/achievementActions';
import { useAuth } from '@/hooks/useAuth';


interface StarRatingVoteProps {
  figureId: string;
  figureName: string;
  initialStarRatingCounts?: Record<StarValueAsString, number>;
}

const STAR_OPTIONS_CONFIG: { key: StarValue; label: string; colorClass: string }[] = [
  { key: 1, label: '1 Estrella', colorClass: 'hover:bg-red-400/20 border-red-500 text-red-600 dark:text-red-400 dark:border-red-600' },
  { key: 2, label: '2 Estrellas', colorClass: 'hover:bg-orange-400/20 border-orange-500 text-orange-600 dark:text-orange-400 dark:border-orange-600' },
  { key: 3, label: '3 Estrellas', colorClass: 'hover:bg-yellow-400/20 border-yellow-500 text-yellow-600 dark:text-yellow-400 dark:border-yellow-600' },
  { key: 4, label: '4 Estrellas', colorClass: 'hover:bg-lime-400/20 border-lime-500 text-lime-600 dark:text-lime-400 dark:border-lime-600' },
  { key: 5, label: '5 Estrellas', colorClass: 'hover:bg-green-400/20 border-green-500 text-green-600 dark:text-green-400 dark:border-green-600' },
];

const defaultStarRatingCountsData: Record<StarValueAsString, number> = {
  "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
};

const STAR_SOUND_URLS: Record<StarValue, string> = {
  1: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar1.mp3?alt=media&token=a11df570-a6ee-4828-b5a9-81ccbb2c0457",
  2: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar2.mp3?alt=media&token=58cbf607-df0b-4bbd-b28e-291cf1951c18",
  3: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar3.mp3?alt=media&token=df67dc5b-28ab-4773-8266-60b9127a325f",
  4: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar4.mp3?alt=media&token=40c72095-e6a0-42d6-a3f6-86a81c356826",
  5: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar5.mp3?alt=media&token=8705fce9-1baa-4f49-8783-7bfc9d35a80f",
};


export const StarRatingVote: React.FC<StarRatingVoteProps> = ({ figureId, figureName, initialStarRatingCounts }) => {
  const { firebaseUser: currentUser, isAnonymous } = useAuth();
  const [selectedStarRating, setSelectedStarRating] = useState<StarValue | null>(null);
  const [figureStarRatingCounts, setFigureStarRatingCounts] = useState<Record<StarValueAsString, number>>(initialStarRatingCounts || defaultStarRatingCountsData);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoadingStarAction, setIsLoadingStarAction] = useState<StarValue | null>(null);
  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const { toast } = useToast();
  
  const [starAudios, setStarAudios] = useState<Partial<Record<StarValue, HTMLAudioElement>>>({});

  // NEW LOGIC: Only anonymous (guest) users can vote with stars.
  const canUserVote = !!currentUser && isAnonymous;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const audios: Partial<Record<StarValue, HTMLAudioElement>> = {};
      (Object.keys(STAR_SOUND_URLS) as unknown as StarValue[]).forEach(key => {
        const numericKey = Number(key) as StarValue;
        if (STAR_SOUND_URLS[numericKey]) {
          const audio = new Audio(STAR_SOUND_URLS[numericKey]);
          audio.preload = "auto";
          audios[numericKey] = audio;
        }
      });
      setStarAudios(audios);
    }
  }, []);

  const playSoundEffect = useCallback((starValue: StarValue) => {
    const audio = starAudios[starValue];
    if (audio) {
      audio.currentTime = 0; 
      audio.play().catch(error => console.error(`Error playing sound for star ${starValue}:`, error));
    } else {
      console.warn(`Audio for star ${starValue} not loaded.`);
    }
  }, [starAudios]);


  useEffect(() => {
    if (!figureId) {
      setIsComponentLoading(false);
      return;
    }
    
    if (currentUser) {
        try {
            const localRatingsJSON = localStorage.getItem('wikistars5-userStarRatings');
            if (localRatingsJSON) {
                const localRatings: UserStarRating[] = JSON.parse(localRatingsJSON);
                const currentVote = localRatings.find(r => r.figureId === figureId);
                if (currentVote) {
                    setSelectedStarRating(currentVote.starValue);
                }
            }
        } catch(e) { console.error("Failed to read star ratings from localStorage", e); }
    }


    const figureDocRef = doc(db, "figures", figureId);
    const unsubscribeFigure = onSnapshot(figureDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Figure;
        const counts = data.starRatingCounts || defaultStarRatingCountsData;
        setFigureStarRatingCounts(counts);
        setTotalVotes(Object.values(counts).reduce((sum, count) => sum + count, 0));
      }
    });

    let unsubscribeUserStarRating: Unsubscribe | undefined;
    if (currentUser && figureId) {
      const userStarRatingDocId = `${currentUser.uid}_${figureId}`;
      const userStarRatingDocRef = doc(db, "userStarRatings", userStarRatingDocId);

      unsubscribeUserStarRating = onSnapshot(userStarRatingDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userStarRatingData = docSnap.data() as UserStarRating;
          setSelectedStarRating(userStarRatingData.starValue);
        } else {
          setSelectedStarRating(null);
        }
        setIsComponentLoading(false);
      });
    } else {
      setSelectedStarRating(null);
      setIsComponentLoading(false);
    }

    return () => {
      unsubscribeFigure();
      if (unsubscribeUserStarRating) unsubscribeUserStarRating();
    };
  }, [figureId, currentUser]);

  const handleStarRatingClick = async (starValueClicked: StarValue) => {
    if (!currentUser) {
      toast({ title: "Acción Requerida", description: "Debes estar conectado para calificar.", variant: "default" });
      return;
    }
    if (!canUserVote) {
       toast({ title: "Acción no permitida", description: "Solo los usuarios invitados pueden calificar con estrellas.", variant: "destructive" });
       return;
    }
    if (isLoadingStarAction) return;
    
    playSoundEffect(starValueClicked);
    setIsLoadingStarAction(starValueClicked);

    const figureDocRef = doc(db, "figures", figureId);
    const userStarRatingDocId = `${currentUser.uid}_${figureId}`;
    const userStarRatingDocRef = doc(db, "userStarRatings", userStarRatingDocId);

    const previousSelectedUserRating = selectedStarRating;
    const newStarValueToSetForUser = previousSelectedUserRating === starValueClicked ? null : starValueClicked;
    setSelectedStarRating(newStarValueToSetForUser);

    try {
        const localRatingsJSON = localStorage.getItem('wikistars5-userStarRatings');
        let localRatings: UserStarRating[] = localRatingsJSON ? JSON.parse(localRatingsJSON) : [];
        localRatings = localRatings.filter(r => r.figureId !== figureId);
        if (newStarValueToSetForUser) {
            localRatings.push({ userId: currentUser.uid, figureId, starValue: newStarValueToSetForUser, timestamp: new Date() as any });
        }
        localStorage.setItem('wikistars5-userStarRatings', JSON.stringify(localRatings));

      if (newStarValueToSetForUser) {
        await setDoc(userStarRatingDocRef, {
          userId: currentUser.uid,
          figureId: figureId,
          starValue: newStarValueToSetForUser,
          timestamp: serverTimestamp(),
        });
        toast({ title: "Calificación Guardada", description: `Has calificado a ${figureName} con ${newStarValueToSetForUser} estrella(s).` });
        if (isAnonymous) {
          const achResult = await grantEstrellaBrillanteAchievement(currentUser.uid);
          if (achResult.unlocked) toast({ title: "¡Logro Desbloqueado!", description: achResult.message });
        }
      } else {
        await deleteDoc(userStarRatingDocRef);
        toast({ title: "Calificación Eliminada", description: `Has eliminado tu calificación para ${figureName}.` });
      }

    } catch (error: any) {
      console.error("Error rating figure:", error);
      let errorMessage = "No se pudo registrar tu calificación.";
       if (error.code === 'permission-denied') {
        errorMessage = "Error de permisos. Revisa las reglas de seguridad de Firestore para 'userStarRatings'.";
      }
      toast({ title: "Error al Calificar", description: errorMessage, variant: "destructive" });
      setSelectedStarRating(previousSelectedUserRating); 

    } finally {
      setIsLoadingStarAction(null);
    }
  };

  const renderStars = (count: StarValue) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={cn("h-4 w-4", i < count ? "fill-current text-yellow-400" : "text-yellow-400/50")} />
    ));
  };


  if (isComponentLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Califica a {figureName}</CardTitle>
          <CardDescription>Cargando opciones de calificación...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Califica a {figureName}</CardTitle>
        <CardDescription>
          {isAnonymous ? "Selecciona una calificación de estrellas." : "La calificación por estrellas es solo para invitados."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentUser && (
          <Alert variant="default" className="mb-4">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Participación</AlertTitle>
            <AlertDescription>
              Conéctate como invitado para poder calificar.
            </AlertDescription>
          </Alert>
        )}
         {currentUser && !isAnonymous && (
          <Alert variant="default" className="mb-4">
            <UserCheck className="h-4 w-4" />
            <AlertTitle>Función solo para invitados</AlertTitle>
            <AlertDescription>
              Como usuario registrado, tu voz es importante en los comentarios y otras encuestas. ¡La calificación por estrellas está reservada para los invitados!
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAR_OPTIONS_CONFIG.map(({ key, label, colorClass }) => (
            <Button
              key={key}
              variant={selectedStarRating === key ? "default" : "outline"}
              className={`flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 
                ${selectedStarRating === key ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 dark:ring-offset-card' : `text-foreground ${colorClass}`}
                ${isLoadingStarAction === key ? 'opacity-50 cursor-not-allowed' : ''}
                ${!canUserVote ? 'cursor-not-allowed opacity-60' : ''}
              `}
              onClick={() => handleStarRatingClick(key)}
              disabled={!canUserVote || !!isLoadingStarAction}
              style={{ minHeight: '100px' }}
            >
              <div className="flex" aria-label={label}>{renderStars(key)}</div>
              <span className="text-xs font-medium">{label}</span>
              <span className="text-sm font-bold">
                {figureStarRatingCounts[key.toString() as StarValueAsString] || 0}
              </span>
              {isLoadingStarAction === key && <Loader2 className="absolute h-5 w-5 animate-spin" />}
            </Button>
          ))}
        </div>
        <div className="text-center text-muted-foreground">
          <p>Total de calificaciones: <span className="font-bold">{totalVotes}</span></p>
        </div>
      </CardContent>
    </Card>
  );
};
