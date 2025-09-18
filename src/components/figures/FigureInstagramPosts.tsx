
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, PlusCircle, Send, Loader2 } from 'lucide-react';
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


export function FigureInstagramPosts({ figure }: FigureInstagramPostsProps) {
  const { firebaseUser, isAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = React.useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = React.useState(false);
  const [newEmbedCode, setNewEmbedCode] = React.useState('');
  const [newPostDate, setNewPostDate] = React.useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const postsRef = collection(db, `figures/${figure.id}/instagramPosts`);
    const unsubscribe = onSnapshot(postsRef, (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstagramPost));
        
        // Sort posts by postDate in descending order (newest first)
        fetchedPosts.sort((a, b) => {
            if (!a.postDate) return 1;
            if (!b.postDate) return -1;
            return new Date(b.postDate).getTime() - new Date(a.postDate).getTime();
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
  }, [posts]);

  const handleSuggestPost = async () => {
    if (!newEmbedCode.trim() || !firebaseUser || !newPostDate) {
        toast({ title: "Datos incompletos", description: "Por favor, selecciona una fecha y pega el código de inserción de Instagram.", variant: "destructive" });
        return;
    }

    if (!newEmbedCode.includes('class="instagram-media"')) {
        toast({ title: "Código no válido", description: "Asegúrate de copiar el código de inserción completo de Instagram.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    try {
        const postsRef = collection(db, `figures/${figure.id}/instagramPosts`);
        
        const newPostData: Omit<InstagramPost, 'id'> = {
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
          <Dialog open={isSuggestDialogOpen} onOpenChange={setIsSuggestDialogOpen}>
              <Button variant="outline" size="sm" disabled={isAuthLoading} onClick={() => setIsSuggestDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Sugerir
              </Button>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Sugerir una Publicación de Instagram</DialogTitle>
                      <DialogDescription>
                          Selecciona la fecha de la publicación y luego pega el código de inserción.
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {posts.map((post) => (
                    <div key={post.id} className="relative group w-full bg-black rounded-lg overflow-hidden">
                       <div dangerouslySetInnerHTML={{ __html: post.embedCode }} />
                       {post.postDate && (
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
