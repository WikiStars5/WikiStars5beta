
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Figure, UserAttitude, AttitudeKey, Attitude } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, runTransaction, onSnapshot, setDoc, deleteDoc, serverTimestamp, type Unsubscribe, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { ShareButton } from '../shared/ShareButton';
import { cn } from '@/lib/utils';
import { grantActitudDefinidaAchievement } from '@/app/actions/achievementActions';

interface AttitudeVoteProps {
  figureId: string;
  figureName: string;
  initialAttitudeCounts?: Record<AttitudeKey, number>;
  currentUser: User | null;
}

const ATTITUDE_OPTIONS_CONFIG: {
  key: AttitudeKey;
  label: string;
  emoji: string;
  colorClass: string;
  selectedClass: string;
}[] = [
  { key: 'neutral', label: 'Neutral', emoji: '😐', colorClass: 'border-muted-foreground/50 text-muted-foreground hover:bg-muted-foreground/10 hover:border-muted-foreground', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-muted-foreground border-muted-foreground' },
  { key: 'fan', label: 'Fan', emoji: '😍', colorClass: 'border-primary/50 text-primary hover:bg-primary/10 hover:border-primary', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-primary border-primary' },
  { key: 'simp', label: 'Simp', emoji: '🥰', colorClass: 'border-[#FF4081]/50 text-[#FF4081] hover:bg-[#FF4081]/10 hover:border-[#FF4081]', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-[#FF4081] border-[#FF4081]' },
  { key: 'hater', label: 'Hater', emoji: '😡', colorClass: 'border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-destructive border-destructive' },
];


const defaultAttitudeCountsData: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

export const AttitudeVote: React.FC<AttitudeVoteProps> = ({ figureId, figureName, initialAttitudeCounts, currentUser }) => {
  const [selectedAttitude, setSelectedAttitude] = useState<AttitudeKey | null>(null);
  const [figureAttitudeCounts, setFigureAttitudeCounts] = useState<Record<AttitudeKey, number>>(initialAttitudeCounts || defaultAttitudeCountsData);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoadingAttitudeAction, setIsLoadingAttitudeAction] = useState<AttitudeKey | null>(null);
  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const { toast } = useToast();

  const canUserVote = !!currentUser;

  useEffect(() => {
    if (!figureId) {
      setIsComponentLoading(false);
      return;
    }
    
    if (currentUser) {
        try {
            const localAttitudesJSON = localStorage.getItem('wikistars5-userAttitudes');
            if (localAttitudesJSON) {
                const localAttitudes: Attitude[] = JSON.parse(localAttitudesJSON);
                const currentVote = localAttitudes.find(a => a.figureId === figureId);
                if (currentVote) {
                    setSelectedAttitude(currentVote.attitude);
                }
            }
        } catch (e) { console.error("Failed to read attitudes from localStorage", e); }
    }


    const figureDocRef = doc(db, "figures", figureId);
    const unsubscribeFigure = onSnapshot(figureDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Figure;
        const counts = data.attitudeCounts || defaultAttitudeCountsData;
        setFigureAttitudeCounts(counts);
        setTotalVotes(Object.values(counts).reduce((sum, count) => sum + count, 0));
      }
      if (isComponentLoading) setIsComponentLoading(false);
    }, (error) => {
      console.error("Error listening to figure document for attitudes:", error);
      if (isComponentLoading) setIsComponentLoading(false);
    });

    if (currentUser) {
        getDoc(doc(db, 'userAttitudes', `${currentUser.uid}_${figureId}`))
            .then(docSnap => {
                if (docSnap.exists()) {
                    setSelectedAttitude(docSnap.data().attitude as AttitudeKey);
                }
            })
            .catch(error => {
                 console.warn("Permission denied fetching user attitude. This is expected for guests and will rely on localStorage.", error);
            });
    } else {
        setSelectedAttitude(null);
    }
    
    return () => {
      unsubscribeFigure();
    };
  }, [figureId, currentUser, isComponentLoading]);

  const handleAttitudeClick = async (attitudeKeyClicked: AttitudeKey) => {
    if (!canUserVote || !currentUser) {
      toast({ title: "Acción Requerida", description: "Inicia sesión o continúa como invitado para votar." });
      return;
    }
    if (isLoadingAttitudeAction) return;

    setIsLoadingAttitudeAction(attitudeKeyClicked);

    const previousSelectedAttitude = selectedAttitude;
    const newAttitudeToSet = previousSelectedAttitude === attitudeKeyClicked ? null : attitudeKeyClicked;
    
    // Optimistic UI Update
    setSelectedAttitude(newAttitudeToSet);
    setFigureAttitudeCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        if (previousSelectedAttitude) {
            newCounts[previousSelectedAttitude] = Math.max(0, (newCounts[previousSelectedAttitude] || 0) - 1);
        }
        if (newAttitudeToSet) {
            newCounts[newAttitudeToSet] = (newCounts[newAttitudeToSet] || 0) + 1;
        }
        setTotalVotes(Object.values(newCounts).reduce((sum, count) => sum + count, 0));
        return newCounts;
    });

    const userVoteDocRef = doc(db, 'userAttitudes', `${currentUser.uid}_${figureId}`);

    try {
        const localAttitudesJSON = localStorage.getItem('wikistars5-userAttitudes');
        let localAttitudes: Attitude[] = localAttitudesJSON ? JSON.parse(localAttitudesJSON) : [];
        localAttitudes = localAttitudes.filter(a => a.figureId !== figureId); 
        if (newAttitudeToSet) {
            localAttitudes.push({ figureId, attitude: newAttitudeToSet, addedAt: new Date().toISOString() });
        }
        localStorage.setItem('wikistars5-userAttitudes', JSON.stringify(localAttitudes));

        if (newAttitudeToSet) {
            await setDoc(userVoteDocRef, {
                userId: currentUser.uid,
                figureId: figureId,
                attitude: newAttitudeToSet,
                timestamp: serverTimestamp(),
            });
        } else {
            await deleteDoc(userVoteDocRef);
        }
      
        if (!currentUser.isAnonymous && newAttitudeToSet) {
            const achievementResult = await grantActitudDefinidaAchievement(currentUser.uid);
            if (achievementResult.unlocked) {
                toast({ title: "¡Logro Desbloqueado!", description: achievementResult.message });
            }
        }
        
        if (newAttitudeToSet) {
            toast({
                title: "¡Voto Registrado!",
                description: "¡Gracias por tu voto! Compártelo para ver qué opinan los demás.",
                duration: 8000,
                action: <ShareButton figureName={figureName} figureId={figureId} showText />,
            });
        } else {
            toast({ title: "Voto Eliminado", description: "Tu actitud ha sido eliminada." });
        }

    } catch (error: any) {
        console.error("Error updating Firestore attitude:", error);
        // Revert optimistic UI on error
        setSelectedAttitude(previousSelectedAttitude);
        setFigureAttitudeCounts(prevCounts => {
            const revertedCounts = { ...prevCounts };
            if (newAttitudeToSet) {
                revertedCounts[newAttitudeToSet] = Math.max(0, (revertedCounts[newAttitudeToSet] || 0) - 1);
            }
            if (previousSelectedAttitude) {
                revertedCounts[previousSelectedAttitude] = (revertedCounts[previousSelectedAttitude] || 0) + 1;
            }
            setTotalVotes(Object.values(revertedCounts).reduce((sum, count) => sum + count, 0));
            return revertedCounts;
        });
        toast({ title: "Error de Sincronización", description: "Tu voto no se pudo registrar en el servidor. Intenta de nuevo.", variant: "destructive" });
    } finally {
        setIsLoadingAttitudeAction(null);
    }
  };
  
  if (isComponentLoading) { 
    return (
      <Card className="border border-white/20 bg-black">
        <CardHeader>
          <CardTitle>¿Qué te consideras?</CardTitle>
          <CardDescription>Cargando opciones de actitud...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>¿Qué te consideras?</CardTitle>
        <CardDescription>
          {currentUser
            ? "Selecciona una opción para compartir tu postura."
            : "Inicia sesión o continúa como invitado para poder participar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentUser && (
          <Alert variant="default" className="mb-4">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Participación</AlertTitle>
            <AlertDescription>
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión
              </Link>
              {" "}o{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                regrístrate
              </Link>
              {" "}para participar o continúa como invitado (intentaremos conectarte).
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ATTITUDE_OPTIONS_CONFIG.map(({ key, label, emoji, colorClass, selectedClass }) => (
            <Button
              key={key}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 border bg-black",
                colorClass,
                selectedAttitude === key ? selectedClass : 'ring-0',
                isLoadingAttitudeAction === key && 'opacity-50 cursor-not-allowed',
                !canUserVote && 'cursor-not-allowed opacity-60'
              )}
              onClick={() => handleAttitudeClick(key)}
              disabled={!canUserVote || !!isLoadingAttitudeAction}
              style={{ minHeight: '100px' }}
            >
              <span className="text-3xl" role="img" aria-label={label}>{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
              <span className="text-sm font-bold">
                {figureAttitudeCounts[key] || 0}
              </span>
            </Button>
          ))}
        </div>
        <div className="text-center text-muted-foreground">
          <p>Total de respuestas: <span className="font-bold">{totalVotes}</span></p>
        </div>
      </CardContent>
    </Card>
  );
};
