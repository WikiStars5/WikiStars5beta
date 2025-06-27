
"use client";

import { useState, useEffect } from 'react';
import type { Figure, UserAttitude, UserPerception, UserStarRating } from '@/lib/types';
import { getUserInteractions } from '@/lib/userData';
import { getFiguresByIds } from '@/lib/placeholder-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FigureListItem } from '@/components/figures/FigureListItem';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface UserActivityProps {
  userId: string;
}

const ATTITUDE_LABELS: Record<string, string> = {
    fan: 'Fan',
    simp: 'Simp',
    neutral: 'Neutral',
    hater: 'Hater'
};

const EMOTION_LABELS: Record<string, string> = {
    alegria: 'Alegría',
    envidia: 'Envidia',
    tristeza: 'Tristeza',
    miedo: 'Miedo',
    desagrado: 'Desagrado',
    furia: 'Furia'
};

export default function UserActivity({ userId }: UserActivityProps) {
    const [attitudes, setAttitudes] = useState<(UserAttitude & { id: string })[]>([]);
    const [perceptions, setPerceptions] = useState<(UserPerception & { id: string })[]>([]);
    const [starRatings, setStarRatings] = useState<(UserStarRating & { id: string })[]>([]);
    const [figuresMap, setFiguresMap] = useState<Map<string, Figure>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            setIsLoading(true);
            const interactions = await getUserInteractions(userId);
            
            setAttitudes(interactions.attitudes);
            setPerceptions(interactions.perceptions);
            setStarRatings(interactions.starRatings);

            const figureIds = new Set([
                ...interactions.attitudes.map(a => a.figureId),
                ...interactions.perceptions.map(p => p.figureId),
                ...interactions.starRatings.map(r => r.figureId),
            ]);

            if (figureIds.size > 0) {
                const figures = await getFiguresByIds(Array.from(figureIds));
                setFiguresMap(new Map(figures.map(f => [f.id, f])));
            }
            
            setIsLoading(false);
        };

        fetchActivity();
    }, [userId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Cargando tu actividad...</p>
            </div>
        );
    }
    
    const renderActivityList = (items: any[], type: 'attitude' | 'perception' | 'rating') => {
        if (items.length === 0) {
            return <p className="text-center text-muted-foreground py-6">No hay actividad en esta categoría.</p>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(item => {
                    const figure = figuresMap.get(item.figureId);
                    if (!figure) return null;

                    let badgeContent: React.ReactNode = '';
                    if (type === 'attitude') badgeContent = ATTITUDE_LABELS[item.attitude] || item.attitude;
                    if (type === 'perception') badgeContent = EMOTION_LABELS[item.emotion] || item.emotion;
                    if (type === 'rating') {
                        badgeContent = (
                            <span className="flex items-center gap-1">
                                {item.starValue}
                                <Star className="h-3 w-3" />
                            </span>
                        );
                    }

                    return (
                        <div key={item.id} className="relative group">
                            <FigureListItem figure={figure} />
                            <Badge variant="destructive" className="absolute top-2 right-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                {badgeContent}
                            </Badge>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Tabs defaultValue="attitudes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="attitudes">Actitudes</TabsTrigger>
                <TabsTrigger value="emotions">Emociones</TabsTrigger>
                <TabsTrigger value="ratings">Calificaciones</TabsTrigger>
            </TabsList>
            <TabsContent value="attitudes" className="mt-4">
                {renderActivityList(attitudes, 'attitude')}
            </TabsContent>
            <TabsContent value="emotions" className="mt-4">
                {renderActivityList(perceptions, 'perception')}
            </TabsContent>
            <TabsContent value="ratings" className="mt-4">
                {renderActivityList(starRatings, 'rating')}
            </TabsContent>
        </Tabs>
    );
}
