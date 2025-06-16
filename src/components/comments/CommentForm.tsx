
"use client";

import { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRatingInput } from './StarRatingInput';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquarePlus, User } from 'lucide-react';
import { submitCommentAndRatingAction } from '@/app/actions/commentRatingActions';
import { auth } from '@/lib/firebase'; // For current user
import { onAuthStateChanged } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/userData';

const commentFormSchema = z.object({
  rating: z.number().min(1, "Debes seleccionar una calificación.").max(5),
  text: z.string().min(10, "El comentario debe tener al menos 10 caracteres.").max(1000, "El comentario no puede exceder los 1000 caracteres."),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  figureId: string;
  onCommentSubmitted?: () => void; // Callback after successful submission
}

export function CommentForm({ figureId, onCommentSubmitted }: CommentFormProps) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      rating: 0,
      text: '',
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile for comment form:", error);
          setUserProfile(null); // Ensure profile is null on error
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: CommentFormValues) => {
    if (!authUser || authUser.isAnonymous) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión con una cuenta para comentar.", variant: "destructive" });
      return;
    }

    form.clearErrors(); // Clear previous errors

    try {
      const result = await submitCommentAndRatingAction({
        figureId,
        rating: data.rating,
        text: data.text,
        userId: authUser.uid,
        username: userProfile?.username || authUser.displayName || authUser.email || "Usuario Anónimo",
        userPhotoUrl: userProfile?.photoURL || authUser.photoURL || null,
      });

      if (result.success) {
        toast({ title: "Comentario Publicado", description: "Tu comentario y calificación han sido guardados." });
        form.reset(); // Reset form fields
        onCommentSubmitted?.(); // Trigger callback if provided
      } else {
        toast({ title: "Error al Publicar", description: result.message || "No se pudo guardar tu comentario.", variant: "destructive" });
        if (result.errors) {
          result.errors.forEach(err => {
            if (err.path && (err.path[0] === 'rating' || err.path[0] === 'text')) {
              form.setError(err.path[0] as 'rating' | 'text', { message: err.message });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({ title: "Error Inesperado", description: "Ocurrió un error al enviar tu comentario.", variant: "destructive" });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center space-x-3 p-4 border rounded-lg bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Cargando formulario de comentarios...</p>
      </div>
    );
  }

  if (!authUser || authUser.isAnonymous) {
    return (
      <div className="p-4 border rounded-lg bg-card text-center">
        <p className="text-muted-foreground">
          <a href="/login" className="text-primary hover:underline font-semibold">Inicia sesión</a> o <a href="/signup" className="text-primary hover:underline font-semibold">regístrate</a> para calificar y comentar.
        </p>
      </div>
    );
  }

  const avatarSrc = userProfile?.photoURL || authUser?.photoURL || undefined;
  const avatarFallback = userProfile?.username?.[0] || authUser?.displayName?.[0] || authUser?.email?.[0] || <User className="h-5 w-5" />;


  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-card shadow">
      <div className="flex items-start space-x-3">
        <Avatar className="h-10 w-10 mt-1">
          <AvatarImage src={avatarSrc} alt={userProfile?.username || authUser?.displayName || "Usuario"} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-grow space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-foreground mb-1 sm:mb-0">
              {userProfile?.username || authUser?.displayName || "Tú"}
            </p>
            <Controller
              name="rating"
              control={form.control}
              render={({ field }) => (
                <StarRatingInput
                  value={field.value}
                  onChange={field.onChange}
                  size={22}
                />
              )}
            />
          </div>
           {form.formState.errors.rating && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.rating.message}</p>
          )}

          <Controller
            name="text"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Escribe tu comentario aquí..."
                rows={3}
                className="w-full text-sm"
                aria-invalid={!!form.formState.errors.text}
              />
            )}
          />
          {form.formState.errors.text && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.text.message}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageSquarePlus className="mr-2 h-4 w-4" />
          )}
          {form.formState.isSubmitting ? 'Publicando...' : 'Publicar Comentario'}
        </Button>
      </div>
    </form>
  );
}
