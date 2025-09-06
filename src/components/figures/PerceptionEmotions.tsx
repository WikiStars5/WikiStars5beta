
"use client";

import React, { useState, useEffect } from 'react';
import type { Figure, EmotionKey, EmotionVote } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ShareButton } from '../shared/ShareButton';
import { grantEmocionAlDescubiertoAchievement } from '@/app/actions/achievementActions';

interface PerceptionEmotionsProps {
  figureId: string;
  figureName: string;
  initialPerceptionCounts?: Record<EmotionKey, number>;
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

export const PerceptionEmotions: React.FC<PerceptionEmotionsProps> = ({ figureId, figureName, initialPerceptionCounts }) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [figurePerceptionCounts, setFigurePerceptionCounts] = useState<Record<EmotionKey, number>>(initialPerceptionCounts || defaultPerceptionCountsData);
  const [totalVotes, setTotalVotes] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!figureId) return;
    
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

    return () => {
      unsubscribeFigure();
    };
  }, [figureId]);

  
  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>¿Qué emoción te provoca {figureName}?</CardTitle>
        <CardDescription>
          Votación deshabilitada. Se requiere un sistema de autenticación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {EMOTIONS_CONFIG.map(({ key, label, imageUrl, colorClass }) => (
            <Button
              key={key}
              variant={"outline"}
              className={`flex flex-col items-center justify-center p-3 h-auto space-y-1.5 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 opacity-50 cursor-not-allowed
                ${colorClass}
              `}
              disabled={true}
              style={{ minHeight: '120px' }}
            >
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
                {(figurePerceptionCounts[key] || 0).toLocaleString()}
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
