"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessagesSquare, Send, Star, User, UserPlus, StarOff, Save } from 'lucide-react';
import type { Figure, Comment as CommentType, RatingValue, LocalProfile, AttitudeKey } from '@/lib/types';
import { addComment, mapDocToComment, updateStreak } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { CommentItem } from './CommentItem';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel, FormProvider } from '../ui/form';
import { StreakAnimation } from '../shared/StreakAnimation';
import { Input } from '../ui/input';
import { CountryCombobox } from '../shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';

const STAR_SOUNDS: Record<string, string> = {
  '1': 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar1.mp3?alt=media&token=a11df570-a6ee-4828-b5a9-81ccbb2c0457',
  '2': 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar2.mp3?alt=media&token=58cbf607-df0b-4bbd-b28e-291cf1951c18',
  '3': 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar3.mp3?alt=media&token=df67dc5b-28ab-4773-8266-60b9127a325f',
  '4': 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar4.mp3?alt=media&token=40c72095-e6a0-42d6-a3f6-86a81c356826',
  '5': 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar5.mp3?alt=media&token=8705fce9-1baa-4f49-8783-7bfc9d35a80f',
};

const StarRatingInput = ({ value, onChange, disabled }: { value: RatingValue | null, onChange: (value: RatingValue) => void, disabled: boolean }) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const handleRatingClick = (rating: RatingValue) => {
    onChange(rating);
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" key={0} onClick={() => handleRatingClick(0)} onMouseEnter={() => setHoverRating(0)} onMouseLeave={() => setHoverRating(null)} className="focus:outline-none" disabled={disabled} aria-label="Calificar con 0 estrellas">
        <StarOff className={cn("h-7 w-7 transition-colors", (hoverRating === 0 || value === 0) ? "text-destructive" : "text-muted-foreground/30")} />
      </button>
      {[...Array(5)].map((_, i) => {
        const ratingValue = (i + 1) as RatingValue;
        return (
          <button type="button" key={ratingValue} onClick={() => handleRatingClick(ratingValue)} onMouseEnter={() => setHoverRating(ratingValue)} onMouseLeave={() => setHoverRating(null)} className="focus:outline-none" disabled={disabled} aria-label={`Calificar con ${ratingValue} estrellas`}>
            <Star className={cn("h-7 w-7 transition-colors", (hoverRating ?? value ?? -1) >= ratingValue ? "text-primary fill-current" : "text-muted-foreground/30")} />
          </button>
        );
      })}
    </div>
  );
};


interface CommentSectionProps {
  figure: Figure;
  highlightedCommentId?: string | null;
  sortPreference: AttitudeKey | null;
}

const commentSchema = z.object({
  text: z.string().min(3, 'Tu opinión debe tener al menos 3 caracteres.').max(2000, 'Tu opinión no puede exceder los 2000 caracteres.'),
  rating: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable(),
});

type CommentFormData = z.infer<typeof commentSchema>;


const guestProfileSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(30, 'El nombre no puede tener más de 30 caracteres.'),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});
type GuestProfileFormData = z.infer<typeof guestProfileSchema>;


