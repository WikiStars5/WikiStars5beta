
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Figure, UserStarRating, StarValue, StarValueAsString } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, runTransaction, onSnapshot, setDoc, deleteDoc, serverTimestamp, type Unsubscribe } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StarRatingVoteProps {
  figureId: string;
  figureName: string;
  initialStarRatingCounts?: Record<StarValueAsString, number>;
  currentUser: User | null;
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

export const StarRatingVote: React.FC<StarRatingVoteProps> = ({ figureId, figureName, initialStarRatingCounts, currentUser }) => {
  const [selectedStarRating, setSelectedStarRating] = useState<StarValue | null>(null);
  const [figureStarRatingCounts, setFigureStarRatingCounts] = useState<Record<StarValueAsString, number>>(initialStarRatingCounts || defaultStarRatingCountsData);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoadingStarAction, setIsLoadingStarAction] = useState<StarValue | null>(null);
  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const { toast } = useToast();

  const canUserVote = !!currentUser && !currentUser.isAnonymous;

  useEffect(() => {
    if (!figureId) {
      setIsComponentLoading(false);
      return;
    }
    setIsComponentLoading(true);

    const figureDocRef = doc(db, "figures", figureId);
    const unsubscribeFigure = onSnapshot(figureDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Figure;
        const counts = data.starRatingCounts || defaultStarRatingCountsData;
        setFigureStarRatingCounts(counts);
        setTotalVotes(Object.values(counts).reduce((sum, count) => sum + count, 0));
      } else {
        setFigureStarRatingCounts(defaultStarRatingCountsData);
        setTotalVotes(0);
        console.warn(`Figure document with ID ${figureId} does not exist for star ratings.`);
      }
    }, (error) => {
      console.error("Error fetching figure star rating counts:", error);
      toast({ title: "Error", description: "No se pudieron cargar los conteos de estrellas.", variant: "destructive" });
      setFigureStarRatingCounts(defaultStarRatingCountsData);
      setTotalVotes(0);
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
      }, (error) => {
        console.error("Error fetching user's star rating:", error);
        setSelectedStarRating(null);
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
  }, [figureId, currentUser, toast]);

  const handleStarRatingClick = async (starValueClicked: StarValue) => {
    if (!canUserVote) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión con una cuenta para calificar.", variant: "default" });
      return;
    }
    if (isLoadingStarAction) return;
    if (!currentUser) return; 

    setIsLoadingStarAction(starValueClicked);

    const figureDocRef = doc(db, "figures", figureId);
    const userStarRatingDocId = `${currentUser.uid}_${figureId}`;
    const userStarRatingDocRef = doc(db, "userStarRatings", userStarRatingDocId);

    const previousSelectedUserRating = selectedStarRating; // Capture state before any async operation
    const newStarValueToSetForUser = previousSelectedUserRating === starValueClicked ? null : starValueClicked;

    try {
      await runTransaction(db, async (transaction) => {
        const figureDoc = await transaction.get(figureDocRef);
        if (!figureDoc.exists()) {
          throw new Error("Documento de figura no existe!");
        }

        const currentFigureData = figureDoc.data();
        const currentCounts = (currentFigureData?.starRatingCounts || { ...defaultStarRatingCountsData }) as Record<StarValueAsString, number>;
        const newCounts = { ...currentCounts };

        if (previousSelectedUserRating) {
          const prevKey = previousSelectedUserRating.toString() as StarValueAsString;
          newCounts[prevKey] = Math.max(0, (newCounts[prevKey] || 0) - 1);
        }

        if (newStarValueToSetForUser) {
          const newKey = newStarValueToSetForUser.toString() as StarValueAsString;
          newCounts[newKey] = (newCounts[newKey] || 0) + 1;
        }
        
        transaction.update(figureDocRef, { starRatingCounts: newCounts });
      });

      if (newStarValueToSetForUser) {
        await setDoc(userStarRatingDocRef, {
          userId: currentUser.uid,
          figureId: figureId,
          starValue: newStarValueToSetForUser,
          timestamp: serverTimestamp(),
        });
        setSelectedStarRating(newStarValueToSetForUser); // Explicitly update local state
        toast({ title: "Calificación Guardada", description: `Has calificado a ${figureName} con ${newStarValueToSetForUser} estrella(s).` });
      } else {
        await deleteDoc(userStarRatingDocRef);
        setSelectedStarRating(null); // Explicitly update local state
        toast({ title: "Calificación Eliminada", description: `Has eliminado tu calificación para ${figureName}.` });
      }

    } catch (error: any) {
      console.error("Error rating figure:", error);
      let errorMessage = "No se pudo registrar tu calificación.";
      if (error.message && (error.message.includes("PERMISSION_DENIED") || error.message.includes("Missing or insufficient permissions"))) {
        errorMessage = "Error de permisos. Verifica las reglas de Firestore.";
      } else if (error.message) {
        errorMessage = `Detalles: ${error.message}`;
      }
      toast({ title: "Error al Calificar", description: errorMessage, variant: "destructive" });
       // Revert optimistic local state update if Firestore operation failed
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
          {canUserVote
            ? "Selecciona una calificación de estrellas."
            : "Debes iniciar sesión con una cuenta para poder calificar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canUserVote && (
          <Alert variant="default" className="mb-4">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Participación Restringida</AlertTitle>
            <AlertDescription>
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión con una cuenta
              </Link>
              {" "}para calificar a esta figura.
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
