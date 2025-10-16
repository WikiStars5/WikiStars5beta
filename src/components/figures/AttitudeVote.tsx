
"use client";

import React, { useState, useEffect } from 'react';
import type { Figure, AttitudeKey, Attitude, ProfileType } from '@/lib/types';
import { db, callFirebaseFunction } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { grantActitudDefinidaAchievement } from '@/app/actions/achievementActions';

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

export const AttitudeVote: React.FC<AttitudeVoteProps> = ({ figureId, figureName, profileType, attitudeCounts: initialAttitudeCounts, onVote }) => {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const [selectedAttitude, setSelectedAttitude] = useState<AttitudeKey | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();
  const [attitudeCounts, setAttitudeCounts] = useState(initialAttitudeCounts);
  
  const storageKey = `wikistars5-attitudes-${firebaseUser?.uid}`;

  const totalVotes = React.useMemo(() => {
    return Object.values(attitudeCounts || defaultAttitudeCountsData).reduce((sum, count) => sum + count, 0);
  }, [attitudeCounts]);
  
   useEffect(() => {
    const figureRef = doc(db, 'figures', figureId);
    const unsubscribe = onSnapshot(figureRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as Figure;
            setAttitudeCounts(data.attitudeCounts || defaultAttitudeCountsData);
        }
    });
    return () => unsubscribe();
  }, [figureId]);

   useEffect(() => {
    if (typeof window !== 'undefined' && firebaseUser) {
        const storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const vote = storedAttitudes.find(a => a.figureId === figureId);
        if (vote) {
            setSelectedAttitude(vote.attitude);
        }
    }
  }, [figureId, firebaseUser, storageKey]);


  const handleVote = async (newAttitude: AttitudeKey) => {
    if (isVoting || isAuthLoading || !firebaseUser) {
        if (!firebaseUser) toast({ title: "Error", description: "Debes iniciar sesión para votar.", variant: "destructive" });
        return;
    }
    
    setIsVoting(true);

    const isDeselecting = selectedAttitude === newAttitude;
    const finalVote = isDeselecting ? null : newAttitude;
    const previousVote = selectedAttitude;
    
    try {
        const result = await callFirebaseFunction('voteOnAttitude', {
            figureId,
            newVote: finalVote,
            previousVote,
        });

        // --- Handle local storage and UI state ---
        let updatedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const voteIndex = updatedAttitudes.findIndex(a => a.figureId === figureId);

        if (finalVote === null) {
            if (voteIndex > -1) {
                updatedAttitudes.splice(voteIndex, 1);
            }
        } else {
            const newVoteEntry: Attitude = { figureId, attitude: finalVote, addedAt: new Date().toISOString() };
            if (voteIndex > -1) {
                updatedAttitudes[voteIndex] = newVoteEntry;
            } else {
                updatedAttitudes.push(newVoteEntry);
                if (!firebaseUser.isAnonymous) {
                  grantActitudDefinidaAchievement(firebaseUser.uid).then(res => {
                    if(res.unlocked) toast({ title: "¡Logro Desbloqueado!", description: res.message });
                  });
                }
            }
        }

        localStorage.setItem(storageKey, JSON.stringify(updatedAttitudes));
        setSelectedAttitude(finalVote);
        if (onVote) {
          onVote(finalVote);
        }

    } catch (error: any) {
        console.error("Error al votar por actitud:", error);
        toast({ title: "Error al Votar", description: error.message, variant: "destructive" });
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
        <div className={cn(
          "grid gap-4",
          availableOptions.length === 3
            ? "grid-cols-3" 
            : "grid-cols-2 sm:grid-cols-2 md:grid-cols-4" 
        )}>
          {availableOptions.map(({ key, label, emoji, colorClass, selectedClass }) => (
            <Button
              key={key}
              variant="ghost"
              onClick={() => handleVote(key)}
              className={cn(
                "flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 border bg-black",
                colorClass,
                selectedAttitude === key && selectedClass,
                (isVoting || isAuthLoading) && selectedAttitude !== key && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isVoting || isAuthLoading}
              style={{ minHeight: '100px' }}
            >
              {isVoting && selectedAttitude === key && <Loader2 className="absolute h-6 w-6 animate-spin" />}
              <span className="text-3xl" role="img" aria-label={label}>{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
              <span className="text-sm font-bold">
                {(attitudeCounts[key] || 0).toLocaleString()}
              </span>
            </Button>
          ))}
        </div>
        <div className="text-center text-muted-foreground">
          <p>Total de respuestas: <span className="font-bold">{totalVotes.toLocaleString()}</span></p>
        </div>
      </CardContent>
    </Card>
  );
};
