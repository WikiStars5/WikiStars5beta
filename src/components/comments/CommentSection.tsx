
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessagesSquare, Send, Star, User, UserPlus } from 'lucide-react';
import type { Figure, Comment as CommentType, RatingValue } from '@/lib/types';
import { addComment, mapDocToComment, updateStreak } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { CommentItem } from './CommentItem';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';
import { StreakAnimation } from '../shared/StreakAnimation';

interface CommentSectionProps {
  figure: Figure;
  highlightedCommentId?: string | null;
}

const commentSchema = z.object({
  text: z.string().min(3, 'Tu opinión debe tener al menos 3 caracteres.').max(2000, 'Tu opinión no puede exceder los 2000 caracteres.'),
  rating: z.custom<RatingValue>().refine(val => val >= 0 && val <= 5, { message: "Debes seleccionar una calificación." }),
});

type CommentFormData = z.infer<typeof commentSchema>;

const INITIAL_COMMENTS_TO_SHOW = 5;

const StarRatingInput = ({ value, onChange }: { value: RatingValue | undefined, onChange: (value: RatingValue) => void }) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        const ratingValue = (i + 1) as RatingValue;
        return (
          <button
            type="button"
            key={ratingValue}
            onClick={() => onChange(ratingValue)}
            onMouseEnter={() => setHoverRating(ratingValue)}
            onMouseLeave={() => setHoverRating(null)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                (hoverRating ?? value ?? 0) >= ratingValue
                  ? "text-primary fill-current"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        );
      })}
       <button
            type="button"
            key={0}
            onClick={() => onChange(0)}
            onMouseEnter={() => setHoverRating(0)}
            onMouseLeave={() => setHoverRating(null)}
            className="ml-2 focus:outline-none px-2 py-1 text-xs border rounded-md hover:bg-muted"
        >
           { (hoverRating ?? value) === 0 ? <span className="text-destructive">Quitar</span> : "N/A" }
        </button>
    </div>
  );
};


export function CommentSection({ figure, highlightedCommentId }: CommentSectionProps) {
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const [streakToAnimate, setStreakToAnimate] = React.useState<number | null>(null);
  const { toast } = useToast();
  const { currentUser, firebaseUser, isLoading: isAuthLoading } = useAuth();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: '',
      rating: undefined,
    },
  });

  const { handleSubmit, control, reset, formState: { isSubmitting } } = form;

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

  const onCommentSubmit = async (data: CommentFormData) => {
    const userId = firebaseUser?.uid || localStorage.getItem('wikistars5-guestId');
    if (!userId) {
      toast({ title: "Error", description: "No se pudo identificar al usuario.", variant: "destructive" });
      return;
    }

    const isAnonymous = !firebaseUser;
    const authorData = {
        id: userId,
        name: isAnonymous ? (localStorage.getItem('wikistars5-guestUsername') || 'Invitado') : (currentUser?.username || 'Usuario'),
        photoUrl: isAnonymous ? null : (currentUser?.photoURL || null),
        gender: isAnonymous ? (localStorage.getItem('wikistars5-guestGender') || '') : (currentUser?.gender || ''),
        country: isAnonymous ? (localStorage.getItem('wikistars5-guestCountryName') || '') : (currentUser?.country || ''),
        countryCode: isAnonymous ? (localStorage.getItem('wikistars5-guestCountryCode') || '') : (currentUser?.countryCode || ''),
        isAnonymous: isAnonymous,
    };
    
    try {
        await addComment(figure.id, authorData, data.text, data.rating);
        const newStreak = await updateStreak(figure.id, authorData);
        if (newStreak) {
          setStreakToAnimate(newStreak);
        }

        toast({ title: "¡Opinión publicada!", description: "Gracias por tu contribución." });
        reset({ text: '', rating: undefined });
    } catch (error: any) {
        console.error("Error al publicar comentario:", error);
        toast({ title: "Error", description: "No se pudo publicar tu opinión. " + error.message, variant: "destructive" });
    }
  };
  
  const renderCommentInput = () => {
      if (isAuthLoading) {
          return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
      }
      
      return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onCommentSubmit)} className="space-y-4">
                <FormField
                    control={control}
                    name="text"
                    render={({ field }) => (
                        <FormItem>
                            <Textarea
                                {...field}
                                placeholder={`¿Qué opinas de ${figure.name}?`}
                                rows={4}
                                className="bg-muted/50"
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Califica este perfil (0-5 estrellas):</p>
                                    <StarRatingInput value={field.value} onChange={field.onChange} />
                                </div>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Publicar Opinión
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
      );
  };

  const commentsToShow = showAllComments ? comments : comments.slice(0, INITIAL_COMMENTS_TO_SHOW);

  return (
    <>
      <StreakAnimation isOpen={!!streakToAnimate} streakCount={streakToAnimate} onClose={() => setStreakToAnimate(null)} />
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
                Aún no hay opiniones. ¡Sé el primero en comentar!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
