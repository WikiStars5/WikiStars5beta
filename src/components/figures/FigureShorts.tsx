
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, PlusCircle, Send, Loader2, Flag, Check, Trash2, ExternalLink, VideoOff, Grid3x3, RectangleHorizontal } from 'lucide-react';
import type { Figure, YoutubeShort } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, arrayUnion, Timestamp, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';


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
    // Regex to check for a valid 11-character YouTube ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
        return url.trim();
    }
    return null;
}

const REPORT_THRESHOLD = 10;

interface FigureShortsProps {
  figure: Figure;
}

export function FigureShorts({ figure }: FigureShortsProps) {
  const { firebaseUser, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);
  const [newShortUrl, setNewShortUrl] = React.useState('');
  const [newShortTitle, setNewShortTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
  const [unavailableVideos, setUnavailableVideos] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<'grid' | 'feed'>('grid');


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

    try {
        const figureRef = doc(db, 'figures', figure.id);
        const figureSnap = await getDoc(figureRef);
        if (!figureSnap.exists()) throw new Error("Figura no encontrada");
        
        const currentShorts: YoutubeShort[] = figureSnap.data().youtubeShorts || [];
        const isDuplicate = currentShorts.some(s => s.videoId === videoId);

        if(isDuplicate) {
            toast({ title: "Video Duplicado", description: "Este video ya ha sido añadido a este perfil.", variant: "default" });
            setIsSubmitting(false);
            return;
        }
        
        const newShort: Omit<YoutubeShort, 'submittedAt'> & { submittedAt: Timestamp } = {
            title: newShortTitle.trim(),
            videoId: videoId,
            submittedBy: firebaseUser.uid,
            submittedAt: Timestamp.now(),
            reportedBy: [],
        };

        await updateDoc(figureRef, {
            youtubeShorts: arrayUnion(newShort)
        });

        toast({
            title: "¡Video añadido!",
            description: "Gracias por tu contribución.",
        });

        setNewShortTitle('');
        setNewShortUrl('');
        setIsSuggestDialogOpen(false);

    } catch (error: any) {
        console.error("Error suggesting short:", error);
        toast({ title: "Error", description: `No se pudo añadir el video. ${error.message}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleReportShort = async (videoId: string) => {
    if (!firebaseUser || isProcessing === videoId) return;

    setIsProcessing(videoId);
    
    try {
        const figureRef = doc(db, 'figures', figure.id);
        
        await runTransaction(db, async (transaction) => {
            const figureSnap = await transaction.get(figureRef);
            if (!figureSnap.exists()) throw new Error("Figure not found");

            const currentShorts: YoutubeShort[] = figureSnap.data().youtubeShorts || [];
            const shortIndex = currentShorts.findIndex(s => s.videoId === videoId);
            
            if (shortIndex === -1) throw new Error("Short not found");
            
            const shortToUpdate = currentShorts[shortIndex];
            
            if (shortToUpdate.reportedBy?.includes(firebaseUser.uid)) {
                toast({ title: "Ya has reportado este video", variant: "default" });
                return;
            }

            const updatedReportedBy = [...(shortToUpdate.reportedBy || []), firebaseUser.uid];
            const updatedShort = { ...shortToUpdate, reportedBy: updatedReportedBy };
            
            const updatedShorts = [...currentShorts];
            updatedShorts[shortIndex] = updatedShort;

            transaction.update(figureRef, { youtubeShorts: updatedShorts });
            toast({ title: "Reporte enviado", description: "Gracias por ayudar a mantener la comunidad." });
        });

    } catch (error: any) {
        console.error("Error reporting short:", error);
        toast({ title: "Error", description: `No se pudo enviar el reporte. ${error.message}`, variant: "destructive" });
    } finally {
        setIsProcessing(null);
    }
  };

  const handleDeleteShort = async (videoId: string) => {
    if (isProcessing === videoId) return;
    setIsProcessing(videoId);

    try {
        const figureRef = doc(db, 'figures', figure.id);
        const figureSnap = await getDoc(figureRef);
        if (!figureSnap.exists()) throw new Error("Figure not found");
        
        const currentShorts: YoutubeShort[] = figureSnap.data().youtubeShorts || [];
        const updatedShorts = currentShorts.filter(s => s.videoId !== videoId);
        
        await updateDoc(figureRef, { youtubeShorts: updatedShorts });
        toast({ title: "Video Eliminado", description: "El video ha sido eliminado." });

    } catch (error: any) {
        console.error("Error deleting short:", error);
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
                  <Youtube />
                  Shorts
              </CardTitle>
              <CardDescription>
                  Videos cortos relacionados con {figure.name}.
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
                          <DialogTitle>Sugerir un YouTube Short</DialogTitle>
                          <DialogDescription>
                              Añade un video corto relevante para {figure.name}.
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
                              Añadir Video
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {figure.youtubeShorts && figure.youtubeShorts.length > 0 ? (
            <div className={cn(
                viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "w-full max-w-md mx-auto flex flex-col gap-8 no-scrollbar"
            )}>
              {figure.youtubeShorts.map((short) => {
                const hasReported = firebaseUser && short.reportedBy?.includes(firebaseUser.uid);
                const reportCount = short.reportedBy?.length || 0;
                const hasReachedThreshold = reportCount >= REPORT_THRESHOLD;
                const embedUrl = `https://www.youtube.com/embed/${short.videoId}?rel=0&modestbranding=1&controls=1&showinfo=0&autoplay=0`;
                
                const isUnavailable = unavailableVideos.has(short.videoId);

                return (
                    <div key={short.videoId} className={cn("group flex flex-col", viewMode === 'feed' && "w-full h-[80vh]")}>
                        <div className={cn(
                            "relative w-full flex-grow overflow-hidden rounded-lg bg-black",
                            viewMode === 'grid' ? 'aspect-video' : ''
                        )}>
                          <iframe
                              id={`ytplayer-${short.videoId}`}
                              src={embedUrl}
                              title={short.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                              onError={() => {
                                  setUnavailableVideos(prev => new Set(prev.add(short.videoId)));
                              }}
                          ></iframe>
                          {isUnavailable && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center text-white p-2">
                                  <VideoOff className="h-8 w-8 mb-2" />
                                  <p className="text-xs font-semibold">Video no disponible</p>
                            </div>
                          )}
                      </div>
                      
                      <div className="flex items-start justify-between gap-2 mt-2">
                        <p className="text-sm font-semibold truncate flex-grow pr-2">{short.title}</p>
                        <Button asChild variant="link" size="sm" className="w-auto text-white text-xs font-semibold p-0 h-auto flex-shrink-0">
                            <a href={`https://www.youtube.com/watch?v=${short.videoId}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1 h-3 w-3"/>
                                Ver
                            </a>
                        </Button>
                      </div>

                      {isAdmin ? (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="w-full text-xs" disabled={isProcessing === short.videoId}>
                                    {isProcessing === short.videoId ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Trash2 className="mr-2 h-3 w-3" />}
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
                                    <AlertDialogAction onClick={() => handleDeleteShort(short.videoId)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      ) : hasReachedThreshold ? (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="w-full text-xs" disabled={isProcessing === short.videoId}>
                                    {isProcessing === short.videoId ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Trash2 className="mr-2 h-3 w-3" />}
                                    Eliminar Video
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Este video ha sido reportado por la comunidad. Al hacer clic en "Eliminar", será borrado permanentemente. Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteShort(short.videoId)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      ) : (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button 
                                      variant={hasReported ? "secondary" : "destructive"} 
                                      size="sm" 
                                      className="w-full text-xs" 
                                      disabled={isAuthLoading || isProcessing === short.videoId || hasReported}
                                  >
                                      {isProcessing === short.videoId ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : hasReported ? <Check className="mr-2 h-3 w-3"/> : <Flag className="mr-2 h-3 w-3" />}
                                      {hasReported ? "Reportado" : "Reportar"}
                                      {!hasReported && ` (${reportCount}/${REPORT_THRESHOLD})`}
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>¿Reportar este video?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Estás a punto de reportar este video como "no relacionado con el perfil". Si suficientes usuarios lo hacen, el video podrá ser eliminado por la comunidad.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleReportShort(short.videoId)} className="bg-destructive hover:bg-destructive/90">Reportar</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )}
                    </div>
                  );
              })}
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
    </>
  );
}
