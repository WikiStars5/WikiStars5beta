

"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, PlusCircle, Send, Loader2, Grid3x3, RectangleHorizontal, Smile, MessageSquare } from 'lucide-react';
import type { Figure, InstagramPost, EmotionKey, GenericEmotionVote, EmotionVote } from '@/lib/types';
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
import { PerceptionEmotions } from './PerceptionEmotions';
import Image from 'next/image';
import { voteForInstagramPostEmotion } from '@/lib/placeholder-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';


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
        // Clean up the URL: remove hash, trailing slashes.
        const cleanedUrl = url.trim().split('#')[0].replace(/\/+$/, '');
        const urlObj = new URL(cleanedUrl);
        const pathParts = urlObj.pathname.split('/');
        
        // The first part of the path is usually the username (e.g., /username/p/postid)
        if (pathParts.length > 1 && pathParts[1]) {
            return pathParts[1];
        }
        return null;
    } catch (error) {
        console.error("Error parsing username from URL:", error);
        return null;
    }
};

const getUsernameFromEmbedCode = (embedCode: string): string | null => {
    if (!embedCode) return null;

    // Pattern 1: Look for the username in the final link text `<a>...(@username)</a>`
    const textMatch = embedCode.match(/<a [^>]+>Una publicación compartida de [^<]+ \((@([^)]+))\)<\/a>/);
    if (textMatch && textMatch[2]) {
      return textMatch[2];
    }
    
    // Pattern 2: Look for the username in the permalink URL: `data-instgrm-permalink="..."`
    const permalinkMatch = embedCode.match(/data-instgrm-permalink="https?:\/\/www\.instagram\.com\/p\/[^/]+\/\?utm_source=ig_embed/);
    if (permalinkMatch) {
         // This permalink does not contain the username, but the final text link does. Let's try that one again.
         const lastLinkMatch = embedCode.match(/<a href="https:\/\/www\.instagram\.com\/[^/]+\/[^/]+\/"[^>]+>Una publicación compartida de .* \(@(.*)\)<\/a>/);
         if (lastLinkMatch && lastLinkMatch[1]) {
             return lastLinkMatch[1];
         }
    }

    // Pattern 3: A more direct regex for the final `<a>` tag's content
    const finalAnchorMatch = embedCode.match(/<a [^>]*target="_blank"[^>]*>Una publicación compartida de .* \(@([^)]+)\)<\/a>/);
    if (finalAnchorMatch && finalAnchorMatch[1]) {
        return finalAnchorMatch[1];
    }

    // Fallback: extract from the `cite` attribute of the blockquote in older embeds.
    const citeMatch = embedCode.match(/<blockquote class="instagram-media" data-instgrm-permalink="https:\/\/www\.instagram\.com\/([^/]+)\//);
    if (citeMatch && citeMatch[1]) {
        return citeMatch[1];
    }

    console.warn("Could not extract username from Instagram embed code with any known pattern.");
    return null;
};


