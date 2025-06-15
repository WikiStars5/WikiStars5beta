
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Figure, UserPerception, EmotionKey } from '@/lib/types';
import { db, auth as firebaseAuth } from '@/lib/firebase';
import { doc, runTransaction, onSnapshot, setDoc, deleteDoc, getDoc, serverTimestamp, type DocumentData, type Unsubscribe } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PerceptionEmotionsProps {
  figureId: string;
  figureName: string;
  initialPerceptionCounts?: Record<EmotionKey, number>;
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

export const PerceptionEmotions: React.FC<PerceptionEmotionsProps> = ({ figureId, figureName, initialPerceptionCounts }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [figurePerceptionCounts, setFigurePerceptionCounts] = useState<Record<EmotionKey, number>>(initialPerceptionCounts || defaultPerceptionCountsData);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoadingEmotionAction, setIsLoadingEmotionAction] = useState<EmotionKey | null>(null);
  const [isComponentLoading, setIsComponentLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      if (!user && !authAttempted) {
        setAuthAttempted(true);
        signInAnonymously(firebaseAuth)
          .then((anonUserCredential) => {
            setCurrentUser(anonUserCredential.user);
          })
          .catch((error) => {
            console.error("Anonymous sign-in error for perceptions:", error);
            toast({ title: "Error de autenticación", description: "No se pudo iniciar sesión para votar.", variant: "destructive" });
          });
      }
    });
    return () => unsubscribeAuth();
  }, [authAttempted, toast]);

  useEffect(() => {
    if (!figureId) return;
    setIsComponentLoading(true);
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
      // Combine loading state update after user perception is also checked
    }, (error) => {
      console.error("Error fetching figure perception counts:", error);
      toast({ title: "Error", description: "No se pudieron cargar los conteos de emociones.", variant: "destructive" });
    });

    return () => unsubscribeFigure();
  }, [figureId, toast]);

  useEffect(() => {
    let unsubscribeUserPerception: Unsubscribe | undefined;
    if (currentUser && figureId) {
      setIsComponentLoading(true); // Keep loading until user perception is fetched
      const userPerceptionDocId = `${currentUser.uid}_${figureId}`;
      const userPerceptionDocRef = doc(db, "userPerceptions", userPerceptionDocId);
      
      const fetchUserPerception = async () => {
        try {
          const docSnap = await getDoc(userPerceptionDocRef);
          if (docSnap.exists()) {
            const userPerceptionData = docSnap.data() as UserPerception;
            setSelectedEmotion(userPerceptionData.emotion);
          } else {
            setSelectedEmotion(null);
          }
        } catch (error) {
          console.error("Error fetching user's perception:", error);
          setSelectedEmotion(null); // Reset on error
        } finally {
          setIsComponentLoading(false); // Loading finishes after both figure and user data attempt
        }
      };
      fetchUserPerception(); // Initial fetch
      
      // Optional: Listen to changes if you expect this to change from elsewhere,
      // though typically it only changes via this component's actions.
      // unsubscribeUserPerception = onSnapshot(userPerceptionDocRef, (docSnap) => { ... });

    } else if (!currentUser) {
      setSelectedEmotion(null); // Clear selection if user logs out or is not available
      setIsComponentLoading(false); // If no user, no user perception to load
    }
    
    return () => {
      if (unsubscribeUserPerception) unsubscribeUserPerception();
    };
  }, [currentUser, figureId]);


  const handleEmotionClick = async (emotionKey: EmotionKey) => {
    if (!currentUser) {
      toast({ title: "No Autenticado", description: "Debes iniciar sesión para votar.", variant: "destructive" });
      return;
    }
    if (isLoadingEmotionAction) return;

    setIsLoadingEmotionAction(emotionKey);

    const figureDocRef = doc(db, "figures", figureId);
    const userPerceptionDocId = `${currentUser.uid}_${figureId}`;
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

        // Decrement old emotion if exists and changing vote
        if (selectedEmotion && selectedEmotion !== emotionKey) {
          newCounts[selectedEmotion] = Math.max(0, (newCounts[selectedEmotion] || 0) - 1);
        }
        // If deselecting current emotion
        if (selectedEmotion === emotionKey) {
            newCounts[emotionKey] = Math.max(0, (newCounts[emotionKey] || 0) - 1);
        }
        // Increment new emotion if selecting a new one
        if (newEmotionToSet && newEmotionToSet !== selectedEmotion) {
          newCounts[newEmotionToSet] = (newCounts[newEmotionToSet] || 0) + 1;
        }
        
        transaction.update(figureDocRef, { perceptionCounts: newCounts });
      });

      // After successful transaction, update/delete userPerception document
      if (newEmotionToSet) {
        await setDoc(userPerceptionDocRef, {
          userId: currentUser.uid,
          figureId: figureId,
          emotion: newEmotionToSet,
          timestamp: serverTimestamp(),
        });
        setSelectedEmotion(newEmotionToSet);
        toast({ title: "Voto Registrado", description: `Tu percepción como "${EMOTIONS_CONFIG.find(e => e.key === newEmotionToSet)?.label}" ha sido guardada.` });
      } else { // Deselecting
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
  
  if (isComponentLoading && !initialPerceptionCounts) { // Show loader if no initial data and still loading
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
        <CardDescription>¿Qué emoción te provoca esta figura? Haz clic en una emoción para votar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {EMOTIONS_CONFIG.map(({ key, label, emoji, colorClass }) => (
            <Button
              key={key}
              variant={selectedEmotion === key ? "default" : "outline"}
              className={`flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 
                ${selectedEmotion === key ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : `text-foreground ${colorClass}`}
                ${isLoadingEmotionAction === key ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => handleEmotionClick(key)}
              disabled={!currentUser || !!isLoadingEmotionAction}
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
