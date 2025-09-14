
"use client";

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Figure, Attitude, EmotionVote, LocalUserStreak, AttitudeKey, EmotionKey } from '@/lib/types';
import { getFiguresByIds } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Star, Flame, Smile, Heart, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { correctMalformedUrl } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '../ui/separator';

const EMOTION_IMAGES: Record<string, string> = {
  alegria: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Falegria.png?alt=media&token=0638fdc0-d367-4fec-b8d6-8b32c0c83414',
  envidia: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5',
  tristeza: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ftrizteza.png?alt=media&token=0115df4b-55e4-4281-9cff-a8a560c38903',
  miedo: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985',
  desagrado: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb',
  furia: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ffuria.png?alt=media&token=e596fcc4-3ef2-4b32-8529-ce42d4758f2f',
};

const EMOTION_LABELS: Record<EmotionKey, string> = {
    alegria: "Alegría",
    envidia: "Envidia",
    tristeza: "Tristeza",
    miedo: "Miedo",
    desagrado: "Desagrado",
    furia: "Furia",
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
    const [streaks, setStreaks] = useState<(LocalUserStreak & { figure: Figure | null })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser || isAuthLoading) return;

        const fetchActivity = async () => {
            setIsLoading(true);
            try {
                // Fetch Attitudes
                const storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(`wikistars5-attitudes-${firebaseUser.uid}`) || '[]');
                const attitudeFigureIds = storedAttitudes.map(a => a.figureId);
                if (attitudeFigureIds.length > 0) {
                    const figures = await getFiguresByIds(attitudeFigureIds);
                    const figuresMap = new Map(figures.map(f => [f.id, f]));
                    setAttitudes(storedAttitudes.map(vote => ({ ...vote, figure: figuresMap.get(vote.figureId) || null })));
                }

                // Fetch Emotions
                const storedEmotions: EmotionVote[] = JSON.parse(localStorage.getItem(`wikistars5-emotions-${firebaseUser.uid}`) || '[]');
                const emotionFigureIds = storedEmotions.map(e => e.figureId);
                if (emotionFigureIds.length > 0) {
                    const figures = await getFiguresByIds(emotionFigureIds);
                    const figuresMap = new Map(figures.map(f => [f.id, f]));
                    setEmotionVotes(storedEmotions.map(vote => ({ ...vote, figure: figuresMap.get(vote.figureId) || null })));
                }

                // Fetch Streaks
                const storedStreaks: LocalUserStreak[] = JSON.parse(localStorage.getItem(`wikistars5-streaks-${firebaseUser.uid}`) || '[]');
                const streakFigureIds = storedStreaks.map(s => s.figureId);
                if (streakFigureIds.length > 0) {
                    const figures = await getFiguresByIds(streakFigureIds);
                    const figuresMap = new Map(figures.map(f => [f.id, f]));
                    setStreaks(storedStreaks.map(streak => ({ ...streak, figure: figuresMap.get(streak.figureId) || null })));
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
    
    if (isLoading || isAuthLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Cargando tu actividad...</p>
                </CardContent>
            </Card>
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tu Actividad</CardTitle>
                <CardDescription>Un resumen de tus interacciones en la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="attitude" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="attitude">Mi Actitud</TabsTrigger>
                        <TabsTrigger value="emotion">Mis Emociones</TabsTrigger>
                        <TabsTrigger value="streak">Mis Rachas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="attitude" className="mt-4">
                        {attitudes.length > 0 ? (
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {attitudes.map(vote => vote.figure && (
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
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No has definido tu actitud hacia ningún perfil.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="emotion" className="mt-4">
                         {emotionVotes.length > 0 ? (
                            <div className="space-y-6">
                                {Object.entries(groupedEmotionVotes).map(([emotion, votes]) => (
                                    <div key={emotion}>
                                        <div className="flex items-center gap-2 mb-3">
                                             <Image src={EMOTION_IMAGES[emotion]} alt={emotion} width={24} height={24} />
                                            <h3 className="font-semibold text-lg">
                                                Perfiles que te provocan {EMOTION_LABELS[emotion as EmotionKey]}
                                            </h3>
                                        </div>
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
                                        <Separator className="mt-6"/>
                                    </div>
                                ))}
                            </div>
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
            </CardContent>
        </Card>
    );
}