const GuestProfileForm = ({ onProfileCreated }: { onProfileCreated: (profile: LocalProfile) => void }) => {
    const { toast } = useToast();

    const form = useForm<GuestProfileFormData>({
        resolver: zodResolver(guestProfileSchema),
        defaultValues: {
            username: '',
            countryCode: '',
            gender: '',
        },
    });

    const onSubmit: SubmitHandler<GuestProfileFormData> = (data) => {
        const profile = {
            username: data.username,
            countryCode: data.countryCode || '',
            gender: data.gender || '',
        };
        onProfileCreated(profile);
        toast({
            title: "¡Perfil de Invitado Creado!",
            description: "Ahora puedes dejar tu opinión.",
        });
    };
    
    return (
        <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-semibold">Crea tu perfil de invitado para participar</h3>
            <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                            <Input placeholder="Tu nombre público" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>País</FormLabel>
                        <CountryCombobox
                            value={field.value || ''}
                            onChange={field.onChange}
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu sexo..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {GENDER_OPTIONS.filter(option => option.value === 'male' || option.value === 'female').map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                Guardar y Comentar
            </Button>
        </form>
        </FormProvider>
    );
};


const INITIAL_COMMENTS_TO_SHOW = 5;

export function CommentSection({ figure, highlightedCommentId, sortPreference }: CommentSectionProps) {
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const [streakToAnimate, setStreakToAnimate] = React.useState<number | null>(null);
  const { toast } = useToast();
  const { 
    currentUser, 
    firebaseUser, 
    isAnonymous, 
    isAdmin, 
    isLoading: isAuthLoading,
    localProfile,
    updateUserProfile,
  } = useAuth();
  
  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: '',
      rating: null,
    },
  });

  const { handleSubmit, control, reset, formState: { isSubmitting } } = form;

  React.useEffect(() => {
    setIsLoadingComments(true);
    const commentsPath = `figures/${figure.id}/comments`;
    const commentsRef = collection(db, commentsPath);
    // Always fetch ordered by date initially
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
  
  const getAuthorData = () => {
    if (!firebaseUser) return null;

    if (isAnonymous && localProfile) {
       return {
        id: firebaseUser.uid,
        name: localProfile.username,
        photoUrl: null,
        gender: localProfile.gender || '',
        country: '',
        countryCode: localProfile.countryCode || '',
        isAnonymous: true,
      };
    }
    
    if (!isAnonymous && currentUser) {
      return {
        id: currentUser.uid,
        name: currentUser.username,
        photoUrl: currentUser.photoURL,
        gender: currentUser.gender || '',
        country: currentUser.country || '',
        countryCode: currentUser.countryCode || '',
        isAnonymous: false,
      };
    }
    
    return null;
  }


  const onCommentSubmit = async (data: CommentFormData) => {
    const authorData = getAuthorData();
    if (!authorData) {
      toast({ title: "Error", description: "No se pudo identificar al autor. Por favor, crea un perfil de invitado.", variant: "destructive" });
      return;
    }
    
    if (data.rating === null) {
      toast({ title: "Calificación Requerida", description: "Por favor, selecciona una calificación de 0 a 5 estrellas para publicar tu opinión.", variant: "destructive" });
      return;
    }

    try {
        await addComment(figure.id, authorData, data.text, data.rating);
        
        if (data.rating > 0) {
            const soundUrl = STAR_SOUNDS[data.rating];
            if (soundUrl) {
                const audio = new Audio(soundUrl);
                audio.play().catch(error => console.error("Error playing audio:", error));
            }
        }
        
        const newStreak = await updateStreak(figure.id, authorData);
        if (newStreak) {
            setStreakToAnimate(newStreak);
        }

        toast({ title: "¡Opinión publicada!", description: "Gracias por tu contribución." });
        reset({ text: '', rating: null });
    } catch (error: any) {
        console.error("Error al publicar comentario:", error);
        toast({ title: "Error", description: "No se pudo publicar tu opinión. " + error.message, variant: "destructive" });
    }
  };
  
  const renderCommentInput = () => {
      if (isAuthLoading) {
          return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
      }
      
      const canComment = (isAnonymous && localProfile) || (!isAnonymous && currentUser);
      
      if (!canComment) {
          return <GuestProfileForm onProfileCreated={(profile) => updateUserProfile(profile.username, profile.countryCode, profile.gender)} />;
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
                      <FormItem className="flex flex-col space-y-2">
                        <FormLabel>Califica este perfil (0-5 estrellas):</FormLabel>
                        <FormControl>
                           <StarRatingInput 
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isSubmitting}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                 <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Publicar Opinión
                    </Button>
                </div>
            </form>
        </Form>
      );
  };
  
  const sortedComments = React.useMemo(() => {
    const commentsCopy = [...comments];
    if (sortPreference === 'fan' || sortPreference === 'simp') {
      // Show negative comments first (lowest rating)
      return commentsCopy.sort((a, b) => (a.rating ?? 3) - (b.rating ?? 3));
    }
    if (sortPreference === 'hater') {
      // Show positive comments first (highest rating)
      return commentsCopy.sort((a, b) => (b.rating ?? 3) - (a.rating ?? 3));
    }
    // Default: neutral or no vote, sort by newest
    return commentsCopy;
  }, [comments, sortPreference]);

  const commentsToShow = showAllComments ? sortedComments : sortedComments.slice(0, INITIAL_COMMENTS_TO_SHOW);
  
  // This logic finds the latest comment for each user to decide if stars should be shown.
  const latestUserCommentIds = React.useMemo(() => {
    const seenUsers = new Set<string>();
    const latestIds = new Set<string>();
    // Use the original, date-sorted comments array to find the latest
    comments.forEach(comment => {
      if (!seenUsers.has(comment.authorId)) {
        seenUsers.add(comment.authorId);
        latestIds.add(comment.id);
      }
    });
    return latestIds;
  }, [comments]);


  return (
    <>
      <StreakAnimation isOpen={!!streakToAnimate} streakCount={streakToAnimate} onClose={() => setStreakToAnimate(null)} />
      <Card className="border border-white/20 bg-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare /> Opiniones y Discusión
          </CardTitle>
          <CardDescription>
            Comparte tu opinión sobre {figure.name}. Sé respetuoso y mantén la conversación constructiva. Tu calificación se gestiona en el panel superior.
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
                    isLastCommentFromAuthor={latestUserCommentIds.has(comment.id)}
                  />
                ))}
                {sortedComments.length > INITIAL_COMMENTS_TO_SHOW && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => setShowAllComments(!showAllComments)}>
                          {showAllComments ? 'Mostrar menos comentarios' : `Ver los ${sortedComments.length - INITIAL_COMMENTS_TO_SHOW} comentarios restantes`}
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
