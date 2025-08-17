
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Figure, EmotionKey, EmotionVote, UserPerception } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, runTransaction, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ShareButton } from '../shared/ShareButton';
import { grantEmocionAlDescubiertoAchievement } from '@/app/actions/achievementActions';

interface PerceptionEmotionsProps {
  figureId: string;
  figureName: string;
  initialPerceptionCounts?: Record<EmotionKey, number>;
  currentUser: User | null; 
}

const EMOTIONS_CONFIG: { key: EmotionKey; label: string; imageUrl: string; colorClass: string }[] = [
  { key: 'alegria', label: 'Alegría', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Falegria.png?alt=media&token=0638fdc0-d367-4fec-b8d6-8b32c0c83414`, colorClass: 'hover:bg-yellow-400/20 border-yellow-500 text-yellow-600' },
  { key: 'envidia', label: 'Envidia', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5`, colorClass: 'hover:bg-green-400/20 border-green-500 text-green-600' },
  { key: 'tristeza', label: 'Tristeza', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ftrizteza.png?alt=media&token=0115df4b-55e4-4281-9cff-a8a560c38903`, colorClass: 'hover:bg-blue-400/20 border-blue-500 text-blue-600' },
  { key: 'miedo', label: 'Miedo', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985`, colorClass: 'hover:bg-purple-400/20 border-purple-500 text-purple-600' },
  { key: 'desagrado', label: 'Desagrado', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb`, colorClass: 'hover:bg-lime-400/20 border-lime-500 text-lime-600' },
  { key: 'furia', label: 'Furia', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ffuria.png?alt=media&token=e596fcc4-3ef2-4b32-8529-ce42d4758f2f`, colorClass: 'hover:bg-red-400/20 border-red-500 text-red-600' },
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

  const canUserVote = !!currentUser;

  useEffect(() => {
    if (!figureId) {
        setIsComponentLoading(false);
        return;
    }
    
    const figureDocRef = doc(db, "figures", figureId);
    const unsubscribeFigure = onSnapshot(figureDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Figure;
        const counts = data.perceptionCounts || defaultPerceptionCountsData;
        setFigurePerceptionCounts(counts);
        setTotalVotes(Object.values(counts).reduce((sum, count) => sum + count, 0));
      }
    }, (error) => {
        console.error("Error listening to figure document for perceptions:", error);
    });

    if (currentUser) {
        // Load from localStorage first for instant UI
        try {
            const localEmotionsJSON = localStorage.getItem('wikistars5-userEmotions');
            if (localEmotionsJSON) {
                const localEmotions: EmotionVote[] = JSON.parse(localEmotionsJSON);
                const currentVote = localEmotions.find(e => e.figureId === figureId);
                if (currentVote) {
                    setSelectedEmotion(currentVote.emotion);
                }
            }
        } catch (e) {
            console.error("Failed to read emotions from localStorage", e);
        }

        const userVoteDocRef = doc(db, 'userEmotions', `${currentUser.uid}_${figureId}`);
        getDoc(userVoteDocRef).then(docSnap => {
            if (docSnap.exists()) {
                setSelectedEmotion(docSnap.data().emotion as EmotionKey);
            } else {
                setSelectedEmotion(null);
            }
        }).catch(error => {
            console.error("Error fetching user emotion:", error);
        }).finally(() => {
            setIsComponentLoading(false);
        });
    } else {
        setSelectedEmotion(null);
        setIsComponentLoading(false);
    }

    return () => {
      unsubscribeFigure();
    };
  }, [figureId, currentUser]);

  const handleEmotionClick = async (emotionKeyClicked: EmotionKey) => {
    if (!canUserVote || !currentUser) {
      toast({ title: "Acción Requerida", description: "Inicia sesión o continúa como invitado para votar." });
      return;
    }
    if (isLoadingEmotionAction) return;
    
    setIsLoadingEmotionAction(emotionKeyClicked);
    
    const userVoteDocRef = doc(db, 'userEmotions', `${currentUser.uid}_${figureId}`);
    const figureDocRef = doc(db, 'figures', figureId);
    const newEmotionToSet = selectedEmotion === emotionKeyClicked ? null : emotionKeyClicked;
    
    try {
        await runTransaction(db, async (transaction) => {
            const userVoteDoc = await transaction.get(userVoteDocRef);
            const figureDoc = await transaction.get(figureDocRef);

            if (!figureDoc.exists()) {
                throw new Error("La figura no existe.");
            }

            const previousEmotion = userVoteDoc.exists ? (userVoteDoc.data() as UserPerception).emotion : null;
            const currentCounts = (figureDoc.data()?.perceptionCounts || { ...defaultPerceptionCountsData }) as Record<EmotionKey, number>;
            const newCounts = { ...currentCounts };

            if (previousEmotion) {
                newCounts[previousEmotion] = Math.max(0, (newCounts[previousEmotion] || 0) - 1);
            }
            if (newEmotionToSet) {
                newCounts[newEmotionToSet] = (newCounts[newEmotionToSet] || 0) + 1;
            }

            transaction.update(figureDocRef, { perceptionCounts: newCounts });
            
            if (newEmotionToSet) {
                transaction.set(userVoteDocRef, { userId: currentUser.uid, figureId, emotion: newEmotionToSet, timestamp: serverTimestamp() });
            } else {
                transaction.delete(userVoteDocRef);
            }
        });

        setSelectedEmotion(newEmotionToSet); 
      
        // --- Update Local Storage for instant profile reflection ---
        try {
            const localEmotionsJSON = localStorage.getItem('wikistars5-userEmotions');
            let localEmotions: EmotionVote[] = localEmotionsJSON ? JSON.parse(localEmotionsJSON) : [];
            localEmotions = localEmotions.filter(e => e.figureId !== figureId); // Remove old emotion
            if (newEmotionToSet) {
                localEmotions.push({ figureId, emotion: newEmotionToSet, addedAt: new Date().toISOString() });
            }
            localStorage.setItem('wikistars5-userEmotions', JSON.stringify(localEmotions));
        } catch (e) {
            console.error("Failed to update emotions in localStorage", e);
        }

        if (!currentUser.isAnonymous && newEmotionToSet) {
            const achievementResult = await grantEmocionAlDescubiertoAchievement(currentUser.uid);
            if (achievementResult.unlocked) {
                toast({ title: "¡Logro Desbloqueado!", description: achievementResult.message });
            }
        }
        
        if (newEmotionToSet) {
            toast({
                title: "¡Voto Registrado!",
                description: `Tu percepción ha sido guardada. ¡Invita a otros a votar!`,
                duration: 8000,
                action: <ShareButton figureName={figureName} figureId={figureId} showText />,
            });
        } else {
            toast({ title: "Voto Eliminado", description: "Tu percepción ha sido eliminada." });
        }

    } catch (error: any) {
        console.error("Error in emotion vote transaction:", error);
        toast({ title: "Error al Votar", description: error.message || "No se pudo registrar tu voto.", variant: "destructive" });
    } finally {
      setIsLoadingEmotionAction(null);
    }
  };
  
  if (isComponentLoading) { 
    return (
      <Card className="border border-white/20 bg-black">
        <CardHeader>
          <CardTitle>¿Qué emoción te provoca {figureName}?</CardTitle>
          <CardDescription>Cargando opciones de emoción...</CardDescription>
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
        <CardTitle>¿Qué emoción te provoca {figureName}?</CardTitle>
        <CardDescription>
          {currentUser
            ? "Haz clic en una emoción para votar."
            : "Inicia sesión o continúa como invitado para poder expresar tu emoción."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!currentUser && (
          <Alert variant="default" className="mb-4">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Votación</AlertTitle>
            <AlertDescription>
               <Link href="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión
              </Link>
              {" "}o{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                regrístrate
              </Link>
              {" "}para votar o continúa como invitado (intentaremos conectarte).
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-3">
          {EMOTIONS_CONFIG.map(({ key, label, imageUrl, colorClass }) => (
            <Button
              key={key}
              variant={selectedEmotion === key ? "default" : "outline"}
              className={`flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 
                ${selectedEmotion === key ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 dark:ring-offset-card' : `text-foreground ${colorClass}`}
                ${isLoadingEmotionAction === key ? 'opacity-50 cursor-not-allowed' : ''}
                ${!canUserVote ? 'cursor-not-allowed opacity-60' : ''} 
              `}
              onClick={() => handleEmotionClick(key)}
              disabled={!canUserVote || !!isLoadingEmotionAction}
              style={{ minHeight: '120px' }}
            >
              {isLoadingEmotionAction === key && <Loader2 className="absolute h-6 w-6 animate-spin" />}
              <div className="relative w-10 h-10 mb-1" data-ai-hint={`emoji ${label}`}>
                <Image
                  src={imageUrl}
                  alt={label}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 10vw, 5vw"
                />
              </div>
              <span className="text-xs font-medium text-center block">{label}</span>
              <span className="text-sm font-bold">
                {figurePerceptionCounts[key] || 0}
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
