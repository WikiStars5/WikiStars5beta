
"use client";

import type { Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/StarRating";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageSquareReply, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { formatDistanceToNow, setDefaultOptions } from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale
import { useState, useEffect } from 'react';
import { CommentForm } from './CommentForm';
import { updateCommentReaction } from '@/lib/actions/commentActions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

setDefaultOptions({ locale: es }); // Set default locale for date-fns

const ADMIN_UID = 'fjEZpqVvG4VOzwUdGyes7ufhqYH2';

interface CommentItemProps {
  comment: CommentType;
  figureName: string; 
  onReplySubmittedLocal?: (replyText: string, parentId: string) => void; 
  onDelete?: (commentId: string) => Promise<void>;
  level?: number;
}

export function CommentItem({ comment, figureName, onReplySubmittedLocal, onDelete, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isReacting, setIsReacting] = useState<null | 'like' | 'dislike'>(null); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = currentUser?.uid === ADMIN_UID;
  const isOwnComment = currentUser?.uid === comment.userId;

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!currentUser) {
      toast({ title: "Inicio de Sesión Requerido", description: "Por favor, inicia sesión para reaccionar.", variant: "destructive"});
      return;
    }
    setIsReacting(reactionType);
    const result = await updateCommentReaction(comment.id, reactionType); 
    setIsReacting(null);

    if (result.success) {
      toast({ title: "¡Reacción actualizada!" });
      router.refresh(); 
    } else {
      toast({ title: "Error en la reacción", description: result.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.")) return;
    
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
      toast({ title: "Comentario Eliminado" });
      router.refresh(); 
    } catch (error) {
      toast({ title: "Error al Eliminar", description: "No se pudo eliminar el comentario.", variant: "destructive"});
    } finally {
      setIsDeleting(false);
    }
  };
  
  const timeAgo = comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true }) : 'Justo ahora';

  if (authLoading) {
    return <div className={`flex space-x-3 py-4 ${level > 0 ? 'pl-6 border-l ml-4' : ''} border-b last:border-b-0 animate-pulse bg-muted/30 rounded-md h-20`}></div>;
  }

  return (
    <div className={`flex space-x-3 py-4 ${level > 0 ? 'pl-6 border-l ml-4' : ''} border-b last:border-b-0`}>
      <Avatar className="flex-shrink-0">
        <AvatarImage src={comment.userAvatarUrl || undefined} alt={comment.userName} />
        <AvatarFallback>{comment.userName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{comment.userName}</span>
            {comment.starRatingGivenByAuthor && comment.starRatingGivenByAuthor > 0 && (
              <StarRating rating={comment.starRatingGivenByAuthor} readOnly size={14} />
            )}
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {(isAdmin || isOwnComment) && onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              <span className="sr-only">Eliminar comentario</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.commentText}</p>
        <div className="flex items-center space-x-3 mt-2 text-xs">
          <Button variant="ghost" size="sm" onClick={() => handleReaction('like')} className="p-1 h-auto text-muted-foreground" disabled={!!isReacting || !currentUser}>
            {isReacting === 'like' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-1" />} {comment.likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleReaction('dislike')} className="p-1 h-auto text-muted-foreground" disabled={!!isReacting || !currentUser}>
             {isReacting === 'dislike' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ThumbsDown className="h-4 w-4 mr-1" />} {comment.dislikesCount}
          </Button>
          {level < 2 && ( 
             <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="p-1 h-auto text-muted-foreground" disabled={!currentUser}>
              <MessageSquareReply className="h-4 w-4 mr-1" /> Responder
            </Button>
          )}
        </div>
        {showReplyForm && currentUser && (
          <div className="mt-3">
            <CommentForm
              figureId={comment.figureId}
              figureName={figureName}
              parentId={comment.id}
              onCommentSubmitted={() => {
                setShowReplyForm(false);
              }}
              placeholder={`Respondiendo a ${comment.userName}...`}
              submitButtonText="Publicar Respuesta"
            />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply}
                figureName={figureName}
                onReplySubmittedLocal={onReplySubmittedLocal}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
