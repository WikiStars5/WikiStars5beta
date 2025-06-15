
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Figure, UserPerception, EmotionKey } from '@/lib/types';
import { db, auth as firebaseAuth } from '@/lib/firebase';
import { doc, runTransaction, onSnapshot, setDoc, deleteDoc, getDoc, serverTimestamp, type DocumentData, type Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth'; // signInAnonymously removido
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

interface PerceptionEmotionsProps {
  figureId: string;
  figureName: string;
  initialPerceptionCounts?: Record<EmotionKey, number>;
  currentUser: User | null; // Recibe currentUser desde la página padre
}

const EMOTIONS_CONFIG: { key: EmotionKey; label: string; emoji: string; colorClass: string }[] = [
  { key: 'alegria', label: 'Alegría', emoji: '😄', colorClass: 'hover:bg-yellow-400/20 border-yellow-500 text-yellow-600' },
  { key: 'envidia', label: 'Envidia', emoji: '😒', colorClass: 'hover:bg-green-400/20 border-green-500 text-green-600' },
  { key: 'tristeza', label: 'Tristeza', emoji: '😢', colorClass: 'hover:bg-blue-400/20 border-blue-500 text-blue-600' },
  { key: 'miedo', label: 'Miedo', emoji: '😨', colorClass: 'hover:bg-purple-400/20 border-purple-500 text-purple-600' },
  { key: 'desagrado', label: 'Desagrado', emoji: '🤢', colorClass: 'hover:bg-lime-400/20 border-lime-500 text-lime-600' },
  { key: 'furia', label: 'Furia', emoji: '😠', colorClass: 'hover:bg-red-400/20 border-red-500 text-red-600' },
];

const defaultPerceptionCountsData: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

export const PerceptionEmotions: React.FC<PerceptionEmotionsProps> = ({ figureId, figureName, initialPerceptionCounts, currentUser }) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [figurePerceptionCounts, setFigurePerceptionCounts] = useState<Record<EmotionKey, number>>(initialPerceptionCounts || defaultPerceptionCountsData);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoadingEmotionAction, setIsLoadingEmotionAction] = useState<EmotionKey | null>(null);
  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const { toast } = useToast();

  const canUserVote = !!currentUser && !currentUser.isAnonymous;

  useEffect(() => {
    if (!figureId) return;
    setIsComponentLoading(true); // Se establece a true al inicio

    const figureDocRef = doc(db, "figures", figureId);
    const unsubscribeFigure = onSnapshot(figureDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Figure;
        const counts = data.perceptionCounts || defaultPerceptionCountsData;
        setFigurePerceptionCounts(counts);
        setTotalVotes(Object.values(counts).reduce((sum, count) => sum + count, 0));
      } else {
        setFigurePerceptionCounts(defaultPerceptionCountsData);
        setTotalVotes(0);
      }
      // No finalizar carga aquí, esperar a user perception
    }, (error) => {
      console.error("Error fetching figure perception counts:", error);
      toast({ title: "Error", description: "No se pudieron cargar los conteos de emociones.", variant: "destructive" });
      setIsComponentLoading(false); // Finalizar carga en caso de error de figura
    });

    let unsubscribeUserPerception: Unsubscribe | undefined;
    if (currentUser && figureId) { // No es necesario currentUser.isAnonymous aquí, ya que el control es para votar
      const userPerceptionDocId = `${currentUser.uid}_${figureId}`;
      const userPerceptionDocRef = doc(db, "userPerceptions", userPerceptionDocId);
      
      unsubscribeUserPerception = onSnapshot(userPerceptionDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userPerceptionData = docSnap.data() as UserPerception;
          setSelectedEmotion(userPerceptionData.emotion);
        } else {
          setSelectedEmotion(null);
        }
        setIsComponentLoading(false); // Finalizar carga después de obtener la percepción del usuario
      }, (error) => {
        console.error("Error fetching user's perception:", error);
        setSelectedEmotion(null);
        setIsComponentLoading(false); // Finalizar carga en caso de error de percepción del usuario
      });
    } else {
      setSelectedEmotion(null);
      setIsComponentLoading(false); // Finalizar carga si no hay usuario o figureId
    }
    
    return () => {
      unsubscribeFigure();
      if (unsubscribeUserPerception) unsubscribeUserPerception();
    };
  }, [figureId, currentUser, toast]);


  const handleEmotionClick = async (emotionKey: EmotionKey) => {
    if (!canUserVote) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión con una cuenta para votar.", variant: "default" });
      return;
    }
    if (isLoadingEmotionAction) return;

    setIsLoadingEmotionAction(emotionKey);

    const figureDocRef = doc(db, "figures", figureId);
    const userPerceptionDocId = `${currentUser.uid}_${figureId}`; // currentUser es no nulo y no anónimo aquí
    const userPerceptionDocRef = doc(db, "userPerceptions", userPerceptionDocId);

    const newEmotionToSet = selectedEmotion === emotionKey ? null : emotionKey;

    try {
      await runTransaction(db, async (transaction) => {
        const figureDoc = await transaction.get(figureDocRef);
        if (!figureDoc.exists()) {
          throw new Error("Documento de figura no existe!");
        }

        const currentCounts = (figureDoc.data()?.perceptionCounts || { ...defaultPerceptionCountsData }) as Record<EmotionKey, number>;
        const newCounts = { ...currentCounts };

        if (selectedEmotion && selectedEmotion !== emotionKey) {
          newCounts[selectedEmotion] = Math.max(0, (newCounts[selectedEmotion] || 0) - 1);
        }
        if (selectedEmotion === emotionKey) {
            newCounts[emotionKey] = Math.max(0, (newCounts[emotionKey] || 0) - 1);
        }
        if (newEmotionToSet && newEmotionToSet !== selectedEmotion) {
          newCounts[newEmotionToSet] = (newCounts[newEmotionToSet] || 0) + 1;
        }
        
        transaction.update(figureDocRef, { perceptionCounts: newCounts });
      });

      if (newEmotionToSet) {
        await setDoc(userPerceptionDocRef, {
          userId: currentUser.uid,
          figureId: figureId,
          emotion: newEmotionToSet,
          timestamp: serverTimestamp(),
        });
        setSelectedEmotion(newEmotionToSet);
        toast({ title: "Voto Registrado", description: `Tu percepción como "${EMOTIONS_CONFIG.find(e => e.key === newEmotionToSet)?.label}" ha sido guardada.` });
      } else { 
        await deleteDoc(userPerceptionDocRef);
        setSelectedEmotion(null);
        toast({ title: "Voto Eliminado", description: "Tu percepción ha sido eliminada." });
      }

    } catch (error: any) {
      console.error("Error voting:", error);
      toast({ title: "Error al Votar", description: error.message || "No se pudo registrar tu voto.", variant: "destructive" });
    } finally {
      setIsLoadingEmotionAction(null);
    }
  };
  
  if (isComponentLoading) { 
    return (
      <Card>
        <CardHeader>
          <CardTitle>Percepción Emocional de {figureName}</CardTitle>
          <CardDescription>¿Qué emoción te provoca esta figura?</CardDescription>
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
        <CardTitle>Percepción Emocional de {figureName}</CardTitle>
        <CardDescription>
          {canUserVote 
            ? "¿Qué emoción te provoca esta figura? Haz clic en una emoción para votar."
            : "Debes iniciar sesión con una cuenta para poder expresar tu emoción."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!canUserVote && (
          <Alert variant="default" className="mb-4">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Votación Restringida</AlertTitle>
            <AlertDescription>
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión con una cuenta
              </Link>
              {" "}para votar por la emoción que te provoca esta figura.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4"> {/* Changed grid classes here */}
          {EMOTIONS_CONFIG.map(({ key, label, emoji, colorClass }) => (
            <Button
              key={key}
              variant={selectedEmotion === key ? "default" : "outline"}
              className={`flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 
                ${selectedEmotion === key ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : `text-foreground ${colorClass}`}
                ${isLoadingEmotionAction === key ? 'opacity-50 cursor-not-allowed' : ''}
                ${!canUserVote ? 'cursor-not-allowed opacity-60' : ''}
              `}
              onClick={() => handleEmotionClick(key)}
              disabled={!canUserVote || !!isLoadingEmotionAction}
              style={{ minHeight: '100px' }}
            >
              <span className="text-3xl" role="img" aria-label={label}>{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
              <span className="text-sm font-bold">
                {figurePerceptionCounts[key] || 0}
              </span>
              {isLoadingEmotionAction === key && <Loader2 className="absolute h-5 w-5 animate-spin" />}
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


    
