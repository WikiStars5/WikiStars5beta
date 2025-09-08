
"use client";

import * as React from 'react';
import type { Figure, Comment as CommentType, RatingValue } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight, Loader2, Star, StarOff } from 'lucide-react';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { mapDocToComment, toggleDislikeComment, toggleLikeComment, addReply } from '@/lib/placeholder-data';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';

const TRUNCATE_LENGTH = 280; // Characters to show before truncating
const MAX_REPLY_DEPTH = 4; // Set a maximum nesting level for replies

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
}

const RatingDisplay = ({ rating, maxRating = 5 }: { rating: RatingValue, maxRating?: number }) => {
    if (rating === 0) {
        return (
            <div className="flex items-center gap-0.5" title="0 Estrellas">
                <StarOff className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground ml-1">Sin calificación</span>
            </div>
        );
    }
    
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(maxRating)].map((_, i) => (
                <Star 
                    key={`star-${i}`} 
                    className={cn(
                        "h-4 w-4",
                        rating >= (i + 1) ? "text-primary fill-current" : "text-muted-foreground/30"
                    )}
                />
            ))}
        </div>
    );
};

const ReplyForm = ({ figure, parentPath, onReplySuccess }: { figure: Figure, parentPath: string, onReplySuccess: () => void }) => {
    const [text, setText] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const { toast } = useToast();
    const { currentUser, firebaseUser, isLoading: isAuthLoading } = useAuth();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || isSubmitting) return;

        const userId = firebaseUser?.uid || localStorage.getItem('wikistars5-guestId');
        if (!userId) {
          toast({ title: "Error", description: "No se pudo identificar al usuario.", variant: "destructive" });
          return;
        }

        setIsSubmitting(true);
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
            await addReply(parentPath, figure.id, authorData, text);
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


export function CommentItem({ 
    figure, 
    comment, 
    parentPath,
    highlightedCommentId,
}: CommentItemProps) {
    const { currentUser, firebaseUser, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const [replies, setReplies] = React.useState<CommentType[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);
    const [showReplies, setShowReplies] = React.useState(false);
    const [showReplyForm, setShowReplyForm] = React.useState(false);
    const [isProcessingLike, setIsProcessingLike] = React.useState(false);
    const [isHighlighted, setIsHighlighted] = React.useState(false);
    const commentRef = React.useRef<HTMLDivElement>(null);


    const [isExpanded, setIsExpanded] = React.useState(false);
    const isLongComment = comment.text.length > TRUNCATE_LENGTH;
    
    const currentPath = `${parentPath}/${comment.id}`;
    const depth = (parentPath.match(/replies/g) || []).length;
    const canReply = depth < MAX_REPLY_DEPTH;

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

    const fetchReplies = React.useCallback(() => {
        if (!showReplies) return;
        setIsLoadingReplies(true);
        const repliesPath = `${currentPath}/replies`;
        const repliesRef = collection(db, repliesPath);
        const q = query(repliesRef, orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedReplies = snapshot.docs.map(mapDocToComment);
            setReplies(fetchedReplies);
            setIsLoadingReplies(false);
        }, (error) => {
            console.error("Error fetching replies: ", error);
            setIsLoadingReplies(false);
        });
        return unsubscribe;
    }, [showReplies, currentPath]);

    React.useEffect(() => {
        const unsubscribe = fetchReplies();
        return () => unsubscribe && unsubscribe();
    }, [fetchReplies]);

    const getUserId = () => firebaseUser?.uid || localStorage.getItem('wikistars5-guestId');

    const handleLike = async (isLike: boolean) => {
        if (isProcessingLike || isAuthLoading) return;
        const userId = getUserId();
        if (!userId) {
            toast({ title: "Error", description: "Debes iniciar sesión o recargar la página como invitado para reaccionar.", variant: "destructive" });
            return;
        }

        setIsProcessingLike(true);
        try {
            if (isLike) {
                await toggleLikeComment(currentPath, userId);
            } else {
                 await toggleDislikeComment(currentPath, userId, comment.authorId, figure.id, figure.name, comment.id);
            }
        } catch (error: any) {
            console.error("Error liking/disliking:", error);
            toast({ title: "Error", description: `No se pudo registrar tu reacción. ${error.message}`, variant: "destructive" });
        } finally {
            setIsProcessingLike(false);
        }
    };


    return (
        <div ref={commentRef} className={cn(depth > 0 && "ml-4 md:ml-8")} id={`comment-${comment.id}`}>
            <div className={cn(
                "flex-grow bg-muted/50 p-3 rounded-lg transition-colors duration-1000",
                isHighlighted ? "bg-primary/20" : ""
            )}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={correctMalformedUrl(comment.authorPhotoUrl)} alt={comment.authorName} />
                            <AvatarFallback>{comment.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm">{comment.authorName}</p>
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
                    </div>
                    {comment.createdAt && (
                        <p className="text-xs text-muted-foreground flex-shrink-0">{timeSince(comment.createdAt.toDate())}</p>
                    )}
                </div>
                
                {comment.rating !== undefined && comment.rating !== null && (
                    <div className="mt-2 ml-10">
                        <RatingDisplay rating={comment.rating} />
                    </div>
                )}
                
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
            </div>
            <div className="flex items-center gap-2 mt-1 px-1 ml-10">
                <Button variant="ghost" size="sm" onClick={() => handleLike(true)} disabled={isProcessingLike || isAuthLoading} className="text-xs h-auto py-1 px-2">
                    <ThumbsUp className="mr-1 h-3 w-3" /> {comment.likeCount}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleLike(false)} disabled={isProcessingLike || isAuthLoading} className="text-xs h-auto py-1 px-2">
                    <ThumbsDown className="mr-1 h-3 w-3" /> {comment.dislikeCount}
                </Button>
                {canReply && (
                    <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} disabled={isAuthLoading} className="text-xs h-auto py-1 px-2">
                        <MessageSquareReply className="mr-1 h-3 w-3" /> Responder
                    </Button>
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
                        replies.map(reply => (
                            <CommentItem 
                                key={reply.id} 
                                figure={figure}
                                comment={reply}
                                parentPath={`${currentPath}/replies`}
                                highlightedCommentId={highlightedCommentId}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

