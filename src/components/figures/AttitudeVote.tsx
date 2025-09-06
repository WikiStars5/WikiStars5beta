
"use client";

import React, { useState, useEffect } from 'react';
import type { Figure, AttitudeKey, Attitude } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ShareButton } from '../shared/ShareButton';
import { cn } from '@/lib/utils';
import { grantActitudDefinidaAchievement } from '@/app/actions/achievementActions';


interface AttitudeVoteProps {
  figureId: string;
  figureName: string;
  initialAttitudeCounts?: Record<AttitudeKey, number>;
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

export const AttitudeVote: React.FC<AttitudeVoteProps> = ({ figureId, figureName, initialAttitudeCounts }) => {
  const [selectedAttitude, setSelectedAttitude] = useState<AttitudeKey | null>(null);
  const [figureAttitudeCounts, setFigureAttitudeCounts] = useState<Record<AttitudeKey, number>>(initialAttitudeCounts || defaultAttitudeCountsData);
  const [totalVotes, setTotalVotes] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!figureId) return;

    const figureDocRef = doc(db, "figures", figureId);
    const unsubscribeFigure = onSnapshot(figureDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Figure;
        const counts = data.attitudeCounts || defaultAttitudeCountsData;
        setFigureAttitudeCounts(counts);
        setTotalVotes(Object.values(counts).reduce((sum, count) => sum + count, 0));
      }
    }, (error) => {
      console.error("Error listening to figure document for attitudes:", error);
    });
    
    return () => {
      unsubscribeFigure();
    };
  }, [figureId]);
  
  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>¿Qué te consideras?</CardTitle>
        <CardDescription>
          Votación deshabilitada. Se requiere un sistema de autenticación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ATTITUDE_OPTIONS_CONFIG.map(({ key, label, emoji, colorClass, selectedClass }) => (
            <Button
              key={key}
              variant="ghost"
              className={cn(
                "flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 border bg-black",
                colorClass,
                'opacity-50 cursor-not-allowed'
              )}
              disabled={true}
              style={{ minHeight: '100px' }}
            >
              <span className="text-3xl" role="img" aria-label={label}>{emoji}</span>
              <span className="text-xs font-medium">{label}</span>
              <span className="text-sm font-bold">
                {(figureAttitudeCounts[key] || 0).toLocaleString()}
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
