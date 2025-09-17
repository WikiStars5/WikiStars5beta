
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, PlusCircle, Send, Loader2, Flag, Check, Trash2 } from 'lucide-react';
import type { Figure, YoutubeShort } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, arrayUnion, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

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
        submittedBy: firebaseUser.uid,
        submittedAt: new Date().toISOString(),
        reportedBy: [],
    };

    try {
        const figureRef = doc(db, 'figures', figure.id);
        const figureSnap = await getDoc(figureRef);
        if (!figureSnap.exists()) throw new Error("Figura no encontrada");
        
        const currentShorts: YoutubeShort[] = figureSnap.data().youtubeShorts || [];
        const isDuplicate = currentShorts.some(s => s.videoId === videoId);

        if(isDuplicate) {
            toast({ title: "Video Duplicado", description: "Este video ya ha sido añadido a este perfil.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const newShortWithTimestamp: Omit<YoutubeShort, 'submittedAt'> & { submittedAt: Timestamp } = {
            ...newShort,
            submittedAt: Timestamp.now(),
        }

        await updateDoc(figureRef, {
            youtubeShorts: arrayUnion(newShortWithTimestamp)
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
        const figureSnap = await getDoc(figureRef);
        if (!figureSnap.exists()) throw new Error("Figure not found");

        const currentShorts: YoutubeShort[] = figureSnap.data().youtubeShorts || [];
        const shortIndex = currentShorts.findIndex(s => s.videoId === videoId);
        
        if (shortIndex === -1) throw new Error("Short not found");
        
        const shortToUpdate = currentShorts[shortIndex];
        
        if (shortToUpdate.reportedBy?.includes(firebaseUser.uid)) {
            toast({ title: "Ya has reportado este video", variant: "default" });
            setIsProcessing(null);
            return;
        }

        const updatedReportedBy = [...(shortToUpdate.reportedBy || []), firebaseUser.uid];
        const updatedShort = { ...shortToUpdate, reportedBy: updatedReportedBy };
        
        const updatedShorts = [...currentShorts];
        updatedShorts[shortIndex] = updatedShort;
        
        await updateDoc(figureRef, { youtubeShorts: updatedShorts });
        toast({ title: "Reporte enviado", description: "Gracias por ayudar a mantener la comunidad." });

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
      </CardHeader>
      <CardContent>
        {figure.youtubeShorts && figure.youtubeShorts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {figure.youtubeShorts.map((short, index) => {
               const hasReported = firebaseUser && short.reportedBy?.includes(firebaseUser.uid);
               const reportCount = short.reportedBy?.length || 0;
               const hasReachedThreshold = reportCount >= REPORT_THRESHOLD;
               
               return (
                  <div key={index} className="group flex flex-col gap-2">
                    <a href={`https://www.youtube.com/shorts/${short.videoId}`} target="_blank" rel="noopener noreferrer" className="block w-full" style={{aspectRatio: '9/16'}}>
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
                                    variant={hasReported ? "secondary" : "outline"} 
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
  );
}
