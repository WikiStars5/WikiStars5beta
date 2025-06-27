
"use client";

import { useState, useEffect } from 'react';
import type { Figure, UserAttitude, UserPerception, UserStarRating } from '@/lib/types';
import { getUserInteractions } from '@/lib/userData';
import { getFiguresByIds } from '@/lib/placeholder-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FigureListItem } from '@/components/figures/FigureListItem';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Configuración para las sub-pestañas
const ATTITUDE_TABS = [
    { key: 'fan', label: 'Fan' },
    { key: 'simp', label: 'Simp' },
    { key: 'hater', label: 'Hater' },
    { key: 'neutral', label: 'Neutral' },
];

const EMOTION_TABS = [
    { key: 'alegria', label: 'Alegría' },
    { key: 'envidia', label: 'Envidia' },
    { key: 'tristeza', label: 'Tristeza' },
    { key: 'miedo', label: 'Miedo' },
    { key: 'desagrado', label: 'Desagrado' },
    { key: 'furia', label: 'Furia' },
];

const RATING_TABS = [
    { key: 5, label: '5 Estrellas' },
    { key: 4, label: '4 Estrellas' },
    { key: 3, label: '3 Estrellas' },
    { key: 2, label: '2 Estrellas' },
    { key: 1, label: '1 Estrella' },
];

// Componente helper para renderizar la grilla de figuras
const ActivityGrid = ({ figures }: { figures: Figure[] }) => {
    if (figures.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>No has marcado ninguna figura en esta categoría.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4">
            {figures.map(figure => <FigureListItem key={figure.id} figure={figure} />)}
        </div>
    );
};

interface UserActivityProps {
  userId: string;
}

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

    const getFiguresFor = (items: any[], key: string, value: any) => {
        return items
            .filter(item => item[key] === value)
            .map(item => figuresMap.get(item.figureId))
            .filter((f): f is Figure => !!f);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Cargando tu actividad...</p>
            </div>
        );
    }
    
    return (
        <Tabs defaultValue="attitudes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="attitudes">Actitudes</TabsTrigger>
                <TabsTrigger value="emotions">Emociones</TabsTrigger>
                <TabsTrigger value="ratings">Calificaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="attitudes" className="mt-4">
                <Card>
                    <Tabs defaultValue="fan" className="w-full p-2 sm:p-4">
                        <TabsList className="flex flex-wrap sm:flex-nowrap h-auto justify-start sm:overflow-x-auto no-scrollbar">
                           {ATTITUDE_TABS.map(tab => (
                               <TabsTrigger key={tab.key} value={tab.key} className="flex-shrink-0">{tab.label}</TabsTrigger>
                           ))}
                        </TabsList>
                        {ATTITUDE_TABS.map(tab => (
                            <TabsContent key={tab.key} value={tab.key}>
                                <ActivityGrid figures={getFiguresFor(attitudes, 'attitude', tab.key)} />
                            </TabsContent>
                        ))}
                    </Tabs>
                </Card>
            </TabsContent>

            <TabsContent value="emotions" className="mt-4">
                 <Card>
                    <Tabs defaultValue="alegria" className="w-full p-2 sm:p-4">
                        <TabsList className="flex flex-wrap sm:flex-nowrap h-auto justify-start sm:overflow-x-auto no-scrollbar">
                           {EMOTION_TABS.map(tab => (
                               <TabsTrigger key={tab.key} value={tab.key} className="flex-shrink-0">{tab.label}</TabsTrigger>
                           ))}
                        </TabsList>
                        {EMOTION_TABS.map(tab => (
                            <TabsContent key={tab.key} value={tab.key}>
                                <ActivityGrid figures={getFiguresFor(perceptions, 'emotion', tab.key)} />
                            </TabsContent>
                        ))}
                    </Tabs>
                 </Card>
            </TabsContent>

            <TabsContent value="ratings" className="mt-4">
                 <Card>
                    <Tabs defaultValue="5" className="w-full p-2 sm:p-4">
                        <TabsList className="flex flex-wrap sm:flex-nowrap h-auto justify-start sm:overflow-x-auto no-scrollbar">
                           {RATING_TABS.map(tab => (
                               <TabsTrigger key={tab.key} value={tab.key.toString()} className="flex-shrink-0">{tab.label}</TabsTrigger>
                           ))}
                        </TabsList>
                        {RATING_TABS.map(tab => (
                            <TabsContent key={tab.key} value={tab.key.toString()}>
                                <ActivityGrid figures={getFiguresFor(starRatings, 'starValue', tab.key)} />
                            </TabsContent>
                        ))}
                    </Tabs>
                 </Card>
            </TabsContent>
        </Tabs>
    );
}
