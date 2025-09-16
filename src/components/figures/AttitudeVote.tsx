
"use client";

import React, { useState, useEffect } from 'react';
import type { Figure, AttitudeKey, Attitude, ProfileType } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { grantActitudDefinidaAchievement } from '@/app/actions/achievementActions';
import { useAuth } from '@/hooks/use-auth';
import { updateFigureInFirestore } from '@/lib/placeholder-data';

interface AttitudeVoteProps {
  figureId: string;
  figureName: string;
  profileType: ProfileType;
  attitudeCounts: Record<AttitudeKey, number>;
  onVote: (attitude: AttitudeKey | null) => void;
}

const ATTITUDE_OPTIONS_CONFIG: {
  key: AttitudeKey;
  label: string;
  emoji: string;
  colorClass: string;
  selectedClass: string;
  profileType: 'all' | 'character';
}[] = [
  { key: 'neutral', label: 'Neutral', emoji: '😐', colorClass: 'border-muted-foreground/50 text-muted-foreground hover:bg-muted-foreground/10 hover:border-muted-foreground', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-muted-foreground border-muted-foreground', profileType: 'all' },
  { key: 'fan', label: 'Fan', emoji: '😍', colorClass: 'border-primary/50 text-primary hover:bg-primary/10 hover:border-primary', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-primary border-primary', profileType: 'all' },
  { key: 'simp', label: 'Simp', emoji: '🥰', colorClass: 'border-[#FF4081]/50 text-[#FF4081] hover:bg-[#FF4081]/10 hover:border-[#FF4081]', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-[#FF4081] border-[#FF4081]', profileType: 'character' },
  { key: 'hater', label: 'Hater', emoji: '😡', colorClass: 'border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive', selectedClass: 'ring-2 ring-offset-2 ring-offset-black ring-destructive border-destructive', profileType: 'all' },
];

const defaultAttitudeCountsData: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

export const AttitudeVote: React.FC<AttitudeVoteProps> = ({ figureId, figureName, profileType, attitudeCounts, onVote }) => {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const [selectedAttitude, setSelectedAttitude] = useState<AttitudeKey | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();
  
  const totalVotes = React.useMemo(() => {
    return Object.values(attitudeCounts || defaultAttitudeCountsData).reduce((sum, count) => sum + count, 0);
  }, [attitudeCounts]);
  
  useEffect(() => {
    // Load user's vote from local storage on component mount
    if (typeof window !== 'undefined' && firebaseUser) {
        const storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(`wikistars5-attitudes-${firebaseUser.uid}`) || '[]');
        const userVote = storedAttitudes.find(a => a.figureId === figureId);
        if (userVote) {
            setSelectedAttitude(userVote.attitude);
            onVote(userVote.attitude); // Inform parent of initial attitude
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figureId, firebaseUser]);
  
  const handleVote = async (newAttitude: AttitudeKey) => {
    if (isVoting || isAuthLoading || !firebaseUser) {
        if (!firebaseUser) toast({ title: "Error", description: "Inicia sesión para votar.", variant: "destructive" });
        return;
    }
      
    setIsVoting(true);
    const userId = firebaseUser.uid;

    try {
      const storageKey = `wikistars5-attitudes-${userId}`;
      let previousVote: AttitudeKey | null = null;
      if (typeof window !== 'undefined') {
        const storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        previousVote = storedAttitudes.find(a => a.figureId === figureId)?.attitude || null;
      }
      
      const isDeselecting = previousVote === newAttitude;
      const finalAttitude = isDeselecting ? null : newAttitude;

      await runTransaction(db, async (transaction) => {
        const figureRef = doc(db, 'figures', figureId);
        const figureDoc = await transaction.get(figureRef);
        
        if (!figureDoc.exists()) {
          throw new Error("Figura no encontrada.");
        }
        
        const figureData = figureDoc.data();
        const currentCounts = figureData.attitudeCounts || defaultAttitudeCountsData;
        const newCounts = { ...currentCounts };
        
        if (previousVote) {
          newCounts[previousVote] = Math.max(0, (newCounts[previousVote] || 0) - 1);
        }
        
        if (finalAttitude) {
          newCounts[finalAttitude] = (newCounts[finalAttitude] || 0) + 1;
        }

        const updateData: Partial<Figure> = { attitudeCounts: newCounts };

        // Check for community verification
        if (figureData.creationMethod === 'manual' && !figureData.isCommunityVerified) {
          const totalNewVotes = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
          if (totalNewVotes >= 1000) {
            updateData.isCommunityVerified = true;
          }
        }
        
        transaction.update(figureRef, updateData);
      });


      if (typeof window !== 'undefined') {
        let storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const existingVoteIndex = storedAttitudes.findIndex(a => a.figureId === figureId);

        if (finalAttitude) {
          if (existingVoteIndex > -1) {
            storedAttitudes[existingVoteIndex].attitude = finalAttitude;
          } else {
            storedAttitudes.push({ figureId, attitude: finalAttitude, addedAt: new Date().toISOString() });
          }
          if (!firebaseUser.isAnonymous) {
            const achievementResult = await grantActitudDefinidaAchievement(userId);
            if (achievementResult.unlocked) {
              toast({ title: "¡Logro Desbloqueado!", description: achievementResult.message });
            }
          }
        } else { // Deselecting
            if (existingVoteIndex > -1) {
                storedAttitudes.splice(existingVoteIndex, 1);
            }
        }
        
        localStorage.setItem(storageKey, JSON.stringify(storedAttitudes));
        setSelectedAttitude(finalAttitude);
        onVote(finalAttitude); // Inform parent of the change
      }

    } catch (error: any) {
      console.error("Error al votar:", error);
      toast({
        title: "Error al votar",
        description: error.message || "No se pudo registrar tu voto. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const availableOptions = ATTITUDE_OPTIONS_CONFIG.filter(opt => 
    opt.profileType === 'all' || (opt.profileType === 'character' && profileType === 'character')
  );

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>¿Qué te consideras?</CardTitle>
        <CardDescription>
           Define tu actitud hacia {figureName}. Tu voto es anónimo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthLoading ? (
            <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        ) : (
          <div className={cn(
            "grid gap-4",
            availableOptions.length === 3
              ? "grid-cols-3" // Grid of 3 for media
              : "grid-cols-2 sm:grid-cols-2 md:grid-cols-4" // Original grid for characters
          )}>
            {availableOptions.map(({ key, label, emoji, colorClass, selectedClass }) => (
              <Button
                key={key}
                variant="ghost"
                className={cn(
                  "flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 border bg-black",
                  colorClass,
                  selectedAttitude === key && selectedClass,
                  (isVoting || isAuthLoading) && selectedAttitude !== key && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => handleVote(key)}
                disabled={isVoting || isAuthLoading}
                style={{ minHeight: '100px' }}
              >
                {isVoting && selectedAttitude === key && <Loader2 className="absolute h-5 w-5 animate-spin" />}
                <span className="text-3xl" role="img" aria-label={label}>{emoji}</span>
                <span className="text-xs font-medium">{label}</span>
                <span className="text-sm font-bold">
                  {(attitudeCounts[key] || 0).toLocaleString()}
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
