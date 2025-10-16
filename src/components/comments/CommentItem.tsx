
"use client";

import * as React from 'react';
import type { Figure, Comment as CommentType, RatingValue } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight, Loader2, Star, StarOff, Trash2, FilePenLine, Save, X } from 'lucide-react';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { mapDocToComment, toggleDislikeComment, toggleLikeComment, addReply, deleteComment, updateComment, getReplies } from '@/lib/placeholder-data';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
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

const TRUNCATE_LENGTH = 280; // Characters to show before truncating
const MAX_REPLY_DEPTH = 3; // Set a maximum nesting level for replies

function timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "justo ahora";
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} min`;
    return `hace ${Math.floor(seconds)} seg`;
}

interface CommentItemProps {
    figure: Figure;
    comment: CommentType;
    parentPath: string;
    highlightedCommentId?: string | null;
    isLastCommentFromAuthor: boolean;
    startWithRepliesOpen?: boolean;
    expansionPath?: string[];
    isLastInThread: boolean;
}

const ReplyForm = ({ figure, parentPath, onReplySuccess }: { figure: Figure, parentPath: string, onReplySuccess: () => void }) => {
    const [text, setText] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    const { currentUser, firebaseUser, isLoading: isAuthLoading, localProfile } = useAuth();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || isSubmitting || !firebaseUser) {
            if (!firebaseUser) toast({ title: "Error", description: "Debes iniciar sesión para responder.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        const isAnonymous = firebaseUser.isAnonymous;
        const authorName = isAnonymous 
            ? localProfile?.username 
            : currentUser?.username;

        if (!authorName) {
            toast({ title: "Error de Perfil", description: "No se pudo encontrar tu nombre de usuario.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        
        const authorData = {
            id: firebaseUser.uid,
            name: authorName,
            photoUrl: isAnonymous ? null : (currentUser?.photoURL || null),
            gender: isAnonymous ? localProfile?.gender || '' : currentUser?.gender || '',
            country: isAnonymous ? '' : currentUser?.country || '',
            countryCode: isAnonymous ? localProfile?.countryCode || '' : currentUser?.countryCode || '',
            isAnonymous: isAnonymous,
        };

        try {
            await addReply(parentPath, authorData, text);
            toast({ title: "Respuesta enviada" });
            setText('');
            onReplySuccess();
        } catch (error: any) {
            toast({ title: "Error al responder", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={2}
                className="bg-card"
            />
            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={isSubmitting || !text.trim()}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Responder
                </Button>
            </div>
        </form>
    );
};

// Function to generate a color from a string (e.g., user ID)
const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};


export function CommentItem({ 
    figure, 
    comment, 
    parentPath,
    highlightedCommentId,
    isLastCommentFromAuthor,
    startWithRepliesOpen = false,
    expansionPath,
    isLastInThread,
}: CommentItemProps) {
    const { currentUser, firebaseUser, isAdmin, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const [replies, setReplies] = React.useState<CommentType[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);
    const [showReplies, setShowReplies] = React.useState(startWithRepliesOpen);
    const [showReplyForm, setShowReplyForm] = React.useState(false);
    const [isProcessingLike, setIsProcessingLike] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isHighlighted, setIsHighlighted] = React.useState(false);
    const commentRef = React.useRef<HTMLDivElement>(null);
    
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(comment.text);
    const [isSavingEdit, setIsSavingEdit] = React.useState(false);

    const [isExpanded, setIsExpanded] = React.useState(false);
    const isLongComment = comment.text.length > TRUNCATE_LENGTH;
    
    const currentPath = `${parentPath}/${comment.id}`;
    const depth = (parentPath.match(/replies/g) || []).length;
    const canReply = depth < MAX_REPLY_DEPTH;

    const userId = firebaseUser?.uid;
    const isOwnComment = userId === comment.authorId;
    const isLiked = userId ? comment.likes.includes(userId) : false;
    const isDisliked = userId ? comment.dislikes.includes(userId) : false;


    const canDelete = React.useMemo(() => {
        if (isAdmin) return true;
        return userId === comment.authorId;
    }, [isAdmin, userId, comment.authorId]);
    
    const canEdit = React.useMemo(() => {
        return userId === comment.authorId;
    }, [userId, comment.authorId]);
    
    const anonymousUserColor = React.useMemo(() => {
        if (comment.isAnonymous) {
            return stringToHslColor(comment.authorId, 60, 65); // Use HSL for good-looking colors
        }
        return undefined;
    }, [comment.isAnonymous, comment.authorId]);

    const displayName = React.useMemo(() => {
        if (isOwnComment) {
             return (
                <span className="flex items-center gap-1.5" style={{ color: anonymousUserColor }}>
                    <span>{comment.authorName}</span>
                    <span className="font-bold text-primary">(Yo)</span>
                </span>
            );
        }
        if (comment.isAnonymous) {
            const discriminator = comment.authorId.slice(-4);
            return (
                <span className="flex items-center gap-1.5" style={{ color: anonymousUserColor }}>
                    <span>{comment.authorName}</span>
                    <span className="text-current/70">#{discriminator}</span>
                </span>
            );
        }
        return <span>{comment.authorName}</span>;
    }, [comment.authorName, comment.isAnonymous, comment.authorId, isOwnComment, anonymousUserColor]);


    React.useEffect(() => {
        if (comment.id === highlightedCommentId && commentRef.current) {
            commentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setIsHighlighted(true);
            const timer = setTimeout(() => setIsHighlighted(false), 5000); // Highlight for 5 seconds
            return () => clearTimeout(timer);
        }
    }, [comment.id, highlightedCommentId]);


    const genderSymbol = React.useMemo(() => {
        const genderOpt = GENDER_OPTIONS.find(g => g.label === comment.authorGender || g.value === comment.authorGender);
        return genderOpt?.symbol || null;
    }, [comment.authorGender]);

    const genderColorClass = React.useMemo(() => {
        if (comment.authorGender === 'Masculino' || comment.authorGender === 'male') return 'text-blue-400';
        if (comment.authorGender === 'Femenino' || comment.authorGender === 'female') return 'text-pink-400';
        return '';
    }, [comment.authorGender]);

    const fetchReplies = React.useCallback(async () => {
      if (!showReplies) return;

      setIsLoadingReplies(true);
      const repliesPath = `${currentPath}/replies`;
      try {
        const fetchedReplies = await getReplies(repliesPath);
        setReplies(fetchedReplies);
      } catch(error) {
          console.error("Error fetching replies: ", error);
      } finally {
        setIsLoadingReplies(false);
      }
    }, [showReplies, currentPath]);

    React.useEffect(() => {
      fetchReplies();
    }, [fetchReplies]);

    const handleLike = async (isLike: boolean) => {
        if (isProcessingLike || isAuthLoading || !userId) {
            toast({ title: "Error", description: "Debes iniciar sesión para reaccionar.", variant: "destructive" });
            return;
        }

        setIsProcessingLike(true);
        try {
            if (isLike) {
                 await toggleLikeComment(currentPath, userId);
            } else {
                 await toggleDislikeComment(currentPath, userId);
            }
        } catch (error: any) {
            console.error("Error liking/disliking:", error);
            toast({ title: "Error", description: `No se pudo registrar tu reacción. ${error.message}`, variant: "destructive" });
        } finally {
            setIsProcessingLike(false);
        }
    };
    
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteComment(currentPath);
            toast({ title: "Comentario eliminado" });
        } catch (error: any) {
            console.error("Error deleting comment:", error);
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
            setIsDeleting(false);
        }
    };
    
    const handleSaveEdit = async () => {
        if (isSavingEdit || !editText.trim()) return;

        setIsSavingEdit(true);
        try {
            await updateComment(currentPath, editText.trim());
            toast({ title: "Comentario actualizado" });
            setIsEditing(false);
        } catch (error: any) {
            console.error("Error updating comment:", error);
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const renderRating = (rating: RatingValue) => {
      const stars = [];
      const isZero = rating === 0;

      if(isZero) {
        stars.push(<StarOff key="zero" className="h-4 w-4 text-destructive" />);
      } else {
        for (let i = 1; i <= 5; i++) {
          stars.push(
            <Star key={i} className={cn("h-4 w-4", i <= rating ? "text-primary fill-current" : "text-muted-foreground/30")} />
          );
        }
      }
      return <div className="flex items-center gap-1">{stars}</div>;
    };


    return (
        <div ref={commentRef} className={cn(depth > 0 && "ml-4 md:ml-8")} id={`comment-${comment.id}`}>
            <div className={cn(
                "flex-grow bg-muted/50 p-3 rounded-lg transition-colors duration-1000",
                isHighlighted ? "bg-primary/20" : ""
            )}>
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={correctMalformedUrl(comment.authorPhotoUrl)} alt={comment.authorName} />
                            <AvatarFallback>{comment.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <p className="font-semibold text-sm">
                                  {displayName}
                                </p>
                                {genderSymbol && <span className={cn("text-sm", genderColorClass)} title={comment.authorGender}>{genderSymbol}</span>}
                                {comment.authorCountryCode && (
                                    <Image
                                        src={`https://flagcdn.com/w20/${comment.authorCountryCode.toLowerCase()}.png`}
                                        alt={comment.authorCountry || comment.authorCountryCode}
                                        width={20}
                                        height={15}
                                        className="w-5 h-auto"
                                        title={comment.authorCountry}
                                    />
                                )}
                            </div>
                            {isLastCommentFromAuthor && comment.rating !== undefined && comment.rating !== null && (
                                <div className="mt-1">
                                    {renderRating(comment.rating)}
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                        {comment.lastEditedAt && <span title={comment.lastEditedAt.toDate().toLocaleString()}>(editado)</span>}
                        
                    </div>
                </div>
                
                {isEditing ? (
                    <div className="space-y-2 mt-2 ml-10">
                        <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="bg-card"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSavingEdit}>
                                <X className="mr-1 h-4 w-4"/> Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit || !editText.trim()}>
                                {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                <Save className="mr-1 h-4 w-4"/> Guardar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm mt-2 whitespace-pre-wrap ml-10">
                        {isLongComment && !isExpanded 
                            ? `${comment.text.substring(0, TRUNCATE_LENGTH)}...` 
                            : comment.text
                        }
                        </p>
                        {isLongComment && (
                        <Button 
                            variant="link" 
                            className="text-xs p-0 h-auto ml-10" 
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Ver menos' : 'Ver más'}
                        </Button>
                        )}
                    </>
                )}
            </div>
            <div className="flex items-center gap-2 mt-1 px-1 ml-10">
                <Button variant="ghost" size="sm" onClick={() => handleLike(true)} disabled={isProcessingLike || isAuthLoading} className={cn("text-xs h-auto py-1 px-2", isLiked && "text-blue-500 hover:text-blue-600")}>
                    <ThumbsUp className="mr-1 h-3 w-3" /> {comment.likeCount}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleLike(false)} disabled={isProcessingLike || isAuthLoading} className={cn("text-xs h-auto py-1 px-2", isDisliked && "text-red-500 hover:text-red-600")}>
                    <ThumbsDown className="mr-1 h-3 w-3" /> {comment.dislikeCount}
                </Button>
                {canReply && (
                    <Button variant="ghost" size="icon" onClick={() => setShowReplyForm(!showReplyForm)} disabled={isAuthLoading} className="text-xs h-8 w-8">
                        <MessageSquareReply className="h-4 w-4" />
                        <span className="sr-only">Responder</span>
                    </Button>
                )}
                 {canEdit && (
                    <Button variant="ghost" size="sm" disabled={isAuthLoading} onClick={() => setIsEditing(true)} className="text-xs h-auto py-1 px-2">
                        <FilePenLine className="mr-1 h-3 w-3" /> Editar
                    </Button>
                )}
                {canDelete && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isDeleting || isAuthLoading} className="text-xs h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="sr-only">Eliminar</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente el comentario y todas sus respuestas.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                    Eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {showReplyForm && canReply && (
                <div className="ml-10 mt-2">
                    <ReplyForm 
                        figure={figure}
                        parentPath={currentPath} 
                        onReplySuccess={() => {
                            setShowReplyForm(false);
                            if (!showReplies) setShowReplies(true);
                        }} 
                    />
                </div>
            )}
            
            {comment.replyCount > 0 && (
                <div className="mt-2 ml-10">
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => setShowReplies(!showReplies)}>
                        <CornerDownRight className="mr-1 h-3 w-3" />
                        {showReplies ? 'Ocultar respuestas' : `${comment.replyCount} ${comment.replyCount === 1 ? 'respuesta' : 'respuestas'}`}
                    </Button>
                </div>
            )}

            {showReplies && (
                <div className="mt-4 space-y-4">
                    {isLoadingReplies ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Cargando respuestas...</div>
                    ) : (
                        replies.map((reply, index) => (
                            <CommentItem 
                                key={reply.id} 
                                figure={figure}
                                comment={reply}
                                parentPath={`${currentPath}/replies`}
                                highlightedCommentId={highlightedCommentId}
                                isLastCommentFromAuthor={false} 
                                startWithRepliesOpen={
                                    (expansionPath && expansionPath.includes(reply.id)) || false
                                  }
                                  expansionPath={expansionPath}
                                  isLastInThread={index === replies.length - 1}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
