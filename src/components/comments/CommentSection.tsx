
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessagesSquare, Send, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Figure, Comment as CommentType } from '@/lib/types';
import { addComment, mapDocToComment } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { CommentItem } from './CommentItem';
import { GuestProfileSetup } from './GuestProfileSetup';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { countryCodeToNameMap } from '@/config/countries';

interface CommentSectionProps {
  figure: Figure;
}

const MAX_COMMENT_LENGTH = 1000;
const INITIAL_COMMENTS_TO_SHOW = 5;

export function CommentSection({ figure }: CommentSectionProps) {
  const { user: firestoreUser, firebaseUser, isAnonymous, isLoading: isAuthLoading } = useAuth();
  const [commentText, setCommentText] = React.useState('');
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [isPosting, setIsPosting] = React.useState(false);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [guestProfileExists, setGuestProfileExists] = React.useState(false);
  const [showGuestProfileForm, setShowGuestProfileForm] = React.useState(false);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const { toast } = useToast();

  const checkGuestProfile = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const guestName = localStorage.getItem('wikistars5-guestUsername');
      setGuestProfileExists(!!guestName);
    }
  }, []);

  React.useEffect(() => {
    setIsLoadingComments(true);
    const commentsPath = `figures/${figure.id}/comments`;
    const commentsRef = collection(db, commentsPath);
    const q = query(
      commentsRef, 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(mapDocToComment);
      setComments(fetchedComments);
      setIsLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
      setIsLoadingComments(false);
    });

    return () => unsubscribe();
  }, [figure.id, toast]);
  

  React.useEffect(() => {
    if (!isAuthLoading) {
      if (isAnonymous) {
        checkGuestProfile();
      }
    }
  }, [isAnonymous, checkGuestProfile, isAuthLoading]);


  const getAuthorData = () => {
    if (!firebaseUser) return null;

    if (isAnonymous) {
      if (!guestProfileExists) return null;
      const guestUsername = localStorage.getItem('wikistars5-guestUsername') || 'Invitado';
      const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
      const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode') || '';
      
      return {
        id: firebaseUser.uid,
        name: guestUsername,
        photoUrl: null,
        gender: guestGender,
        country: countryCodeToNameMap.get(guestCountryCode) || '',
        countryCode: guestCountryCode,
        isAnonymous: true,
      };
    } else if (firestoreUser) {
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
    if (commentText.length > MAX_COMMENT_LENGTH) {
      toast({
          title: "Comentario demasiado largo",
          description: `Tu comentario no puede exceder los ${MAX_COMMENT_LENGTH} caracteres.`,
          variant: "destructive"
      });
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

  const handleGuestProfileSaved = () => {
    checkGuestProfile(); 
    setShowGuestProfileForm(false);
  };

  const renderCommentInput = () => {
    if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center p-4 bg-muted rounded-md text-sm text-muted-foreground h-24">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        </div>
      );
    }
  
    if (isAnonymous && !guestProfileExists) {
        if (showGuestProfileForm) {
            return <GuestProfileSetup onProfileSave={handleGuestProfileSaved} />;
        }
        return (
            <div className="text-center p-4 border-2 border-dashed rounded-lg">
                <p className="mb-4 text-muted-foreground">Para comentar, primero debes crear un perfil de invitado.</p>
                <Button onClick={() => setShowGuestProfileForm(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear usuario invitado
                </Button>
            </div>
        );
    }
    
    const author = getAuthorData();
    if (author) {
      return (
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 mt-1">
            <AvatarImage src={correctMalformedUrl(author.photoUrl)} alt={author.name} />
            <AvatarFallback>{author.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-2">
            <Textarea
              placeholder="Escribe tu comentario aquí..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="bg-muted border-border/50 focus:bg-background"
              maxLength={MAX_COMMENT_LENGTH}
            />
            <div className="flex justify-between items-center">
              <p className={cn(
                "text-xs text-muted-foreground",
                commentText.length > MAX_COMMENT_LENGTH && "text-destructive"
              )}>
                {commentText.length} / {MAX_COMMENT_LENGTH}
              </p>
              <Button onClick={handlePostComment} disabled={isPosting}>
                {isPosting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Fallback while guest profile is being set
    return (
        <div className="flex items-center justify-center p-4 bg-muted rounded-md text-sm text-muted-foreground h-24">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        </div>
    );
  };

  const commentsToShow = showAllComments ? comments : comments.slice(0, INITIAL_COMMENTS_TO_SHOW);

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
        
        {renderCommentInput()}

        <Separator />

        <div className="space-y-6">
          {isLoadingComments ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Cargando comentarios...</p>
            </div>
          ) : comments.length > 0 ? (
            <>
              {commentsToShow.map((comment) => (
                <CommentItem 
                  key={comment.id}
                  figure={figure}
                  comment={comment}
                  parentPath={`figures/${figure.id}/comments`}
                />
              ))}
              {comments.length > INITIAL_COMMENTS_TO_SHOW && (
                 <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => setShowAllComments(!showAllComments)}>
                        {showAllComments ? 'Mostrar menos comentarios' : `Ver los ${comments.length - INITIAL_COMMENTS_TO_SHOW} comentarios restantes`}
                    </Button>
                </div>
              )}
            </>
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
