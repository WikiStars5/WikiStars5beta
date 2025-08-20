
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessagesSquare, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Figure, Comment as CommentType } from '@/lib/types';
import { addComment, mapDocToComment } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { CommentItem } from './CommentItem';
import { countryCodeToNameMap } from '@/config/countries';

interface CommentSectionProps {
  figure: Figure;
}

export function CommentSection({ figure }: CommentSectionProps) {
  const { user: firestoreUser, firebaseUser, isAnonymous } = useAuth();
  const [commentText, setCommentText] = React.useState('');
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [isPosting, setIsPosting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsLoading(true);
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef, 
      where('figureId', '==', figure.id), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(mapDocToComment);
      setComments(fetchedComments);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [figure.id, toast]);
  
  const getAuthorData = () => {
    if (isAnonymous) {
      const guestUsername = localStorage.getItem('wikistars5-guestUsername') || 'Invitado';
      const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
      const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode') || '';
      return {
        id: firebaseUser?.uid || 'guest-user',
        name: guestUsername,
        photoUrl: null,
        gender: guestGender,
        country: countryCodeToNameMap.get(guestCountryCode) || '',
        countryCode: guestCountryCode,
        isAnonymous: true,
      };
    } else if (firestoreUser && firebaseUser) {
      return {
        id: firebaseUser.uid,
        name: firestoreUser.username,
        photoUrl: firestoreUser.photoURL || null,
        gender: firestoreUser.gender || '',
        country: firestoreUser.country || '',
        countryCode: firestoreUser.countryCode || '',
        isAnonymous: false,
      };
    }
    return null;
  };

  const handlePostComment = async () => {
    const authorData = getAuthorData();
    if (!authorData || !firebaseUser) {
      toast({ title: "Error", description: "Debes estar autenticado para comentar.", variant: "destructive" });
      return;
    }
    if (commentText.trim().length < 3) {
      toast({ title: "Comentario muy corto", description: "Tu comentario debe tener al menos 3 caracteres.", variant: "destructive" });
      return;
    }
    setIsPosting(true);
    try {
      await addComment(figure.id, authorData, commentText.trim());
      setCommentText('');
      toast({ title: "¡Comentario Publicado!", description: "Gracias por tu contribución." });
    } catch (error: any) {
      console.error("Error posting comment: ", error);
      toast({ title: "Error", description: error.message || "No se pudo publicar tu comentario.", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const author = getAuthorData();

  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessagesSquare /> Comentarios y Discusión
        </CardTitle>
        <CardDescription>
          Comparte tu opinión sobre {figure.name}. Sé respetuoso y mantén la conversación constructiva.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 mt-1">
            <AvatarImage src={author?.photoUrl ?? undefined} alt={author?.name} />
            <AvatarFallback>{author?.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-2">
            <Textarea
              placeholder="Escribe tu comentario aquí..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="bg-muted border-border/50 focus:bg-background"
            />
            <div className="flex justify-end">
              <Button onClick={handlePostComment} disabled={isPosting}>
                {isPosting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                Publicar
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando comentarios...</p>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem 
                key={comment.id}
                figure={figure}
                comment={comment}
                currentUserAuth={firebaseUser}
                currentUserProfile={getAuthorData()}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">
              Aún no hay comentarios. ¡Sé el primero en compartir tu opinión!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

    