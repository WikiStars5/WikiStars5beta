
"use client";

import * as React from 'react';
import type { Figure, Comment as CommentType, UserProfile } from '@/lib/types';
import type { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight, Trash2, Send, Loader2 } from 'lucide-react';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addComment, deleteComment, toggleLikeComment, toggleDislikeComment, mapDocToComment } from '@/lib/placeholder-data';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, serverTimestamp, addDoc } from 'firebase/firestore';
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
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { getCountryEmojiByCode } from '@/config/countries';

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
    currentUserAuth: User | null;
    currentUserProfile: Pick<UserProfile, 'uid' | 'username' | 'photoURL' | 'gender' | 'countryCode' | 'country' | 'isAnonymous'> | null;
    isReply?: boolean;
}

export function CommentItem({ figure, comment, currentUserAuth, currentUserProfile, isReply = false }: CommentItemProps) {
    const [isReplying, setIsReplying] = React.useState(false);
    const [replyText, setReplyText] = React.useState('');
    const [replies, setReplies] = React.useState<CommentType[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);
    const [showReplies, setShowReplies] = React.useState(false);
    const [isPostingReply, setIsPostingReply] = React.useState(false);
    const { toast } = useToast();

    const canDelete = currentUserAuth?.uid === comment.authorId;
    const hasLiked = currentUserAuth ? comment.likes.includes(currentUserAuth.uid) : false;
    const hasDisliked = currentUserAuth ? comment.dislikes.includes(currentUserAuth.uid) : false;

    const genderSymbol = React.useMemo(() => {
        const genderOpt = GENDER_OPTIONS.find(g => g.value === comment.authorGender);
        return genderOpt?.symbol || null;
    }, [comment.authorGender]);

    const countryFlag = React.useMemo(() => {
        return getCountryEmojiByCode(comment.authorCountryCode || '');
    }, [comment.authorCountryCode]);

    const genderColorClass = React.useMemo(() => {
        if (comment.authorGender === 'male') return 'text-blue-400';
        if (comment.authorGender === 'female') return 'text-pink-400';
        return '';
    }, [comment.authorGender]);

    const fetchReplies = React.useCallback(() => {
        if (!showReplies) return;
        setIsLoadingReplies(true);
        const repliesRef = collection(db, `comments/${comment.id}/replies`);
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
    }, [comment.id, showReplies]);

    React.useEffect(() => {
        const unsubscribe = fetchReplies();
        return () => unsubscribe && unsubscribe();
    }, [fetchReplies]);

    const handleLike = async () => {
        if (!currentUserAuth) {
            toast({ title: "Acción requerida", description: "Debes iniciar sesión para dar me gusta.", variant: "destructive" });
            return;
        }
        try {
            const liked = await toggleLikeComment(comment.id, currentUserAuth.uid, isReply ? comment.parentId : undefined);
            
            if (liked && comment.authorId !== currentUserAuth.uid) {
                const notificationsCollectionRef = collection(db, 'notifications');
                await addDoc(notificationsCollectionRef, {
                    type: 'like',
                    userId: comment.authorId,
                    actorId: currentUserAuth.uid,
                    actorName: currentUserProfile?.username || 'Alguien',
                    actorPhotoUrl: currentUserProfile?.photoURL || '',
                    figureId: figure.id,
                    figureName: figure.name,
                    commentId: comment.id,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDislike = async () => {
        if (!currentUserAuth) {
            toast({ title: "Acción requerida", description: "Debes iniciar sesión para dar no me gusta.", variant: "destructive" });
            return;
        }
        try {
            await toggleDislikeComment(comment.id, currentUserAuth.uid, isReply ? comment.parentId : undefined);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        try {
            await deleteComment(comment.id, isReply ? comment.parentId : undefined);
            toast({ title: "Comentario Eliminado" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };
    
    const handlePostReply = async () => {
        if (!currentUserProfile || !currentUserAuth) return;
        if (replyText.trim().length < 3) return;
        
        setIsPostingReply(true);
        try {
            const authorData = {
                id: currentUserAuth.uid,
                name: currentUserProfile.username,
                photoUrl: currentUserProfile.photoURL || null,
                gender: currentUserProfile.gender || '',
                country: currentUserProfile.country || '',
                countryCode: currentUserProfile.countryCode || '',
                isAnonymous: currentUserProfile.isAnonymous || false,
            };

            const newReplyId = await addComment(figure.id, authorData, replyText.trim(), comment.id);

            if (comment.authorId !== currentUserAuth.uid) {
                const notificationsCollectionRef = collection(db, 'notifications');
                await addDoc(notificationsCollectionRef, {
                    type: 'reply',
                    userId: comment.authorId,
                    actorId: currentUserAuth.uid,
                    actorName: authorData.name,
                    actorPhotoUrl: authorData.photoUrl,
                    figureId: figure.id,
                    figureName: figure.name,
                    commentId: comment.id,
                    replyId: newReplyId, 
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }

            setReplyText('');
            setIsReplying(false);
            if (!showReplies) setShowReplies(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsPostingReply(false);
        }
    };

    return (
        <div className={cn("flex gap-4", isReply && "ml-8")}>
            <Avatar className="h-10 w-10">
                <AvatarImage src={correctMalformedUrl(comment.authorPhotoUrl)} alt={comment.authorName} />
                <AvatarFallback>{comment.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm">{comment.authorName}</p>
                            {genderSymbol && <span className={cn("text-sm", genderColorClass)} title={comment.authorGender}>{genderSymbol}</span>}
                            {countryFlag && <span title={comment.authorCountry}>{countryFlag}</span>}
                        </div>
                        {comment.createdAt && (
                            <p className="text-xs text-muted-foreground">{timeSince(comment.createdAt.toDate())}</p>
                        )}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                    <Button variant="ghost" size="sm" onClick={handleLike} disabled={!currentUserAuth} className="text-xs h-auto py-1 px-2">
                        <ThumbsUp className={cn("mr-1 h-3 w-3", hasLiked && "fill-current text-blue-500")} /> {comment.likeCount}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDislike} disabled={!currentUserAuth} className="text-xs h-auto py-1 px-2">
                        <ThumbsDown className={cn("mr-1 h-3 w-3", hasDisliked && "fill-current text-destructive")} /> {comment.dislikeCount}
                    </Button>
                    {!isReply && (
                        <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} className="text-xs h-auto py-1 px-2">
                            <MessageSquareReply className="mr-1 h-3 w-3" /> Responder
                        </Button>
                    )}
                    {canDelete && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2 text-destructive hover:text-destructive">
                                    <Trash2 className="mr-1 h-3 w-3" /> Eliminar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar comentario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Confirmas que quieres eliminar este comentario? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>No</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                {isReplying && (
                    <div className="mt-2 flex gap-2 items-start">
                        <Avatar className="h-8 w-8">
                             <AvatarImage src={correctMalformedUrl(currentUserProfile?.photoURL)} alt={currentUserProfile?.username} />
                            <AvatarFallback>{currentUserProfile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                             <Textarea 
                                placeholder={`Respondiendo a ${comment.authorName}...`} 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                className="text-sm"
                             />
                             <div className="flex justify-end gap-2 mt-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancelar</Button>
                                <Button size="sm" onClick={handlePostReply} disabled={isPostingReply}>
                                     {isPostingReply ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <Send className="mr-1 h-4 w-4"/>}
                                     Enviar
                                </Button>
                             </div>
                        </div>
                    </div>
                )}
                
                 {!isReply && comment.replyCount > 0 && (
                    <div className="mt-2">
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
                                    comment={{...reply, parentId: comment.id}}
                                    currentUserAuth={currentUserAuth}
                                    currentUserProfile={currentUserProfile}
                                    isReply 
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Add parentId to CommentType temporarily for prop drilling
declare module '@/lib/types' {
    interface Comment {
        parentId?: string;
    }
}

    

    

    