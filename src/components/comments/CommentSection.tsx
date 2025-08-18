
"use client";

import { useState, useEffect } from 'react';
import type { Figure, Review } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { db, app } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Trash2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { correctMalformedUrl, cn } from '@/lib/utils';
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

interface CommentSectionProps {
  figure: Figure;
}

// Callable Firebase Functions
const functions = getFunctions(app, 'us-central1');
const addReviewCallable = httpsCallable(functions, 'addReview');
const deleteReviewCallable = httpsCallable(functions, 'deleteReview');


function timeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `hace ${Math.floor(interval)} años`;
  interval = seconds / 2592000;
  if (interval > 1) return `hace ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `hace ${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval > 1) return `hace ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
  return `hace ${Math.floor(seconds)} segundos`;
}

export function CommentSection({ figure }: CommentSectionProps) {
  const { user: currentUser, firebaseUser, isLoading: isAuthLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!figure.id) return;
    const q = query(
      collection(db, 'reviews'),
      where('characterId', '==', figure.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(fetchedReviews);
      setIsLoadingReviews(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setIsLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [figure.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast({ title: 'Acción Requerida', description: 'Debes estar autenticado para dejar una reseña.', variant: 'destructive' });
      return;
    }
    if (comment.trim().length < 5) {
        toast({ title: 'Comentario muy corto', description: 'El comentario debe tener al menos 5 caracteres.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
        const result = await addReviewCallable({ characterId: figure.id, comment: comment.trim() });
        const data = result.data as { success: boolean, message: string };

        if (data.success) {
          setComment('');
          toast({ title: 'Éxito', description: data.message });
        } else {
          toast({ title: 'Error', description: data.message, variant: 'destructive' });
        }
    } catch (error: any) {
        toast({ title: 'Error Inesperado', description: error.message || "No se pudo conectar con el servidor.", variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const result = await deleteReviewCallable({ reviewId });
      const data = result.data as { success: boolean, message: string };
      if (data.success) {
        toast({ title: 'Éxito', description: data.message });
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error: any) {
        toast({ title: 'Error al Eliminar', description: error.message || "No se pudo conectar con el servidor.", variant: 'destructive' });
    }
  }

  const renderReviewItem = (review: Review) => {
    const canDelete = currentUser && (currentUser.uid === review.userId || currentUser.role === 'admin');
    return (
      <div key={review.id} id={`comment-${review.id}`} className="flex items-start space-x-4 py-4">
        <Avatar>
          <AvatarImage src={correctMalformedUrl(review.userPhotoUrl) || undefined} alt={review.username} />
          <AvatarFallback>{review.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{review.username}</p>
            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el comentario permanentemente.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(review.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {review.createdAt ? timeSince(review.createdAt.toDate()) : 'hace un momento'}
          </p>
          <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="mt-8 w-full border border-white/20 bg-black">
      <CardHeader>
        <CardTitle>Comentarios sobre {figure.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {isAuthLoading ? (
           <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        ) : firebaseUser ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu opinión... (máx 1000 caracteres)"
                rows={4}
                maxLength={1000}
                className="bg-black border-white"
              />
              <p className="text-xs text-right text-muted-foreground mt-1">{comment.length} / 1000</p>
            </div>
            <Button type="submit" disabled={isSubmitting || comment.trim().length < 5}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar Comentario
            </Button>
          </form>
        ) : (
            <Alert>
                <LogIn className="h-4 w-4" />
                <AlertTitle>Únete a la conversación</AlertTitle>
                <AlertDescription>
                   <Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link> o regístrate para dejar un comentario.
                </AlertDescription>
            </Alert>
        )}

        <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Todos los comentarios ({reviews.length})</h3>
            <div className="divide-y divide-white/20">
                {isLoadingReviews ? (
                     <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     </div>
                ) : reviews.length > 0 ? (
                    reviews.map(renderReviewItem)
                ) : (
                    <p className="text-center text-muted-foreground py-10">Aún no hay comentarios para esta figura. ¡Sé el primero!</p>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
