
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/shared/StarRating';
import { type Review, type StarValue, type Figure } from '@/lib/types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '@/lib/firebase';
import { Loader2, Send, MessageSquare, LogIn } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { CommentItem } from './CommentItem';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

const addReviewCallable = httpsCallable<{ characterId: string; comment: string; rating: StarValue }, { success: boolean; reviewId: string }>(getFunctions(app, 'us-central1'), 'addReview');

interface CommentSectionProps {
  figure: Figure;
}

export function CommentSection({ figure }: CommentSectionProps) {
  const { firebaseUser, user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [commentText, setCommentText] = React.useState('');
  const [rating, setRating] = React.useState<StarValue>(0 as StarValue);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = React.useState(true);

  React.useEffect(() => {
    // Listen for real-time updates to reviews
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('characterId', '==', figure.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              // Ensure createdAt is a Timestamp for consistent handling
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : new Timestamp(0, 0)
          } as Review
      });
      setReviews(fetchedReviews);
      setIsLoadingReviews(false);
    }, (error) => {
      console.error("Error fetching reviews: ", error);
      toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
      setIsLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [figure.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión para dejar un comentario." });
      return;
    }
    if (commentText.trim().length === 0) {
      toast({ title: "Comentario Vacío", description: "Por favor, escribe algo antes de enviar.", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "Calificación Requerida", description: "Por favor, selecciona una calificación de estrellas.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addReviewCallable({
        characterId: figure.id,
        comment: commentText,
        rating: rating,
      });

      setCommentText('');
      setRating(0 as StarValue);
      toast({ title: "¡Gracias!", description: "Tu comentario ha sido publicado." });

    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error al Publicar",
        description: error.message || "No se pudo guardar tu comentario. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReviewList = () => {
    if (isLoadingReviews && reviews.length === 0) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (reviews.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="font-semibold">Aún no hay comentarios para esta figura.</p>
          <p className="text-sm">¡Sé el primero en compartir tu opinión!</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {reviews.map(review => (
          <CommentItem key={review.id} review={review} figureId={figure.id} currentUser={user} />
        ))}
      </div>
    );
  };

  return (
    <Card className="mt-8 w-full border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Comentarios sobre {figure.name}</CardTitle>
        <CardDescription>
          Comparte tu opinión y califica a esta figura. Tu perspectiva es importante.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : firebaseUser ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <span className="font-medium">Tu Calificación:</span>
                <StarRating rating={rating} onRatingChange={(r) => setRating(r as StarValue)} size={24} />
            </div>
            <Textarea
              placeholder="Escribe tu comentario aquí..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              maxLength={1000}
              className="bg-muted/30"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{commentText.length} / 1000</p>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Enviando...' : 'Enviar Comentario'}
              </Button>
            </div>
          </form>
        ) : (
            <Alert>
                <LogIn className="h-4 w-4"/>
                <AlertTitle>Únete a la Conversación</AlertTitle>
                <AlertDescription>
                    <Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link> o continúa como invitado para dejar tu comentario.
                </AlertDescription>
            </Alert>
        )}
      </CardContent>

      <CardHeader className="border-t border-white/20 mt-6">
        <CardTitle>Todos los comentarios ({reviews?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        {renderReviewList()}
      </CardContent>
    </Card>
  );
}
