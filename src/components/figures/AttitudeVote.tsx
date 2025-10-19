
"use client";

import React, { useState, useEffect } from 'react';
import type { Figure, AttitudeKey, Attitude, ProfileType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Star, Heart, ThumbsDown, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { grantActitudDefinidaAchievement } from '@/app/actions/achievementActions';
import { voteOnAttitude } from '@/lib/placeholder-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AttitudeVoteProps {
  figureId: string;
  figureName: string;
  profileType: ProfileType;
  attitudeCounts: Record<AttitudeKey, number>;
  onVote: (attitude: AttitudeKey | null) => void;
}

const ATTITUDE_OPTIONS: { key: AttitudeKey; label: string; icon: React.ElementType }[] = [
  { key: 'neutral', label: 'Neutral', icon: User },
  { key: 'fan', label: 'Fan', icon: Star },
  { key: 'simp', label: 'Simp', icon: Heart },
  { key: 'hater', label: 'Hater', icon: ThumbsDown },
];


export const AttitudeVote: React.FC<AttitudeVoteProps> = ({ figureId, figureName, profileType, attitudeCounts, onVote }) => {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const [selectedAttitude, setSelectedAttitude] = useState<AttitudeKey | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const storageKey = `wikistars5-attitudes-${firebaseUser?.uid}`;

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
    if (isAuthLoading || !firebaseUser || isVoting) {
        if(!isAuthLoading && !firebaseUser) toast({ title: "Error", description: "Debes iniciar sesión para votar.", variant: "destructive" });
        return;
    }
    
    setIsVoting(true);
    const previousAttitude = selectedAttitude;
    const isDeselecting = previousAttitude === newAttitude;
    const finalAttitude = isDeselecting ? null : newAttitude;

    // Optimistic UI update
    setSelectedAttitude(finalAttitude);
    onVote(finalAttitude);

    try {
        await voteOnAttitude(figureId, firebaseUser.uid, finalAttitude, previousAttitude);

        // Update localStorage
        let storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        storedAttitudes = storedAttitudes.filter(a => a.figureId !== figureId); // Remove old vote
        if (finalAttitude) {
            storedAttitudes.push({ figureId, attitude: finalAttitude, addedAt: new Date().toISOString() });
        }
        localStorage.setItem(storageKey, JSON.stringify(storedAttitudes));

        // Grant achievement on first vote (if not deselecting)
        if (finalAttitude) {
            const achievementResult = await grantActitudDefinidaAchievement(firebaseUser.uid);
            if (achievementResult.unlocked) {
                toast({
                    title: "¡Logro Desbloqueado!",
                    description: achievementResult.message,
                });
            }
        }

    } catch (error: any) {
        // Revert optimistic update on error
        setSelectedAttitude(previousAttitude);
        onVote(previousAttitude);
        console.error("Error voting on attitude:", error);
        toast({ title: "Error al votar", description: error.message, variant: "destructive" });
    } finally {
        setIsVoting(false);
    }
  };

  const totalVotes = Object.values(attitudeCounts).reduce((sum, count) => sum + count, 0);

  const attitudeOptionsToShow = profileType === 'media'
    ? ATTITUDE_OPTIONS.filter(opt => opt.key !== 'simp')
    : ATTITUDE_OPTIONS;

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>¿Qué te consideras?</CardTitle>
        <CardDescription>
           Define tu actitud hacia {figureName}. Tu voto es anónimo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {attitudeOptionsToShow.map(({ key, label, icon: Icon }) => {
            const count = attitudeCounts[key] || 0;
            const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : 0;
            const isSelected = selectedAttitude === key;

            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center h-28 w-24 p-2 transition-all duration-150 ease-in-out transform hover:scale-105",
                        isSelected && "shadow-lg ring-2 ring-offset-2 ring-offset-black ring-primary"
                      )}
                      onClick={() => handleVote(key)}
                      disabled={isVoting}
                    >
                      {isVoting && isSelected ? (
                        <Loader2 className="h-6 w-6 animate-spin mb-1" />
                      ) : (
                        <Icon className="h-6 w-6 mb-1" />
                      )}
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs">{count.toLocaleString()}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{percentage}% de los votos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <div className="text-center text-xs text-muted-foreground mt-4">
            Total de respuestas: {totalVotes.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};
