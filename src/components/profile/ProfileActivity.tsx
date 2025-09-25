
"use client";

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Figure, Attitude, EmotionVote, LocalUserStreak, AttitudeKey, EmotionKey, Streak } from '@/lib/types';
import { getFiguresByIds, getStreaksForUser } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Star, Flame, Smile, Heart, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { correctMalformedUrl } from '@/lib/utils';
import Image from 'next/image';

const EMOTION_LABELS: Record<EmotionKey, string> = {
    alegria: "Alegría",
    envidia: "Envidia",
    tristeza: "Tristeza",
    miedo: "Miedo",
    desagrado: "Desagrado",
    furia: "Furia",
};

const ATTITUDE_LABELS: Record<AttitudeKey, string> = {
    fan: "Fan",
    simp: "Simp",
    hater: "Hater",
    neutral: "Neutral",
};

const ATTITUDE_ICONS: Record<AttitudeKey, React.ElementType> = {
    fan: Star,
    simp: Heart,
    hater: ThumbsDown,
    neutral: User,
};

const ATTITUDE_COLORS: Record<AttitudeKey, string> = {
    fan: 'text-primary',
    simp: 'text-pink-500',
    hater: 'text-destructive',
    neutral: 'text-muted-foreground',
};


export function ProfileActivity() {
    const { firebaseUser, isLoading: isAuthLoading } = useAuth();
    const [attitudes, setAttitudes] = useState<(Attitude & { figure: Figure | null })[]>([]);
    const [emotionVotes, setEmotionVotes] = useState<(EmotionVote & { figure: Figure | null })[]>([]);
    const [streaks, setStreaks] = useState<(Streak & { figure: Figure | null })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser || isAuthLoading) return;

        const fetchActivity = async () => {
            setIsLoading(true);
            try {
                // Fetch Attitudes from localStorage
                const storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(`wikistars5-attitudes-${firebaseUser.uid}`) || '[]');
                const attitudeFigureIds = storedAttitudes.map(a => a.figureId);
                if (attitudeFigureIds.length > 0) {
                    const figures = await getFiguresByIds(attitudeFigureIds);
                    const figuresMap = new Map(figures.map(f => [f.id, f]));
                    setAttitudes(storedAttitudes.map(vote => ({ ...vote, figure: figuresMap.get(vote.figureId) || null })));
                }

                // Fetch Emotions from localStorage
                const storedEmotions: EmotionVote[] = JSON.parse(localStorage.getItem(`wikistars5-emotions-${firebaseUser.uid}`) || '[]');
                const emotionFigureIds = storedEmotions.map(e => e.figureId);
                if (emotionFigureIds.length > 0) {
                    const figures = await getFiguresByIds(emotionFigureIds);
                    const figuresMap = new Map(figures.map(f => [f.id, f]));
                    setEmotionVotes(storedEmotions.map(vote => ({ ...vote, figure: figuresMap.get(vote.figureId) || null })));
                }

                // Fetch Streaks from Firestore
                const userStreaks = await getStreaksForUser(firebaseUser.uid);
                const streakFigureIds = userStreaks.map(s => s.figureId);
                 if (streakFigureIds.length > 0) {
                    const figures = await getFiguresByIds(streakFigureIds as string[]);
                    const figuresMap = new Map(figures.map(f => [f.id, f]));
                    setStreaks(userStreaks.map(streak => ({ ...streak, figure: figuresMap.get(streak.figureId as string) || null })));
                }

            } catch (error) {
                console.error("Error fetching user activity:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivity();
    }, [firebaseUser, isAuthLoading]);

    const groupedEmotionVotes = useMemo(() => {
        const groups: Partial<Record<EmotionKey, (EmotionVote & { figure: Figure | null })[]>> = {};
        for (const vote of emotionVotes) {
            if (!groups[vote.emotion]) {
                groups[vote.emotion] = [];
            }
            groups[vote.emotion]?.push(vote);
        }
        return groups;
    }, [emotionVotes]);
    
    const groupedAttitudeVotes = useMemo(() => {
        const groups: Partial<Record<AttitudeKey, (Attitude & { figure: Figure | null })[]>> = {};
        for (const vote of attitudes) {
            if (!groups[vote.attitude]) {
                groups[vote.attitude] = [];
            }
            groups[vote.attitude]?.push(vote);
        }
        return groups;
    }, [attitudes]);

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando tu actividad...</p>
            </div>
        );
    }
    
    const hasActivity = attitudes.length > 0 || emotionVotes.length > 0 || streaks.length > 0;

    if (!hasActivity) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Tu Actividad</CardTitle>
                    <CardDescription>Un resumen de tus interacciones en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">Aún no tienes actividad. ¡Empieza a interactuar para ver tu historial aquí!</p>
                </CardContent>
            </Card>
        );
    }

    const emotionKeys = Object.keys(groupedEmotionVotes) as EmotionKey[];
    const attitudeKeys = Object.keys(groupedAttitudeVotes) as AttitudeKey[];

    return (
        <Tabs defaultValue="attitude" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="attitude">Mi Actitud</TabsTrigger>
                <TabsTrigger value="emotion">Mis Emociones</TabsTrigger>
                <TabsTrigger value="streak">Mis Rachas</TabsTrigger>
            </TabsList>
            <TabsContent value="attitude" className="mt-4">
                {attitudeKeys.length > 0 ? (
                    <Tabs defaultValue={attitudeKeys[0]} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                            {Object.keys(ATTITUDE_LABELS).map((attitudeKey) => (
                                    <TabsTrigger key={attitudeKey} value={attitudeKey} disabled={!groupedAttitudeVotes[attitudeKey as AttitudeKey]}>
                                    {ATTITUDE_LABELS[attitudeKey as AttitudeKey]}
                                    </TabsTrigger>
                            ))}
                        </TabsList>
                        {Object.entries(groupedAttitudeVotes).map(([attitude, votes]) => (
                            <TabsContent key={attitude} value={attitude} className="mt-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {votes.map(vote => vote.figure && (
                                        <Link key={vote.figureId} href={`/figures/${vote.figureId}`} className="group relative text-center">
                                            <Avatar className="h-24 w-24 mx-auto border-2 border-transparent group-hover:border-primary transition-all">
                                                <AvatarImage src={correctMalformedUrl(vote.figure.photoUrl)} alt={vote.figure.name} />
                                                <AvatarFallback><User /></AvatarFallback>
                                            </Avatar>
                                            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-card p-1.5 rounded-full shadow-lg">
                                                {React.createElement(ATTITUDE_ICONS[vote.attitude], { className: `h-5 w-5 ${ATTITUDE_COLORS[vote.attitude]}` })}
                                            </div>
                                            <p className="text-sm font-medium mt-2 group-hover:text-primary transition-colors">{vote.figure.name}</p>
                                        </Link>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No has definido tu actitud hacia ningún perfil.</p>
                )}
            </TabsContent>
            <TabsContent value="emotion" className="mt-4">
                    {emotionKeys.length > 0 ? (
                    <Tabs defaultValue={emotionKeys[0]} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
                            {Object.keys(EMOTION_LABELS).map((emotionKey) => (
                                    <TabsTrigger key={emotionKey} value={emotionKey} disabled={!groupedEmotionVotes[emotionKey as EmotionKey]}>
                                    {EMOTION_LABELS[emotionKey as EmotionKey]}
                                    </TabsTrigger>
                            ))}
                        </TabsList>
                        {Object.entries(groupedEmotionVotes).map(([emotion, votes]) => (
                            <TabsContent key={emotion} value={emotion} className="mt-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {votes.map(vote => vote.figure && (
                                        <Link key={vote.figureId} href={`/figures/${vote.figureId}`} className="group relative text-center">
                                            <Avatar className="h-24 w-24 mx-auto border-2 border-transparent group-hover:border-primary transition-all">
                                                <AvatarImage src={correctMalformedUrl(vote.figure.photoUrl)} alt={vote.figure.name} />
                                                <AvatarFallback><User /></AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium mt-2 group-hover:text-primary transition-colors">{vote.figure.name}</p>
                                        </Link>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                        <p className="text-center text-muted-foreground py-8">No has votado por ninguna emoción.</p>
                )}
            </TabsContent>
            <TabsContent value="streak" className="mt-4">
                {streaks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {streaks.map(streak => streak.figure && (
                            <Link key={streak.figureId} href={`/figures/${streak.figureId}`} className="group relative text-center">
                                <Avatar className="h-24 w-24 mx-auto border-2 border-transparent group-hover:border-orange-400 transition-all">
                                    <AvatarImage src={correctMalformedUrl(streak.figure.photoUrl)} alt={streak.figure.name} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-card p-1 rounded-full shadow-lg flex items-center gap-1 text-orange-400 font-bold">
                                    <Flame className="h-4 w-4" />
                                    <span>{streak.currentStreak}</span>
                                </div>
                                <p className="text-sm font-medium mt-2 group-hover:text-primary transition-colors">{streak.figure.name}</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                        <p className="text-center text-muted-foreground py-8">No tienes rachas activas.</p>
                )}
            </TabsContent>
        </Tabs>
    );
}
