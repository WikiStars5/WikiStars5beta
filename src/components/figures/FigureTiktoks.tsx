
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Send, Loader2, Flag, Check, Trash2, ExternalLink, VideoOff, Grid3x3, RectangleHorizontal } from 'lucide-react';
import type { Figure, TiktokVideo } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, runTransaction, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

declare global {
  interface Window {
    tiktok: {
      embed: {
        render: (element?: HTMLElement) => void;
      };
    };
  }
}


const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2859 3333" {...props} shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd">
        <path d="M2081 0c55 473 319 755 778 785v532c-266 26-499-61-770-225v995c0 1264-1378 1659-1932 753-356-583-138-1606 1004-1647v561c-87 14-180 36-265 65-254 86-458 249-458 522 0 314 252 566 566 566 314 0 566-252 566-566v-1040h550v-550h-550z" fill="currentColor"/>
    </svg>
);


const REPORT_THRESHOLD = 10;

interface FigureTiktoksProps {
  figure: Figure;
}

export function FigureTiktoks({ figure }: FigureTiktoksProps) {
  const { firebaseUser, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = React.useState<TiktokVideo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);
  const [newVideoEmbedCode, setNewVideoEmbedCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'feed'>('grid');
  
  React.useEffect(() => {
    const tiktoksRef = collection(db, `figures/${figure.id}/tiktokVideos`);
    const unsubscribe = onSnapshot(tiktoksRef, (snapshot) => {
        const fetchedVideos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TiktokVideo));
        setVideos(fetchedVideos);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching tiktoks:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [figure.id]);
  
  React.useEffect(() => {
    // Si la ventana de TikTok está disponible
    if (typeof window.tiktok?.embed?.render === 'function') {
        // Usa setTimeout para darle tiempo al DOM para que se actualice
        setTimeout(() => {
            // El script renderiza todos los elementos TikTok que encuentra
            window.tiktok.embed.render(); 
        }, 500); // 500 milisegundos de espera
    }
  }, [videos, viewMode]);


  const handleSuggestVideo = async () => {
    if (!newVideoEmbedCode.trim() || !firebaseUser) {
        toast({ title: "Datos incompletos", description: "Por favor, pega el código de inserción de TikTok.", variant: "destructive" });
        return;
    }

    if (!newVideoEmbedCode.includes('tiktok-embed')) {
        toast({ title: "Código no válido", description: "El código proporcionado no parece ser un código de inserción de TikTok válido.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    try {
        const videosRef = collection(db, `figures/${figure.id}/tiktokVideos`);
        
        const newVideoData = {
            embedCode: newVideoEmbedCode,
            submittedBy: firebaseUser.uid,
            submittedAt: serverTimestamp(),
            reportedBy: [],
        };
        await addDoc(videosRef, newVideoData);

        toast({
            title: "¡TikTok añadido!",
            description: "Gracias por tu contribución.",
        });

        setNewVideoEmbedCode('');
        setIsSuggestDialogOpen(false);

    } catch (error: any) {
        console.error("Error suggesting TikTok video:", error);
        toast({ title: "Error", description: `No se pudo añadir el video. ${error.message}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteVideo = async (videoId: string) => {
    if (isProcessing === videoId) return;
    setIsProcessing(videoId);

    try {
        const videoDocRef = doc(db, `figures/${figure.id}/tiktokVideos`, videoId);
        await deleteDoc(videoDocRef);
        toast({ title: "Video Eliminado", description: "El video ha sido eliminado." });
    } catch (error: any) {
        console.error("Error deleting video:", error);
        toast({ title: "Error", description: `No se pudo eliminar el video. ${error.message}`, variant: "destructive" });
    } finally {
        setIsProcessing(null);
    }
  }
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'feed' : 'grid');
  };

  return (
    <>
      <Card className="border border-white/20 bg-black">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
              <CardTitle className="flex items-center gap-2">
                  <TikTokIcon className="h-5 w-5"/>
                  TikToks
              </CardTitle>
              <CardDescription>
                  Videos de TikTok relacionados con {figure.name}.
              </CardDescription>
          </div>
          <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={toggleViewMode} aria-label="Cambiar vista">
                            {viewMode === 'grid' ? <RectangleHorizontal className="h-5 w-5"/> : <Grid3x3 className="h-5 w-5"/>}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Cambiar a vista de {viewMode === 'grid' ? 'feed' : 'cuadrícula'}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog open={isSuggestDialogOpen} onOpenChange={setIsSuggestDialogOpen}>
                  <Button variant="outline" size="sm" disabled={isAuthLoading} onClick={() => setIsSuggestDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Sugerir
                  </Button>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Sugerir un TikTok</DialogTitle>
                          <DialogDescription>
                              Ve a TikTok, haz clic en "Copiar código de inserción" en un video y pégalo aquí.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                              <Label htmlFor="video-embed-code">Código de Inserción de TikTok</Label>
                              <Textarea id="video-embed-code" value={newVideoEmbedCode} onChange={(e) => setNewVideoEmbedCode(e.target.value)} rows={8} placeholder="<blockquote class='tiktok-embed' ...>...</blockquote>"/>
                          </div>
                      </div>
                      <DialogFooter>
                          <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                          <Button type="button" onClick={handleSuggestVideo} disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                              Añadir Video
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : videos.length > 0 ? (
            <div
              className={cn(
                "no-scrollbar",
                viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "flex flex-col gap-8"
            )}>
              {videos.map((video) => (
                    <div key={video.id} className={cn("group flex flex-col items-center", viewMode === 'feed' && "w-full")}>
                        <div dangerouslySetInnerHTML={{ __html: video.embedCode }} />
                        {isAdmin && (
                            <div className={cn("w-full mt-2", viewMode === 'feed' && "max-w-sm")}>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="w-full text-xs" disabled={isProcessing === video.id}>
                                        {isProcessing === video.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Trash2 className="mr-2 h-3 w-3" />}
                                        Eliminar (Admin)
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>¿Confirmar eliminación (Admin)?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Estás a punto de eliminar este video permanentemente. Esta acción no se puede deshacer.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteVideo(video.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )}
                    </div>
                  ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <TikTokIcon className="mx-auto h-12 w-12 mb-4" />
              <p>Aún no se han añadido videos de TikTok para este perfil.</p>
              <p className="text-sm mt-2">¡Sé el primero en sugerir uno!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
