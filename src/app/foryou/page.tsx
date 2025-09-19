"use client";

import * as React from 'react';
import { collectionGroup, getDocs, query, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure, TiktokVideo } from '@/lib/types';
import TikTokEmbed from '@/components/figures/TikTokEmbed';
import { Loader2, Compass, User } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { correctMalformedUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TikTokForYouItem extends TiktokVideo {
  figure: Figure;
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array: any[]) {
  let currentIndex = array.length,  randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const getTikTokVideoIdFromEmbed = (embedCode: string): string | null => {
    if (!embedCode) return null;
    const match = embedCode.match(/data-video-id="(\d+)"/);
    return match ? match[1] : null;
};

export default function ForYouPage() {
    const [feedItems, setFeedItems] = React.useState<TikTokForYouItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchForYouContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Query all tiktokVideos across all figures
                const tiktoksQuery = query(collectionGroup(db, 'tiktokVideos'));
                const tiktoksSnapshot = await getDocs(tiktoksQuery);

                if (tiktoksSnapshot.empty) {
                    setFeedItems([]);
                    setIsLoading(false);
                    return;
                }

                // 2. Map videos and collect unique figure IDs
                const figureIds = new Set<string>();
                const videosWithParentPath = tiktoksSnapshot.docs.map(docSnap => {
                    const figureId = docSnap.ref.parent.parent?.id;
                    if (figureId) figureIds.add(figureId);
                    return {
                        ...docSnap.data() as TiktokVideo,
                        id: docSnap.id,
                        figureId: figureId
                    };
                });

                // 3. Fetch all required figures in one go
                const figuresData = new Map<string, Figure>();
                if (figureIds.size > 0) {
                    const figuresRef = collection(db, 'figures');
                    // Firestore 'in' query is limited to 30 items
                    const figureIdChunks = Array.from(figureIds).reduce((acc, item, i) => {
                        const chunkIndex = Math.floor(i / 30);
                        if (!acc[chunkIndex]) acc[chunkIndex] = [];
                        acc[chunkIndex].push(item);
                        return acc;
                    }, [] as string[][]);
                    
                    for (const chunk of figureIdChunks) {
                         const figuresQuery = query(figuresRef, doc(db, 'figures', ...chunk).id, 'in', chunk);
                         const figureSnapshots = await getDocs(query(collection(db, 'figures'), where('__name__', 'in', chunk)));
                         figureSnapshots.forEach(doc => figuresData.set(doc.id, { id: doc.id, ...doc.data() } as Figure));
                    }
                }
                
                // 4. Combine videos with their figure data
                const combinedItems: TikTokForYouItem[] = videosWithParentPath
                    .map(video => {
                        const figure = figuresData.get(video.figureId!);
                        return figure ? { ...video, figure } : null;
                    })
                    .filter((item): item is TikTokForYouItem => !!item);
                    
                // 5. Shuffle and set the final feed
                setFeedItems(shuffleArray(combinedItems));

            } catch (err: any) {
                console.error("Error building For You feed:", err);
                setError("No se pudo cargar el contenido. Revisa la consola para más detalles.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchForYouContent();
    }, []);

    return (
        <div className="space-y-8">
            <div className="text-left">
                <h1 className="text-4xl font-bold font-headline mb-2">Para Ti</h1>
                <p className="text-lg text-muted-foreground">
                    Un feed de contenido aleatorio de todas las figuras para explorar.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Construyendo tu feed...</p>
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <Compass className="h-4 w-4" />
                    <AlertTitle>Error al Cargar</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : feedItems.length === 0 ? (
                <Alert>
                    <Compass className="h-4 w-4" />
                    <AlertTitle>¡El universo es vasto pero está vacío!</AlertTitle>
                    <AlertDescription>
                        Aún no se ha añadido ningún video a los perfiles. ¡Ve y añade algunos para empezar a explorar!
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="max-w-sm mx-auto space-y-12">
                    {feedItems.map(item => {
                        const videoId = getTikTokVideoIdFromEmbed(item.embedCode);
                        if (!videoId) return null;
                        
                        return (
                            <div key={item.id} className="w-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <Link href={`/figures/${item.figure.id}`}>
                                        <Avatar>
                                            <AvatarImage src={correctMalformedUrl(item.figure.photoUrl)} alt={item.figure.name} />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-grow">
                                        <Link href={`/figures/${item.figure.id}`}>
                                            <p className="font-bold hover:underline">{item.figure.name}</p>
                                        </Link>
                                        <p className="text-sm text-muted-foreground">Video de TikTok</p>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/figures/${item.figure.id}`}>Ver Perfil</Link>
                                    </Button>
                                </div>
                                <div className="w-full aspect-[9/16] rounded-lg overflow-hidden border bg-black">
                                    <TikTokEmbed videoId={videoId} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
