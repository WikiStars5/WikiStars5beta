"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, PlusCircle, Send, Loader2, Grid3x3, RectangleHorizontal } from 'lucide-react';
import type { Figure, InstagramPost } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, addDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '../shared/DatePicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

declare global {
    interface Window {
        instgrm?: {
            Embeds: {
                process: () => void;
            };
        };
    }
}

interface FigureInstagramPostsProps {
  figure: Figure;
}

const getUsernameFromUrl = (url: string): string | null => {
    if (!url) return null;
    try {
        const cleanedUrl = url.trim().replace(/\/+$/, '').replace(/#$/, '');
        const urlParts = cleanedUrl.split('/');
        const username = urlParts.pop(); 
        return username || null;
    } catch (error) {
        return null;
    }
};

const getUsernameFromEmbed = (embedCode: string): string | null => {
    if (!embedCode) return null;
    const match = embedCode.match(/<a [^>]+>Una publicación compartida de [^<]+ \(@([^)]+)\)<\/a>/);
    return match ? match[1] : null;
};


export function FigureInstagramPosts({ figure }: FigureInstagramPostsProps) {
  const { firebaseUser, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = React.useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);
  const [newEmbedCode, setNewEmbedCode] = React.useState('');
  const [newPostDate, setNewPostDate] = React.useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'feed'>('grid');

  React.useEffect(() => {
    const postsRef = collection(db, `figures/${figure.id}/instagramPosts`);
    const unsubscribe = onSnapshot(postsRef, (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstagramPost));
        
        fetchedPosts.sort((a, b) => {
            const dateA = a.postDate ? new Date(a.postDate).getTime() : 0;
            const dateB = b.postDate ? new Date(b.postDate).getTime() : 0;
            return dateB - dateA;
        });

        setPosts(fetchedPosts);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching Instagram posts:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [figure.id]);

  React.useEffect(() => {
    if (posts.length > 0 && typeof window.instgrm?.Embeds?.process === 'function') {
        const timer = setTimeout(() => {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        }, 200); 
        return () => clearTimeout(timer);
    }
  }, [posts, viewMode]); // Re-run when viewMode changes to reprocess embeds

  const handleSuggestPost = async () => {
    if (!newEmbedCode.trim() || !firebaseUser || !newPostDate) {
        toast({ title: "Datos incompletos", description: "Por favor, selecciona una fecha y pega el código de inserción de Instagram.", variant: "destructive" });
        return;
    }

    if (newEmbedCode.includes('data-instgrm-captioned')) {
        toast({
            title: "Publicación con Título no Permitida",
            description: "Por favor, desmarca la opción 'Incluir título' al copiar el código de inserción desde Instagram para añadir solo la foto.",
            variant: "destructive",
            duration: 8000,
        });
        return;
    }
    
    const officialInstagramUrl = figure.socialLinks?.instagram;
    if (!officialInstagramUrl) {
      toast({ title: "Falta el Instagram Oficial", description: "Añade el enlace de Instagram del perfil en la sección 'Información' antes de sugerir fotos.", variant: "destructive", duration: 8000 });
      return;
    }

    const officialUsername = getUsernameFromUrl(officialInstagramUrl);
    const embedUsername = getUsernameFromEmbed(newEmbedCode);

    if (!officialUsername) {
       toast({ title: "URL de Instagram no válida", description: "El enlace guardado en el perfil no es válido. Edítalo en la sección 'Información'.", variant: "destructive", duration: 8000 });
       return;
    }

    if (!embedUsername) {
       toast({ title: "No se pudo verificar el autor", description: "No se pudo encontrar el nombre de usuario en el código de inserción.", variant: "destructive", duration: 8000 });
       return;
    }
    
    if (officialUsername.toLowerCase() !== embedUsername.toLowerCase()) {
        toast({ title: "Cuenta Incorrecta", description: `Solo puedes añadir publicaciones de la cuenta oficial: @${officialUsername}`, variant: "destructive", duration: 8000 });
        return;
    }


    setIsSubmitting(true);
    try {
        const postsRef = collection(db, `figures/${figure.id}/instagramPosts`);
        
        const newPostData: Partial<InstagramPost> = {
            embedCode: newEmbedCode.trim(),
            postDate: newPostDate.toISOString(),
            submittedBy: firebaseUser.uid,
            submittedAt: serverTimestamp() as Timestamp,
            reportedBy: [],
        };
        
        await addDoc(postsRef, newPostData as any);

        toast({ title: "¡Publicación añadida!", description: "Gracias por tu contribución." });
        setNewEmbedCode('');
        setNewPostDate(undefined);
        setIsSuggestDialogOpen(false);
    } catch (error: any) {
        toast({ title: "Error", description: `No se pudo añadir la publicación. ${error.message}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'feed' : 'grid');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return null;
    }
  };

  return (
    <>
      <Card className="border border-white/20 bg-black">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
              <CardTitle className="flex items-center gap-2">
                  <Camera />
                  Fotos (Instagram)
              </CardTitle>
              <CardDescription>
                  Publicaciones de Instagram relacionadas con {figure.name}.
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
                          <DialogTitle>Sugerir una Publicación de Instagram</DialogTitle>
                          <DialogDescription>
                              Abre Instagram, ve a la publicación, haz clic en los tres puntos, selecciona "Insertar", desmarca "Incluir título" y copia el código.
                          </DialogDescription>
                      </DialogHeader>
                       <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="post-date">Fecha de Publicación *</Label>
                              <DatePicker date={newPostDate} onDateChange={setNewPostDate} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="embed-code">Código de Inserción *</Label>
                              <Textarea 
                                  id="embed-code"
                                  value={newEmbedCode}
                                  onChange={(e) => setNewEmbedCode(e.target.value)}
                                  placeholder='<blockquote class="instagram-media" ...> ... </blockquote>'
                                  rows={8}
                              />
                            </div>
                      </div>
                      <DialogFooter>
                          <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                          <Button type="button" onClick={handleSuggestPost} disabled={isSubmitting || !newPostDate || !newEmbedCode.trim()}>
                              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                              Añadir Publicación
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
          ) : posts.length > 0 ? (
            <div className={cn(
                viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1"
                : "w-full max-w-md mx-auto space-y-8"
            )}>
                {posts.map((post) => (
                    <div 
                      key={post.id} 
                      className={cn(
                        "relative group w-full bg-black rounded-lg border border-transparent",
                        viewMode === 'grid' && "aspect-square overflow-hidden"
                      )}
                    >
                       <div 
                        className={cn(
                          viewMode === 'grid' && "transform scale-125 -translate-y-[10%]"
                        )}
                        dangerouslySetInnerHTML={{ __html: post.embedCode }} 
                       />
                       {viewMode === 'feed' && post.postDate && (
                           <p className="text-center text-xs text-muted-foreground mt-2 pb-2">
                               {formatDate(post.postDate)}
                           </p>
                       )}
                   </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <Camera className="mx-auto h-12 w-12 mb-4" />
              <p>Aún no se han añadido fotos de Instagram para este perfil.</p>
              <p className="text-sm mt-2">¡Sé el primero en sugerir una!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
