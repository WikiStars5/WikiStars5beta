
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Figure, Attitude, EmotionVote, LocalUserStreak } from '@/lib/types';
import { getFiguresByIds } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Star, Flame, Smile } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { correctMalformedUrl } from '@/lib/utils';
import Image from 'next/image';

const EMOTION_IMAGES: Record<string, string> = {
  alegria: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Falegria.png?alt=media&token=0638fdc0-d367-4fec-b8d6-8b32c0c83414',
  envidia: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5',
  tristeza: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ftrizteza.png?alt=media&token=0115df4b-55e4-4281-9cff-a8a560c38903',
  miedo: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985',
  desagrado: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb',
  furia: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ffuria.png?alt=media&token=e596fcc4-3ef2-4b32-8529-ce42d4758f2f',
};

export function ProfileActivity() {
    const { firebaseUser, isLoading: isAuthLoading } = useAuth();
    const [fanFigures, setFanFigures] = useState<Figure[]>([]);
    const [emotionVotes, setEmotionVotes] = useState<(EmotionVote & { figure: Figure | null })[]>([]);
    const [streaks, setStreaks] = useState<(LocalUserStreak & { figure: Figure | null })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser || isAuthLoading) return;

        const fetchActivity = async () => {
            setIsLoading(true);
            try {
                // Fetch Attitudes (Fans)
                const storedAttitudes: Attitude[] = JSON.parse(localStorage.getItem(`wikistars5-attitudes-${firebaseUser.uid}`) || '[]');
                const fanFigureIds = storedAttitudes.filter(a => a.attitude === 'fan').map(a => a.figureId);
                if (fanFigureIds.length > 0) {
                    const figures = await getFiguresByIds(fanFigureIds);
                    setFanFigures(figures);
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
    
    if (isLoading || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando tu actividad...</p>
            </div>
        );
    }
    
    const hasActivity = fanFigures.length > 0 || emotionVotes.length > 0 || streaks.length > 0;

    if (!hasActivity) {
        return null; // Don't show anything if there's no activity
    }

    return (
        <div className="space-y-8">
            {fanFigures.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star className="text-primary" /> Perfiles que sigues (Fan)</CardTitle>
                        <CardDescription>Los perfiles donde has marcado tu actitud como "Fan".</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {fanFigures.map(figure => (
                            <Link key={figure.id} href={`/figures/${figure.id}`} className="group space-y-2 text-center">
                                <Avatar className="h-24 w-24 mx-auto ring-2 ring-transparent group-hover:ring-primary transition-all">
                                    <AvatarImage src={correctMalformedUrl(figure.photoUrl)} alt={figure.name} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">{figure.name}</p>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

             {emotionVotes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Smile className="text-primary" /> Tus Votos de Emoción</CardTitle>
                        <CardDescription>Las emociones que has asociado a diferentes perfiles.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {emotionVotes.map(vote => vote.figure && (
                            <Link key={vote.figureId} href={`/figures/${vote.figureId}`} className="group relative text-center">
                                <Avatar className="h-24 w-24 mx-auto border-2 border-transparent group-hover:border-primary transition-all">
                                    <AvatarImage src={correctMalformedUrl(vote.figure.photoUrl)} alt={vote.figure.name} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-card p-1.5 rounded-full shadow-lg">
                                    <Image src={EMOTION_IMAGES[vote.emotion]} alt={vote.emotion} width={24} height={24} />
                                </div>
                                <p className="text-sm font-medium mt-2 group-hover:text-primary transition-colors">{vote.figure.name}</p>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {streaks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Flame className="text-orange-400" /> Tus Rachas Activas</CardTitle>
                        <CardDescription>Tu racha de comentarios consecutivos en estos perfiles.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
