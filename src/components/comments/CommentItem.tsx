
"use client";

import * as React from 'react';
import type { Review, UserProfile } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StarRating } from '@/components/shared/StarRating';
import { ThumbsUp, ThumbsDown, MessageSquareReply, Trash2, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { updateCommentLikes } from '@/app/actions/reviewActions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
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
} from "@/components/ui/alert-dialog"

const deleteReviewCallable = httpsCallable<{ reviewId: string }, { success: boolean; message: string }>(getFunctions(app), 'deleteReview');

interface CommentItemProps {
  review: Review;
  figureId: string;
  currentUser: UserProfile | null;
}

export function CommentItem({ review, figureId, currentUser }: CommentItemProps) {
  const { toast } = useToast();
  const [likes, setLikes] = React.useState(review.likes);
  const [dislikes, setDislikes] = React.useState(review.dislikes);
  const [userVote, setUserVote] = React.useState<'like' | 'dislike' | null>(null);
  const [isLiking, setIsLiking] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (currentUser) {
      if (review.likedBy.includes(currentUser.uid)) {
        setUserVote('like');
      } else if (review.dislikedBy.includes(currentUser.uid)) {
        setUserVote('dislike');
      }
    }
  }, [currentUser, review.likedBy, review.dislikedBy]);

  const handleLikeDislike = async (action: 'like' | 'dislike') => {
    if (!currentUser) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión para votar." });
      return;
    }
    setIsLiking(true);

    const result = await updateCommentLikes(review.id, figureId, currentUser.uid, action);
    if (result.success) {
      setLikes(result.newLikes ?? likes);
      setDislikes(result.newDislikes ?? dislikes);
      
      if (action === 'like') {
        setUserVote(userVote === 'like' ? null : 'like');
      } else {
        setUserVote(userVote === 'dislike' ? null : 'dislike');
      }
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsLiking(false);
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        await deleteReviewCallable({ reviewId: review.id });
        toast({ title: "Comentario Eliminado", description: "Tu comentario ha sido eliminado exitosamente." });
        // The real-time listener in CommentSection will handle the UI update
    } catch (error: any) {
        console.error("Error deleting review:", error);
        toast({ title: "Error", description: error.message || "No se pudo eliminar el comentario.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

  const timeAgo = (date: Date): string => {
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
    return 'hace unos segundos';
  };
  
  const canDelete = currentUser && (currentUser.uid === review.userId || currentUser.role === 'admin');

  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={correctMalformedUrl(review.userPhotoUrl) || undefined} alt={review.username} />
        <AvatarFallback>{review.username ? review.username.charAt(0).toUpperCase() : <User />}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{review.username}</p>
            <p className="text-xs text-muted-foreground">
              {review.createdAt ? timeAgo(review.createdAt.toDate()) : ''}
            </p>
          </div>
          <StarRating rating={review.rating} size={16} readOnly />
        </div>
        <p className="text-sm mt-2 whitespace-pre-wrap">{review.comment}</p>
        <div className="flex items-center gap-4 mt-3 text-muted-foreground">
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2 h-auto py-1" onClick={() => handleLikeDislike('like')} disabled={isLiking}>
            <ThumbsUp className={cn("h-4 w-4", userVote === 'like' && 'text-primary fill-primary/20')} />
            <span className="text-xs">{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2 h-auto py-1" onClick={() => handleLikeDislike('dislike')} disabled={isLiking}>
            <ThumbsDown className={cn("h-4 w-4", userVote === 'dislike' && 'text-destructive fill-destructive/20')} />
             <span className="text-xs">{dislikes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-2 h-auto py-1">
            <MessageSquareReply className="h-4 w-4" />
            <span className="text-xs">Responder</span>
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive flex items-center gap-1.5 px-2 h-auto py-1">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs">Eliminar</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este comentario permanentemente?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
