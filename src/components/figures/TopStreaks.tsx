
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

const FIRE_GIF_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/image%2Ffire.gif?alt=media&token=fd18d32d-c443-4da6-a369-e55ae241f7c5";

const ATTITUDE_EMOJIS: Record<AttitudeKey, string> = {
    fan: '😍',
    hater: '😡',
    simp: '🥰',
    neutral: '😐',
};

const EMOTION_IMAGES: Record<EmotionKey, string> = {
  alegria: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Falegria.gif?alt=media&token=ae532025-03c5-45a9-97d2-d475235bd74e',
  envidia: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5',
  tristeza: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Ftrizteza-min.gif?alt=media&token=f9bc3bbf-eba1-4249-8c4b-128d56e4a6f0',
  miedo: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985',
  desagrado: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb',
  furia: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Ffuria.gif?alt=media&token=18d1c677-2291-45b0-8001-99a1e5df6859',
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
