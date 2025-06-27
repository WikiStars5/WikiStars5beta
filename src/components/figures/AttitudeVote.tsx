
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Figure, UserAttitude, AttitudeKey, UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, runTransaction, onSnapshot, setDoc, deleteDoc, serverTimestamp, type Unsubscribe, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

interface AttitudeVoteProps {
  figureId: string;
  figureName: string;
  initialAttitudeCounts?: Record<AttitudeKey, number>;
  currentUser: User | null;
}

const ATTITUDE_OPTIONS_CONFIG: { key: AttitudeKey; label: string; emoji: string; colorClass: string }[] = [
  { key: 'neutral', label: 'Neutral', emoji: '😐', colorClass: 'hover:bg-gray-400/20 border-gray-500 text-gray-600 dark:text-gray-400 dark:border-gray-600' },
  { key: 'fan', label: 'Fan', emoji: '😍', colorClass: 'hover:bg-yellow-400/20 border-yellow-500 text-yellow-600 dark:text-yellow-400 dark:border-yellow-600' },
  { key: 'simp', label: 'Simp', emoji: '🥰', colorClass: 'hover:bg-pink-400/20 border-pink-500 text-pink-600 dark:text-pink-400 dark:border-pink-600' },
  { key: 'hater', label: 'Hater', emoji: '😡', colorClass: 'hover:bg-red-400/20 border-red-500 text-red-600 dark:text-red-400 dark:border-red-600' },
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

  const canUserVote = !!currentUser; // Allow anonymous users to vote

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
        const counts = data.attitudeCounts || defaultAttitudeCountsData;
        setFigureAttitudeCounts(counts);
        setTotalVotes(Object.values(counts).reduce((sum, count) => sum + count, 0));
      } else {
        setFigureAttitudeCounts(defaultAttitudeCountsData);
        setTotalVotes(0);
        console.warn(`Figure document with ID ${figureId} does not exist.`);
      }
    }, (error) => {
      console.error("Error fetching figure attitude counts:", error);
      toast({ title: "Error", description: "No se pudieron cargar los conteos de actitudes.", variant: "destructive" });
    });

    let unsubscribeUserProfile: Unsubscribe | undefined;
    if (currentUser && figureId) { 
        const userProfileRef = doc(db, "registered_users", currentUser.uid);
        unsubscribeUserProfile = onSnapshot(userProfileRef, (docSnap) => {
            if (docSnap.exists()) {
                const userProfile = docSnap.data() as UserProfile;
                const attitudeForThisFigure = userProfile.attitudes?.[figureId];
                setSelectedAttitude(attitudeForThisFigure || null);
            } else {
                setSelectedAttitude(null);
            }
            setIsComponentLoading(false);
        }, (error) => {
            console.error("Error fetching user profile for attitude:", error);
            setSelectedAttitude(null);
            setIsComponentLoading(false);
        });
    } else {
        setSelectedAttitude(null);
        setIsComponentLoading(false);
    }
    
    return () => {
      unsubscribeFigure();
      if (unsubscribeUserProfile) unsubscribeUserProfile();
    };
  }, [figureId, currentUser, toast]);


  const handleAttitudeClick = async (attitudeKeyClicked: AttitudeKey) => {
    if (!canUserVote) {
      toast({ title: "Acción Requerida", description: "Inicia sesión o continúa como invitado para votar.", variant: "default" });
      return;
    }
    if (isLoadingAttitudeAction) return;
    if (!currentUser) return;

    setIsLoadingAttitudeAction(attitudeKeyClicked);

    const previousSelectedAttitude = selectedAttitude;
    const newAttitudeToSet = previousSelectedAttitude === attitudeKeyClicked ? null : attitudeKeyClicked;

    const figureDocRef = doc(db, "figures", figureId);
    const userProfileRef = doc(db, "registered_users", currentUser.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const [figureDoc, userProfileDoc] = await Promise.all([
            transaction.get(figureDocRef),
            transaction.get(userProfileRef)
        ]);

        if (!figureDoc.exists()) throw new Error("Documento de figura no existe!");
        if (!userProfileDoc.exists()) throw new Error("Perfil de usuario no encontrado. No se puede votar.");

        // Update Figure's aggregate counts
        const currentServerCounts = (figureDoc.data()?.attitudeCounts || { ...defaultAttitudeCountsData });
        const finalServerCounts = { ...currentServerCounts };
        if (previousSelectedAttitude) {
          finalServerCounts[previousSelectedAttitude] = Math.max(0, (finalServerCounts[previousSelectedAttitude] || 0) - 1);
        }
        if (newAttitudeToSet) {
          finalServerCounts[newAttitudeToSet] = (finalServerCounts[newAttitudeToSet] || 0) + 1;
        }
        transaction.update(figureDocRef, { attitudeCounts: finalServerCounts });

        // Update User's personal attitude map
        const userAttitudes = userProfileDoc.data()?.attitudes || {};
        if (newAttitudeToSet) {
            userAttitudes[figureId] = newAttitudeToSet;
        } else {
            delete userAttitudes[figureId];
        }
        transaction.update(userProfileRef, { attitudes: userAttitudes });
      });

      if (newAttitudeToSet) {
        toast({ title: "Voto Registrado", description: `Tu actitud como "${ATTITUDE_OPTIONS_CONFIG.find(e => e.key === newAttitudeToSet)?.label}" ha sido guardada.` });
      } else {
        toast({ title: "Voto Eliminado", description: "Tu actitud ha sido eliminada." });
      }
    } catch (error: any) {
      console.error("Error voting on attitude:", error);
      let errorMessage = "No se pudo registrar tu voto.";
      if (error.message?.includes("Missing or insufficient permissions")) {
        errorMessage = "Error de permisos. Verifica las reglas de Firestore.";
      } else {
        errorMessage = error.message;
      }
      toast({ title: "Error al Votar", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingAttitudeAction(null);
    }
  };
  
  if (isComponentLoading) { 
    return (
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle>¿Qué te consideras con respecto a {figureName}?</CardTitle>
        <CardDescription>
          {currentUser // If a user (anonymous or not) exists
            ? "Selecciona una opción para compartir tu postura."
            : "Inicia sesión o continúa como invitado para poder participar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentUser && ( // Show if no user at all (e.g., anonymous sign-in failed)
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
          {ATTITUDE_OPTIONS_CONFIG.map(({ key, label, emoji, colorClass }) => (
            <Button
              key={key}
              variant={selectedAttitude === key ? "default" : "outline"}
              className={`flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 
                ${selectedAttitude === key ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 dark:ring-offset-card' : `${colorClass}`}
                ${isLoadingAttitudeAction === key ? 'opacity-50 cursor-not-allowed' : ''}
                ${!canUserVote ? 'cursor-not-allowed opacity-60' : ''}
              `}
              onClick={() => handleAttitudeClick(key)}
              disabled={!canUserVote || !!isLoadingAttitudeAction} // Disabled if no user or loading
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
