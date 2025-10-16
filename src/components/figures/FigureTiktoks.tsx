
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Send, Loader2, Flag, Check, Trash2, ExternalLink, VideoOff, Grid3x3, RectangleHorizontal } from 'lucide-react';
import type { Figure, TiktokVideo } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, runTransaction, onSnapshot, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Textarea } from '../ui/textarea';
import TikTokEmbed from './TikTokEmbed';

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2859 3333" {...props} shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd">
        <path d="M2081 0c55 473 319 755 778 785v532c-266 26-499-61-770-225v995c0 1264-1378 1659-1932 753-356-583-138-1606 1004-1647v561c-87 14-180 36-265 65-254 86-458 249-458 522 0 314 252 566 566 566 314 0 566-252 566-566v-1040h550v-550h-550z" fill="currentColor"/>
    </svg>
);

const getTikTokVideoIdFromEmbed = (embedCode: string): string | null => {
    if (!embedCode) return null;
    const match = embedCode.match(/data-video-id="(\d+)"/);
    return match ? match[1] : null;
};

const getUsernameFromTikTokUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        // URL format is tiktok.com/@username
        const usernamePart = pathParts.find(part => part.startsWith('@'));
        return usernamePart ? usernamePart.substring(1) : null;
    } catch (e) {
        return null;
    }
};

const getUsernameFromEmbedCode = (embedCode: string): string | null => {
    if (!embedCode) return null;
    // The username is in the `cite` attribute of the blockquote
    const match = embedCode.match(/cite="https?:\/\/www.tiktok.com\/@([^/]+)\/video\/\d+"/);
    return match ? match[1] : null;
};


interface FigureTiktoksProps {
  figure: Figure;
}

export function FigureTiktoks({ figure }: FigureTiktoksProps) {
  const { firebaseUser, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = React.useState<TiktokVideo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);
  const [newEmbedCode, setNewEmbedCode] = React.useState('');
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
  
  const handleOpenSuggestDialog = () => {
    if (!figure.socialLinks?.tiktok) {
        toast({
            title: "Falta la cuenta de TikTok Oficial",
            description: "Para sugerir un video, primero debe añadirse el enlace del perfil de TikTok oficial en la sección 'Información'.",
            variant: "destructive",
            duration: 8000,
        });
        return;
    }
    setIsSuggestDialogOpen(true);
  };

  const handleSuggestVideo = async () => {
    if (!newEmbedCode.trim() || !firebaseUser) {
        toast({ title: "Datos incompletos", description: "Por favor, pega el código de inserción de TikTok.", variant: "destructive" });
        return;
    }

    if (!newEmbedCode.includes('class="tiktok-embed"')) {
        toast({ title: "Código no válido", description: "Asegúrate de copiar el código de inserción completo de TikTok.", variant: "destructive" });
        return;
    }

    const officialUsername = getUsernameFromTikTokUrl(figure.socialLinks?.tiktok || '');
    const embedUsername = getUsernameFromEmbedCode(newEmbedCode);

    if (!officialUsername) {
        toast({ title: "URL Oficial no Válida", description: "El enlace de TikTok en el perfil de la figura no es válido. Por favor, edítalo.", variant: "destructive" });
        return;
    }
    
    if (!embedUsername) {
        toast({ title: "Verificación Fallida", description: "No se pudo encontrar el nombre de usuario en el código de inserción. Asegúrate de que el código sea correcto.", variant: "destructive" });
        return;
    }
    
    if (officialUsername.toLowerCase() !== embedUsername.toLowerCase()) {
        toast({ title: "Cuenta Incorrecta", description: `Solo puedes añadir videos de la cuenta oficial: @${officialUsername}`, variant: "destructive", duration: 8000 });
        return;
    }


    setIsSubmitting(true);

    try {
        const videosRef = collection(db, `figures/${figure.id}/tiktokVideos`);
        
        const newVideoData = {
            embedCode: newEmbedCode.trim(),
            submittedBy: firebaseUser.uid,
            submittedAt: serverTimestamp(),
            reportedBy: [],
        };
        await addDoc(videosRef, newVideoData);

        toast({
            title: "¡TikTok añadido!",
            description: "Gracias por tu contribución.",
        });

        setNewEmbedCode('');
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
                  <Button variant="outline" size="sm" disabled={isAuthLoading} onClick={handleOpenSuggestDialog}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Sugerir
                  </Button>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Sugerir un TikTok</DialogTitle>
                          <DialogDescription>
                              Ve a TikTok, haz clic en "Compartir" y luego en "Insertar", y pega el código aquí.
                          </DialogDescription>
                      </DialogHeader>
                       <div className="grid gap-4 py-4">
                            <Label htmlFor="embed-code">Código de Inserción</Label>
                            <Textarea 
                                id="embed-code"
                                value={newEmbedCode}
                                onChange={(e) => setNewEmbedCode(e.target.value)}
                                placeholder='&lt;blockquote class="tiktok-embed" ...&gt; ... &lt;/blockquote&gt;'
                                rows={6}
                            />
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
            <div className={cn(
                "w-full",
                viewMode === 'grid'
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                : "space-y-8"
            )}>
              {videos.map((video) => {
                  const videoId = getTikTokVideoIdFromEmbed(video.embedCode);
                  if (!videoId) return null;
                  
                  return (
                      <div key={video.id} className="group w-full flex flex-col items-center">
                           <div className={cn(
                                "w-full rounded-lg overflow-hidden bg-black",
                                viewMode === 'grid' ? 'min-h-[400px]' : 'max-w-sm aspect-[9/16] mx-auto'
                            )}>
                              <TikTokEmbed videoId={videoId} />
                         </div>

                         {isAdmin && (
                              <div className="w-full mt-2 max-w-sm">
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
                  )
                })}
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
