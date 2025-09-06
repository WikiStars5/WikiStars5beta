
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessagesSquare, UserPlus } from 'lucide-react';
import type { Figure, Comment as CommentType } from '@/lib/types';
import { mapDocToComment } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { CommentItem } from './CommentItem';
import { Separator } from '../ui/separator';

interface CommentSectionProps {
  figure: Figure;
  highlightedCommentId?: string | null;
}

const INITIAL_COMMENTS_TO_SHOW = 5;

export function CommentSection({ figure, highlightedCommentId }: CommentSectionProps) {
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const { toast } = useToast();

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
  

  const renderCommentInput = () => {
      return (
          <div className="text-center p-4 border-2 border-dashed rounded-lg bg-muted/50">
              <p className="mb-4 text-muted-foreground font-medium">La creación de cuentas y los comentarios están deshabilitados temporalmente.</p>
          </div>
      );
  };

  const commentsToShow = showAllComments ? comments : comments.slice(0, INITIAL_COMMENTS_TO_SHOW);

  return (
    <>
      <Card className="border border-white/20 bg-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare /> Opiniones y Discusión
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
                    highlightedCommentId={highlightedCommentId}
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
                Aún no hay opiniones.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
