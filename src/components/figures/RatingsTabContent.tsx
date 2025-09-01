
"use client";

import type { AttitudeKey, EmotionKey } from '@/lib/types';
import { AttitudeVote } from './AttitudeVote';
import { PerceptionEmotions } from './PerceptionEmotions';

interface RatingsTabContentProps {
  figureId: string;
  figureName: string;
  initialAttitudeCounts?: Record<AttitudeKey, number>;
  initialPerceptionCounts?: Record<EmotionKey, number>;
}

export function RatingsTabContent({
  figureId,
  figureName,
  initialAttitudeCounts,
  initialPerceptionCounts
}: RatingsTabContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <AttitudeVote 
        figureId={figureId} 
        figureName={figureName} 
        initialAttitudeCounts={initialAttitudeCounts} 
      />
      <PerceptionEmotions 
        figureId={figureId} 
        figureName={figureName} 
        initialPerceptionCounts={initialPerceptionCounts}
      />
    </div>
  )
}
