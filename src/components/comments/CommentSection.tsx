
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, type Timestamp } from 'firebase/firestore';
import type { CommentData } from '@/lib/types';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommentSectionProps {
  figureId: string;
  figureName: string;
}

export function CommentSection({ figureId, figureName }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchComments = useCallback(() => {
    if (!figureId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const commentsQuery = query(
      collection(db, 'figure_comments'),
      where('figureId', '==', figureId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeComments = onSnapshot(
      commentsQuery,
      (querySnapshot) => {
        const fetchedComments: CommentData[] = [];
        querySnapshot.forEach((doc) => {
          fetchedComments.push({ id: doc.id, ...doc.data() } as CommentData);
        });
        setComments(fetchedComments);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
        setIsLoading(false);
      }
    );
    return () => unsubscribeComments();
  }, [figureId, toast]);

  useEffect(() => {
    const unsubscribe = fetchComments();
    return () => unsubscribe?.();
  }, [fetchComments]);


  const handleCommentSubmitted = () => {
    // The onSnapshot listener will automatically update the comments list
    // Optionally, could re-trigger fetchComments if not using onSnapshot, but onSnapshot is preferred for real-time.
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="mr-2 h-6 w-6 text-primary" />
          Comentarios y Calificaciones sobre {figureName}
        </CardTitle>
        <CardDescription>
          Comparte tu opinión y califica a esta figura. Los comentarios ayudan a otros a formar una perspectiva.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAuthLoading && authUser && !authUser.isAnonymous && (
          <CommentForm figureId={figureId} onCommentSubmitted={handleCommentSubmitted} />
        )}
        {isAuthLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isLoading && comments.length === 0 && (
          <div className="text-center py-6">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Cargando comentarios...</p>
          </div>
        )}
        {!isLoading && comments.length === 0 && (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Todavía no hay comentarios para {figureName}.</p>
            {authUser && !authUser.isAnonymous 
              ? <p className="text-sm text-muted-foreground">¡Sé el primero en dejar tu opinión y calificación!</p>
              : <p className="text-sm text-muted-foreground">Inicia sesión para ser el primero.</p>
            }
          </div>
        )}
        {!isLoading && comments.length > 0 && (
          <div className="space-y-1">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                currentUserId={authUser?.uid}
                // Pass handlers for like/dislike/delete later
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
