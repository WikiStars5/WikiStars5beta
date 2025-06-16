
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/shared/StarRating';
import { useToast } from '@/hooks/use-toast';
import { submitCommentAndRating } from '@/app/actions/commentRatingActions';
import { Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommentFormProps {
  figureId: string;
  currentUser: User | null;
  onCommentSubmitted: () => void; // Callback to refresh comments
}

export function CommentForm({ figureId, currentUser, onCommentSubmitted }: CommentFormProps) {
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0); // 0 means no rating selected
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canComment = !!currentUser && !currentUser.isAnonymous;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canComment) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión para comentar y calificar.", variant: "default" });
      return;
    }
    if (commentText.trim().length < 3) {
      toast({ title: "Comentario muy corto", description: "Tu comentario debe tener al menos 3 caracteres.", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "Calificación requerida", description: "Por favor, selecciona una calificación de estrellas.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitCommentAndRating({
        figureId,
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email?.split('@')[0] || "Usuario Anónimo",
        userPhotoURL: currentUser.photoURL,
        ratingGiven: rating,
        commentText: commentText.trim(),
      });

      if (result.success) {
        toast({ title: "Comentario Enviado", description: "Tu comentario y calificación han sido publicados." });
        setCommentText('');
        setRating(0);
        onCommentSubmitted(); // Trigger refresh
      } else {
        throw new Error(result.message || "No se pudo enviar el comentario.");
      }
    } catch (error: any) {
      toast({
        title: "Error al Comentar",
        description: error.message || "Ocurrió un error al enviar tu comentario.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 p-4 border rounded-lg shadow bg-card">
      <div className="flex items-start space-x-3 mb-3">
        {currentUser && (
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
            <AvatarFallback>{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
        )}
         <div className="flex-grow">
          <p className="font-semibold text-sm">
            {canComment ? (currentUser?.displayName || currentUser?.email) : "Califica y comenta"}
          </p>
          <StarRating rating={rating} onRatingChange={setRating} readOnly={!canComment || isLoading} size={22} />
        </div>
      </div>
      <Textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder={canComment ? "Únete a la conversación..." : "Inicia sesión para dejar un comentario y calificación."}
        rows={3}
        disabled={!canComment || isLoading}
        className="mb-3"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!canComment || isLoading || commentText.trim().length < 3 || rating === 0}>
          {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          <span className="ml-2">{isLoading ? "Enviando..." : "Enviar Comentario"}</span>
        </Button>
      </div>
    </form>
  );
}
