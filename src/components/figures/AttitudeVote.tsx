
"use client";

import React from 'react';
import type { AttitudeKey, ProfileType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hourglass } from 'lucide-react';

interface AttitudeVoteProps {
  figureId: string;
  figureName: string;
  profileType: ProfileType;
  attitudeCounts: Record<AttitudeKey, number>;
  onVote: (attitude: AttitudeKey | null) => void;
}

export const AttitudeVote: React.FC<AttitudeVoteProps> = ({ figureName }) => {
  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>¿Qué te consideras?</CardTitle>
        <CardDescription>
           Define tu actitud hacia {figureName}. Tu voto es anónimo.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
          <Hourglass className="mx-auto h-10 w-10 mb-4 text-amber-500" />
          <p className="font-semibold text-amber-400">En Mantenimiento</p>
          <p className="text-sm">El sistema de votación de actitud está siendo mejorado.</p>
      </CardContent>
    </Card>
  );
};
