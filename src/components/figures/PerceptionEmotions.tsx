
"use client";

import React, { useState, useEffect } from 'react';
import type { Figure, EmotionKey, EmotionVote } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { grantEmocionAlDescubiertoAchievement } from '@/app/actions/achievementActions';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface PerceptionEmotionsProps {
  figureId: string;
  figureName: string;
  perceptionCounts: Record<EmotionKey, number>;
}

const EMOTIONS_CONFIG: { key: EmotionKey; label: string; imageUrl: string; colorClass: string, selectedClass: string }[] = [
  { key: 'alegria', label: 'Alegría', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Falegria.gif?alt=media&token=ae532025-03c5-45a9-97d2-d475235bd74e`, colorClass: 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-400/20', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-yellow-500 border-yellow-500' },
  { key: 'envidia', label: 'Envidia', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5`, colorClass: 'border-green-500/50 text-green-600 hover:bg-green-400/20', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-green-500 border-green-500' },
  { key: 'tristeza', label: 'Tristeza', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ftrizteza.png?alt=media&token=0115df4b-55e4-4281-9cff-a8a560c38903`, colorClass: 'border-blue-500/50 text-blue-600 hover:bg-blue-400/20', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-blue-500 border-blue-500' },
  { key: 'miedo', label: 'Miedo', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985`, colorClass: 'border-purple-500/50 text-purple-600 hover:bg-purple-400/20', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-purple-500 border-purple-500' },
  { key: 'desagrado', label: 'Desagrado', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb`, colorClass: 'border-lime-500/50 text-lime-600 hover:bg-lime-400/20', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-lime-500 border-lime-500' },
  { key: 'furia', label: 'Furia', imageUrl: `https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Ffuria.gif?alt=media&token=18d1c677-2291-45b0-8001-99a1e5df6859`, colorClass: 'border-red-500/50 text-red-600 hover:bg-red-400/20', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-red-500 border-red-500' },
];

const defaultPerceptionCountsData: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

export const PerceptionEmotions: React.FC<PerceptionEmotionsProps> = ({ figureId, figureName, perceptionCounts }) => {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const totalVotes = React.useMemo(() => {
      return Object.values(perceptionCounts || defaultPerceptionCountsData).reduce((sum, count) => sum + count, 0);
  }, [perceptionCounts]);

  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseUser) {
        const storedEmotions: EmotionVote[] = JSON.parse(localStorage.getItem(`wikistars5-emotions-${firebaseUser.uid}`) || '[]');
        const userVote = storedEmotions.find(e => e.figureId === figureId);
        if (userVote) {
            setSelectedEmotion(userVote.emotion);
        }
    }
  }, [figureId, firebaseUser]);

  const handleVote = async (newEmotion: EmotionKey) => {
    if (isVoting || isAuthLoading || !firebaseUser) {
      if (!firebaseUser) toast({ title: "Error", description: "Inicia sesión para votar.", variant: "destructive" });
      return;
    }
      
    setIsVoting(true);
    const userId = firebaseUser.uid;

    try {
      const storageKey = `wikistars5-emotions-${userId}`;
      let previousVote: EmotionKey | null = null;
      if (typeof window !== 'undefined') {
        const storedEmotions: EmotionVote[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        previousVote = storedEmotions.find(e => e.figureId === figureId)?.emotion || null;
      }
      
      const isDeselecting = previousVote === newEmotion;

      await runTransaction(db, async (transaction) => {
        const figureRef = doc(db, 'figures', figureId);
        const figureDoc = await transaction.get(figureRef);
        
        if (!figureDoc.exists()) {
          throw new Error("Figura no encontrada.");
        }
        
        const currentCounts = figureDoc.data().perceptionCounts || defaultPerceptionCountsData;
        const newCounts = { ...currentCounts };
        
        if (previousVote) {
          newCounts[previousVote] = Math.max(0, (newCounts[previousVote] || 0) - 1);
        }
        
        if (!isDeselecting) {
          newCounts[newEmotion] = (newCounts[newEmotion] || 0) + 1;
        }

        transaction.update(figureRef, { perceptionCounts: newCounts });
      });

      if (typeof window !== 'undefined') {
        let storedEmotions: EmotionVote[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const existingVoteIndex = storedEmotions.findIndex(e => e.figureId === figureId);

        if (isDeselecting) {
          if (existingVoteIndex > -1) {
            storedEmotions.splice(existingVoteIndex, 1);
          }
          setSelectedEmotion(null);
        } else {
          if (existingVoteIndex > -1) {
            storedEmotions[existingVoteIndex].emotion = newEmotion;
          } else {
            storedEmotions.push({ figureId, emotion: newEmotion, addedAt: new Date().toISOString() });
          }
          setSelectedEmotion(newEmotion);
          
          if (!firebaseUser.isAnonymous) {
            const achievementResult = await grantEmocionAlDescubiertoAchievement(userId);
            if (achievementResult.unlocked) {
              toast({
                title: "¡Logro Desbloqueado!",
                description: achievementResult.message,
              });
            }
          }
        }
        
        localStorage.setItem(storageKey, JSON.stringify(storedEmotions));
      }

    } catch (error: any) {
      console.error("Error al votar por emoción:", error);
      toast({
        title: "Error al votar",
        description: error.message || "No se pudo registrar tu voto. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>¿Qué emoción te provoca {figureName}?</CardTitle>
        <CardDescription>
          Elige la emoción que mejor describe lo que sientes. Tu voto es anónimo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EMOTIONS_CONFIG.map(({ key, label, imageUrl, colorClass, selectedClass }) => (
              <Button
                key={key}
                variant={"outline"}
                className={cn(
                  "flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 bg-black",
                  colorClass,
                  selectedEmotion === key && selectedClass,
                  (isVoting || isAuthLoading) && selectedEmotion !== key && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => handleVote(key)}
                disabled={isVoting || isAuthLoading}
                style={{ minHeight: '120px' }}
              >
                {isVoting && selectedEmotion === key && <Loader2 className="absolute h-5 w-5 animate-spin" />}
                <div className="relative w-16 h-16 mb-1" data-ai-hint={`emoji ${label}`}>
                  <Image
                    src={imageUrl}
                    alt={label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 15vw, 10vw"
                    unoptimized
                  />
                </div>
                <span className="text-xs font-medium text-center block">{label}</span>
                <span className="text-sm font-bold">
                  {(perceptionCounts[key] || 0).toLocaleString()}
                </span>
              </Button>
            ))}
          </div>
        )}
        <div className="text-center text-muted-foreground">
          <p>Total de respuestas: <span className="font-bold">{totalVotes.toLocaleString()}</span></p>
        </div>
      </CardContent>
    </Card>
  );
};