const EMOTION_REACTION_CONFIG: Record<EmotionKey, { label: string; imageUrl: string; color: string }> = {
  alegria: { label: 'Alegre', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Falegria.gif?alt=media&token=ae532025-03c5-45a9-97d2-d475235bd74e', color: 'text-yellow-500' },
  envidia: { label: 'Envidia', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5', color: 'text-green-500' },
  tristeza: { label: 'Triste', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Ftrizteza-min.gif?alt=media&token=f9bc3bbf-eba1-4249-8c4b-128d56e4a6f0', color: 'text-blue-500' },
  miedo: { label: 'Miedo', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985', color: 'text-purple-500' },
  desagrado: { label: 'Desagrado', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb', color: 'text-lime-500' },
  furia: { label: 'Enfadado', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/gif%2Ffuria.gif?alt=media&token=18d1c677-2291-45b0-8001-99a1e5df6859', color: 'text-red-500' },
};


export function FigureInstagramPosts({ figure }: FigureInstagramPostsProps) {
  const { firebaseUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = React.useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);
  const [newEmbedCode, setNewEmbedCode] = React.useState('');
  const [newPostDate, setNewPostDate] = React.useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'feed'>('grid');
  const [userVotes, setUserVotes] = React.useState<Map<string, EmotionKey>>(new Map());
  const [openCollapsibleId, setOpenCollapsibleId] = React.useState<string | null>(null);

  React.useEffect(() => {
      // Standardized storage key for user votes
      const storageKey = `wikistars5-emotions-${firebaseUser?.uid}`;
      if (firebaseUser) {
          const storedVotes: EmotionVote[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const itemVotes = storedVotes.filter(v => v.itemId !== undefined);
          setUserVotes(new Map(itemVotes.map(v => [v.itemId, v.emotion])));
      }
  }, [firebaseUser]);

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
  }, [posts, viewMode]);

  const handleSuggestPost = async () => {
    if (!newEmbedCode.trim() || !firebaseUser || !newPostDate) {
        toast({ title: "Datos incompletos", description: "Por favor, selecciona una fecha y pega el código de inserción de Instagram.", variant: "destructive" });
        return;
    }
    
    if (newEmbedCode.includes('data-instgrm-captioned')) {
      toast({
        title: 'Título Incluido',
        description: 'Por favor, asegúrate de desmarcar la casilla "Incluir título" en Instagram antes de copiar el código.',
        variant: 'destructive',
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
    const embedUsername = getUsernameFromEmbedCode(newEmbedCode);

    if (!officialUsername) {
       toast({ title: "URL de Instagram no válida", description: "El enlace guardado en el perfil no es válido. Edítalo en la sección 'Información'.", variant: "destructive", duration: 8000 });
       return;
    }

    if (!embedUsername) {
       toast({ title: "No se pudo verificar el autor", description: "No se pudo encontrar el nombre de usuario en el código de inserción. Asegúrate de que el código sea correcto.", variant: "destructive", duration: 8000 });
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
            perceptionCounts: {},
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
  
  const handleVoteUpdate = (postId: string, newEmotion: EmotionKey | null) => {
    setUserVotes(prev => {
        const newMap = new Map(prev);
        if (newEmotion) {
            newMap.set(postId, newEmotion);
        } else {
            newMap.delete(postId);
        }
        return newMap;
    });
    setOpenCollapsibleId(null);
  }

  const renderReactionButton = (post: InstagramPost) => {
    const userVote = userVotes.get(post.id);
    if (userVote) {
      const { imageUrl } = EMOTION_REACTION_CONFIG[userVote];
      return (
        <span className="flex items-center gap-1.5">
          <Image src={imageUrl} alt="" width={20} height={20} className="w-5 h-5" unoptimized />
        </span>
      );
    }
    return (
      <>
        <Smile className="mr-2 h-4 w-4" /> Reaccionar
      </>
    );
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
                                  placeholder='&lt;blockquote class="instagram-media" ...&gt; ... &lt;/blockquote&gt;'
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
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                : "w-full max-w-sm mx-auto space-y-8"
            )}>
                {posts.map((post) => (
                    <Collapsible 
                        key={post.id}
                        open={openCollapsibleId === post.id}
                        onOpenChange={(isOpen) => setOpenCollapsibleId(isOpen ? post.id : null)}
                        className="border border-border rounded-lg overflow-hidden bg-black"
                    >
                        <div
                            className={cn(
                                "instagram-post-container",
                                viewMode === 'grid' && "h-[450px]"
                            )}
                            dangerouslySetInnerHTML={{ __html: post.embedCode }}
                        />
                      <div className="p-2 bg-card border-t">
                         {viewMode === 'feed' && post.postDate && (
                           <p className="text-xs text-muted-foreground px-2 pb-2">{formatDate(post.postDate)}</p>
                         )}
                         <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                                 <Button variant="ghost" size="sm" className="text-xs flex-1 justify-center">
                                    {renderReactionButton(post)}
                                </Button>
                            </CollapsibleTrigger>
                             <Button variant="ghost" size="sm" className="text-xs flex-1 justify-center" disabled>
                                  <MessageSquare className="mr-2 h-4 w-4" /> Comentar
                             </Button>
                         </div>
                      </div>
                      <CollapsibleContent>
                        <div className="p-2 border-t">
                             <PerceptionEmotions
                                figureId={figure.id}
                                figureName={figure.name} // Pass figure name for consistency
                                perceptionCounts={post.perceptionCounts || {}}
                                targetType="instagram"
                                targetId={post.id}
                                onVote={(emotion) => handleVoteUpdate(post.id, emotion)}
                            />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
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

    