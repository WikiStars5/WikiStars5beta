
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { FigureComment } from '@/lib/types';
import { getCommentsForFigure, getFigureFromFirestore } from '@/lib/placeholder-data';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/shared/StarRating';
import { Loader2, MessageCircle } from 'lucide-react';

interface CommentSectionProps {
  figureId: string;
  figureName: string;
  currentUser: User | null;
  initialAverageRating?: number;
  initialTotalRatings?: number;
}

export function CommentSection({
  figureId,
  figureName,
  currentUser,
  initialAverageRating = 0,
  initialTotalRatings = 0,
}: CommentSectionProps) {
  const [comments, setComments] = useState<FigureComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [totalRatings, setTotalRatings] = useState(initialTotalRatings);

  const fetchCommentsAndRating = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedComments = await getCommentsForFigure(figureId);
      setComments(fetchedComments.sort((a, b) => {
        const dateA = a.timestamp?.seconds ? new Date(a.timestamp.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.timestamp?.seconds ? new Date(b.timestamp.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }));

      // Fetch the figure again to get the latest average rating
      const figureData = await getFigureFromFirestore(figureId);
      if (figureData) {
        setAverageRating(figureData.averageRating || 0);
        setTotalRatings(figureData.totalRatings || 0);
      }
    } catch (error) {
      console.error("Error fetching comments or figure rating:", error);
    } finally {
      setIsLoading(false);
    }
  }, [figureId]);

  useEffect(() => {
    fetchCommentsAndRating();
  }, [fetchCommentsAndRating]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-xl font-headline flex items-center">
                <MessageCircle className="mr-2 h-6 w-6 text-primary" />
                Comentarios y Calificaciones de {figureName}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {totalRatings > 0 ? (
                <>
                    <StarRating rating={averageRating} size={20} readOnly />
                    <span className="font-semibold text-lg text-foreground">
                    {averageRating.toFixed(1)}
                    </span>
                    <span>({totalRatings} {totalRatings === 1 ? 'valoración' : 'valoraciones'})</span>
                </>
                ) : (
                <span>Aún no hay valoraciones.</span>
                )}
            </div>
        </div>
        <CardDescription>
          Deja tu comentario y califica a esta figura. Tu opinión es importante.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CommentForm
          figureId={figureId}
          currentUser={currentUser}
          onCommentSubmitted={fetchCommentsAndRating} // Refresh comments and rating on new submission
        />
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Cargando comentarios...</p>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold mb-2">{comments.length} {comments.length === 1 ? "Comentario" : "Comentarios"}</h3>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              Sé el primero en dejar un comentario y calificar a {figureName}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
