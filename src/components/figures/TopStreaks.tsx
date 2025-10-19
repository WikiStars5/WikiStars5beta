

"use client";

import * as React from 'react';
import { getTopStreaksForFigure } from '@/lib/placeholder-data';
import type { AttitudeKey, EmotionKey, StreakWithProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Flame, Loader2, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { correctMalformedUrl, cn } from '@/lib/utils';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import Image from 'next/image';

interface TopStreaksProps {
    figureId: string;
}

const FIRE_GIF_URL = "/image/fire.gif";

const ATTITUDE_EMOJIS: Record<AttitudeKey, string> = {
    fan: '😍',
    hater: '😡',
    simp: '🥰',
    neutral: '😐',
};

const EMOTION_IMAGES: Record<EmotionKey, string> = {
  alegria: '/gif/alegria.gif',
  envidia: '/emociones/envidia.png',
  tristeza: '/gif/trizteza-min.gif',
  miedo: '/emociones/miedo.png',
  desagrado: '/emociones/desagrado.png',
  furia: '/gif/furia.gif',
};


export function TopStreaks({ figureId }: TopStreaksProps) {
    const [streaks, setStreaks] = React.useState<StreakWithProfile[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStreaks = async () => {
            setIsLoading(true);
            try {
                const topStreaksData = await getTopStreaksForFigure(figureId);
                setStreaks(topStreaksData);
            } catch (error) {
                console.error("Error fetching top streaks:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStreaks();
    }, [figureId]);

    return (
        <Card className="border border-white/20 bg-black">
            <CardHeader>
                <CardTitle>Top de Rachas</CardTitle>
                <CardDescription>
                    Los usuarios con las rachas de comentarios más largas en este perfil.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : streaks.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Flame className="mx-auto h-10 w-10 mb-2" />
                        <p>Aún no hay rachas activas para esta figura.</p>
                        <p className="text-sm">¡Sé el primero en comentar por días seguidos!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {streaks.map((streak, index) => {
                            const user = streak.userProfile;
                            const displayName = streak.isAnonymous ? streak.username : user?.username;
                            const photoUrl = user?.photoURL;
                            
                            // Correct logic to get gender and country, prioritizing streak data for guests
                            const genderLabel = streak.gender || user?.gender;
                            const countryCode = streak.countryCode || user?.countryCode;
                            const countryName = user?.country;

                            const genderOption = GENDER_OPTIONS.find(g => g.value === genderLabel || g.label === genderLabel);
                            const genderSymbol = genderOption?.symbol;
                            const genderColorClass = genderLabel === 'Masculino' || genderLabel === 'male' ? 'text-blue-400' : genderLabel === 'Femenino' || genderLabel === 'female' ? 'text-pink-400' : '';
                            
                            const attitudeEmoji = streak.attitude ? ATTITUDE_EMOJIS[streak.attitude] : null;
                            const emotionImageUrl = streak.emotion ? EMOTION_IMAGES[streak.emotion] : null;

                             return (
                                <div key={streak.userId} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg w-6 text-center">{index + 1}</span>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={correctMalformedUrl(photoUrl) || undefined} alt={displayName} />
                                            <AvatarFallback>
                                                {displayName ? displayName.charAt(0).toUpperCase() : <User />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-semibold text-sm">{displayName}</p>
                                                {genderSymbol && <span className={cn("text-sm", genderColorClass)} title={genderLabel}>{genderSymbol}</span>}
                                                {countryCode && (
                                                    <Image
                                                        src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
                                                        alt={countryName || countryCode}
                                                        width={20}
                                                        height={15}
                                                        className="w-5 h-auto"
                                                        title={countryName}
                                                    />
                                                )}
                                            </div>
                                            {(attitudeEmoji || emotionImageUrl) && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {attitudeEmoji && <span className="text-lg" title={`Actitud: ${streak.attitude}`}>{attitudeEmoji}</span>}
                                                    {emotionImageUrl && <Image src={emotionImageUrl} alt={streak.emotion || 'emotion'} width={20} height={20} className="w-5 h-5" unoptimized />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-orange-400 font-bold">
                                         <Image
                                            src={FIRE_GIF_URL}
                                            alt="Racha de fuego"
                                            width={20}
                                            height={20}
                                            unoptimized
                                            data-ai-hint="fire gif"
                                        />
                                        <span>{streak.currentStreak} días</span>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    