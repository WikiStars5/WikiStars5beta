
"use client";

import { useState, useEffect } from 'react';
import type { Figure, AttitudeKey } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FigureListItem } from '@/components/figures/FigureListItem';
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
  attitudes: Record<string, AttitudeKey>;
  figures: Figure[];
}

export default function UserActivity({ attitudes, figures }: UserActivityProps) {
    const figuresMap = new Map(figures.map(f => [f.id, f]));

    const getFiguresForAttitude = (attitude: string) => {
        const figureIds = Object.keys(attitudes || {}).filter(
            figureId => (attitudes || {})[figureId] === attitude
        );
        return figureIds.map(id => figuresMap.get(id)).filter((f): f is Figure => !!f);
    };

    const getFiguresForEmotion = (emotion: string) => {
        // This is now disabled, returning empty array.
        return [];
    };

    const getFiguresForRating = (rating: number) => {
        // This is now disabled, returning empty array.
        return [];
    };
    
    return (
        <Tabs defaultValue="attitudes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="attitudes">Actitudes</TabsTrigger>
                <TabsTrigger value="emotions" disabled>Emociones</TabsTrigger>
                <TabsTrigger value="ratings" disabled>Calificaciones</TabsTrigger>
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
                                <ActivityGrid figures={getFiguresForAttitude(tab.key)} />
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
                                <ActivityGrid figures={getFiguresForEmotion(tab.key)} />
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
                                <ActivityGrid figures={getFiguresForRating(tab.key)} />
                            </TabsContent>
                        ))}
                    </Tabs>
                 </Card>
            </TabsContent>
        </Tabs>
    );
}
