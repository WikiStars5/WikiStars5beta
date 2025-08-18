
"use client";

import * as React from 'react';
import type { Figure, Review, StarValue } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/shared/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import { deleteReview } from '@/app/actions/reviewActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { revalidatePath } from 'next/cache';

interface CommentSectionProps {
  figure: Figure;
}

export function CommentSection({ figure }: CommentSectionProps) {
  const { user: currentUserProfile, firebaseUser, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = React.useState(true);
  const [newComment, setNewComment] = React.useState("");
  const [newRating, setNewRating] = React.useState<StarValue | 0>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const canSubmit = newComment.trim().length > 0 && newRating > 0 && !!firebaseUser;

  React.useEffect(() => {
    if (!figure.id) return;
    setIsLoadingReviews(true);
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where("characterId", "==", figure.id), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(fetchedReviews);
      setIsLoadingReviews(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setIsLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [figure.id]);

  const handleSubmitReview = async () => {
    if (!canSubmit) {
      toast({ title: "Acción Requerida", description: "Debes dejar una calificación (1-5 estrellas) y un comentario para enviar tu reseña.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const reviewsRef = collection(db, 'reviews');
      await addDoc(reviewsRef, {
        characterId: figure.id,
        userId: firebaseUser.uid,
        username: currentUserProfile?.username || "Invitado",
        userPhotoUrl: currentUserProfile?.photoURL || null,
        rating: newRating,
        comment: newComment,
        createdAt: serverTimestamp(),
      });

      toast({ title: "¡Reseña Enviada!", description: "Gracias por tu contribución. Tu reseña ha sido publicada." });
      setNewComment("");
      setNewRating(0);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "Error", description: "No se pudo enviar tu reseña. Por favor, inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "No estás autenticado.", variant: "destructive" });
      return;
    }

    const originalReviews = [...reviews];
    setReviews(reviews.filter(r => r.id !== reviewId));

    try {
      // This is the correct way to call a server action that requires authentication.
      // We must get the token from the client and pass it in the Authorization header.
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/deleteReview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewId, figureId: figure.id }),
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: "Reseña Eliminada", description: result.message });
      } else {
        toast({ title: "Error", description: result.message || "No se pudo eliminar la reseña.", variant: "destructive" });
        setReviews(originalReviews); // Revert UI change on failure
      }
    } catch (error) {
      console.error("Error calling delete review action:", error);
      toast({ title: "Error de Red", description: "No se pudo comunicar con el servidor.", variant: "destructive" });
      setReviews(originalReviews); // Revert UI change on failure
    }
  };

  const renderReviewItem = (review: Review) => {
    // Correct permission check logic
    const canDelete = firebaseUser && (firebaseUser.uid === review.userId || (currentUserProfile?.role === 'admin'));

    return (
      <div key={review.id} className="flex items-start gap-4 py-4">
        <Avatar>
          <AvatarImage src={correctMalformedUrl(review.userPhotoUrl) || undefined} alt={review.username} />
          <AvatarFallback>{review.username ? review.username.charAt(0).toUpperCase() : <User />}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <p className="font-semibold">{review.username}</p>
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                         <Trash2 className="h-3 w-3" />
                         <span className="sr-only">Eliminar comentario</span>
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El comentario será eliminado permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteReview(review.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
              {review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : ''}
            </p>
          </div>
          <div className="my-1">
            <StarRating rating={review.rating} readOnly size={16} />
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="mt-8 w-full border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Calificaciones y Reseñas de {figure.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {isAuthLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
        ) : firebaseUser && !firebaseUser.isAnonymous ? (
          <div className="space-y-4">
            <div>
              <label className="font-medium text-sm">Tu Calificación</label>
              <StarRating rating={newRating} onRatingChange={(r) => setNewRating(r as StarValue)} size={24} />
            </div>
            <div>
              <label htmlFor="comment" className="font-medium text-sm">Tu Reseña</label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`¿Qué opinas de ${figure.name}?`}
                maxLength={1000}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{newComment.length} / 1000</p>
            </div>
            <Button onClick={handleSubmitReview} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Enviar Reseña"}
            </Button>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-6 border rounded-md">
            <p>Debes <Link href="/login" className="text-primary hover:underline">iniciar sesión</Link> o registrarte para dejar una reseña.</p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold">Todas las reseñas ({reviews.length})</h3>
          {isLoadingReviews ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : reviews.length > 0 ? (
            <div className="divide-y divide-border">
              {reviews.map(renderReviewItem)}
            </div>
          ) : (
            <p className="text-muted-foreground text-center p-8">Sé el primero en dejar una reseña para {figure.name}.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
