

"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, PlusCircle, Send, Loader2 } from 'lucide-react';
import type { Figure, YoutubeShort } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/shorts/')) {
                return urlObj.pathname.split('/shorts/')[1];
            }
            if (urlObj.pathname === '/watch') {
                return urlObj.searchParams.get('v');
            }
        } else if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.substring(1);
        }
    } catch (e) {
        // Not a valid URL, but might be just an ID
    }
    // Check if the input is just the video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }
    return null;
}

interface FigureShortsProps {
  figure: Figure;
}

export function FigureShorts({ figure }: FigureShortsProps) {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);
  const [newShortUrl, setNewShortUrl] = React.useState('');
  const [newShortTitle, setNewShortTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const approvedShorts = (figure.youtubeShorts || []).filter(short => short.status === 'approved');

  const handleSuggestShort = async () => {
    if (!newShortTitle.trim() || !newShortUrl.trim() || !firebaseUser) {
        toast({ title: "Datos incompletos", description: "Por favor, completa el título y la URL.", variant: "destructive" });
        return;
    }

    const videoId = getYoutubeVideoId(newShortUrl);
    if (!videoId) {
        toast({ title: "URL no válida", description: "Por favor, usa un enlace de YouTube Shorts o un ID de video válido.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    const newShort: YoutubeShort = {
        title: newShortTitle.trim(),
        videoId: videoId,
        status: 'pending',
        submittedBy: firebaseUser.uid,
        submittedAt: Timestamp.now(),
    };

    try {
        const figureRef = doc(db, 'figures', figure.id);
        await updateDoc(figureRef, {
            youtubeShorts: arrayUnion(newShort)
        });

        toast({
            title: "¡Sugerencia enviada!",
            description: "Gracias por tu contribución. El video será revisado por un administrador.",
        });

        setNewShortTitle('');
        setNewShortUrl('');
        setIsSuggestDialogOpen(false);

    } catch (error: any) {
        console.error("Error suggesting short:", error);
        toast({ title: "Error", description: `No se pudo enviar la sugerencia. ${error.message}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle className="flex items-center gap-2">
            <Youtube />
            Shorts
            </CardTitle>
            <CardDescription>
            Videos cortos relacionados con {figure.name}.
            </CardDescription>
        </div>
        <Dialog open={isSuggestDialogOpen} onOpenChange={setIsSuggestDialogOpen}>
            <Button variant="outline" size="sm" disabled={isAuthLoading} onClick={() => setIsSuggestDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Sugerir Short
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sugerir un YouTube Short</DialogTitle>
                    <DialogDescription>
                        Añade un video corto relevante para {figure.name}. Un administrador lo revisará.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="short-title" className="text-right">Título</Label>
                        <Input id="short-title" value={newShortTitle} onChange={(e) => setNewShortTitle(e.target.value)} className="col-span-3" placeholder="Ej: Gol increíble de Messi" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="short-url" className="text-right">URL o ID</Label>
                         <Input id="short-url" value={newShortUrl} onChange={(e) => setNewShortUrl(e.target.value)} className="col-span-3" placeholder="Pega el enlace del video..."/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="button" onClick={handleSuggestShort} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Enviar Sugerencia
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {approvedShorts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {approvedShorts.map((short, index) => (
              <div key={index} className="group aspect-ratio-9/16">
                 <a href={`https://www.youtube.com/shorts/${short.videoId}`} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
                        <iframe
                            src={`https://www.youtube.com/embed/${short.videoId}`}
                            title={short.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                         <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs font-semibold truncate">{short.title}</p>
                        </div>
                    </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <Youtube className="mx-auto h-12 w-12 mb-4" />
            <p>Aún no se han añadido videos cortos para este perfil.</p>
            <p className="text-sm mt-2">¡Sé el primero en sugerir uno!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
