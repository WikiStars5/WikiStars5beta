
"use client";

import * as React from 'react';
import type { Figure, Comment as CommentType } from '@/lib/types';
import type { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight, Trash2, Send, Loader2 } from 'lucide-react';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addReply, deleteComment, toggleLikeComment, toggleDislikeComment, mapDocToComment } from '@/lib/placeholder-data';
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
import { useAuth } from '@/hooks/useAuth';

const MAX_COMMENT_LENGTH = 1000;
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
}

export function CommentItem({ 
    figure, 
    comment, 
    parentPath
}: CommentItemProps) {
    const [isReplying, setIsReplying] = React.useState(false);
    const [replyText, setReplyText] = React.useState('');
    const [replies, setReplies] = React.useState<CommentType[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);
    const [showReplies, setShowReplies] = React.useState(false);
    const [isPostingReply, setIsPostingReply] = React.useState(false);
    const { toast } = useToast();
    const { user: firestoreUser, firebaseUser, isAnonymous } = useAuth();
    
    const currentPath = `${parentPath}/${comment.id}`;
    const depth = (parentPath.match(/replies/g) || []).length;
    const canReply = depth < MAX_REPLY_DEPTH;

    const canDelete = firebaseUser?.uid === comment.authorId;
    const hasLiked = firebaseUser ? comment.likes.includes(firebaseUser.uid) : false;
    const hasDisliked = firebaseUser ? comment.dislikes.includes(firebaseUser.uid) : false;

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

    const handleLike = async () => {
        if (!firebaseUser) {
            toast({ title: "Acción requerida", description: "Debes iniciar sesión o crear un perfil de invitado para dar me gusta.", variant: "destructive" });
            return;
        }
        try {
            const liked = await toggleLikeComment(currentPath, firebaseUser.uid);
            
            if (liked && comment.authorId !== firebaseUser.uid) {
                const notificationsCollectionRef = collection(db, 'notifications');
                await addDoc(notificationsCollectionRef, {
                    type: 'like',
                    userId: comment.authorId,
                    actorId: firebaseUser.uid,
                    actorName: firestoreUser?.username || 'Alguien',
                    actorPhotoUrl: firestoreUser?.photoURL || '',
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
        if (!firebaseUser) {
            toast({ title: "Acción requerida", description: "Debes iniciar sesión para dar no me gusta.", variant: "destructive" });
            return;
        }
        try {
            await toggleDislikeComment(currentPath, firebaseUser.uid);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!canDelete) return;
        try {
            await deleteComment(currentPath);
            toast({ title: "Comentario Eliminado" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };
    
    const handlePostReply = async () => {
        if (!firebaseUser) return;
        if (replyText.trim().length < 3) return;
        if (replyText.length > MAX_COMMENT_LENGTH) {
            toast({
                title: "Respuesta demasiado larga",
                description: `Tu respuesta no puede exceder los ${MAX_COMMENT_LENGTH} caracteres.`,
                variant: "destructive"
            });
            return;
        }
        
        setIsPostingReply(true);

        let authorData;
        if (isAnonymous) {
            const guestUsername = localStorage.getItem('wikistars5-guestUsername');
            const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
            const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode') || '';
            if (!guestUsername) {
                toast({ title: "Perfil de invitado no encontrado", description: "Por favor, configura tu perfil para responder.", variant: "destructive" });
                setIsPostingReply(false);
                return;
            }
            authorData = {
                id: firebaseUser.uid,
                name: guestUsername,
                photoUrl: null,
                gender: guestGender,
                country: '', 
                countryCode: guestCountryCode,
                isAnonymous: true,
            }
        } else if (firestoreUser) {
            authorData = {
                id: firestoreUser.uid,
                name: firestoreUser.username,
                photoUrl: firestoreUser.photoURL || null,
                gender: firestoreUser.gender || '',
                country: firestoreUser.country || '',
                countryCode: firestoreUser.countryCode || '',
                isAnonymous: false,
            }
        } else {
             toast({ title: "Error", description: "No se pudo obtener la información del autor.", variant: "destructive" });
             setIsPostingReply(false);
             return;
        }

        try {
            const newReplyId = await addReply(currentPath, figure.id, authorData, replyText.trim());

            if (comment.authorId !== firebaseUser.uid) {
                const notificationsCollectionRef = collection(db, 'notifications');
                await addDoc(notificationsCollectionRef, {
                    type: 'reply',
                    userId: comment.authorId,
                    actorId: authorData.id,
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
        <div className={cn("flex gap-4", depth > 0 && "ml-4 md:ml-8")}>
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
                    <Button variant="ghost" size="sm" onClick={handleLike} disabled={!firebaseUser} className="text-xs h-auto py-1 px-2">
                        <ThumbsUp className={cn("mr-1 h-3 w-3 transition-all duration-200 ease-in-out active:scale-150", hasLiked && "fill-current text-blue-500")} /> {comment.likeCount}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDislike} disabled={!firebaseUser} className="text-xs h-auto py-1 px-2">
                        <ThumbsDown className={cn("mr-1 h-3 w-3 transition-all duration-200 ease-in-out active:scale-150", hasDisliked && "fill-current text-destructive")} /> {comment.dislikeCount}
                    </Button>
                    {canReply && (
                        <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} disabled={!firebaseUser} className="text-xs h-auto py-1 px-2">
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
                                    ¿Confirmas que quieres eliminar este comentario? Todas las respuestas anidadas también serán eliminadas. Esta acción no se puede deshacer.
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
                             <AvatarImage src={correctMalformedUrl(firestoreUser?.photoURL)} alt={firestoreUser?.username} />
                            <AvatarFallback>{firestoreUser?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow space-y-2">
                             <Textarea 
                                placeholder={`Respondiendo a ${comment.authorName}...`} 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                className="text-sm"
                                maxLength={MAX_COMMENT_LENGTH}
                             />
                             <div className="flex justify-between items-center">
                                <p className={cn(
                                    "text-xs text-muted-foreground",
                                    replyText.length > MAX_COMMENT_LENGTH && "text-destructive"
                                )}>
                                    {replyText.length} / {MAX_COMMENT_LENGTH}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancelar</Button>
                                    <Button size="sm" onClick={handlePostReply} disabled={isPostingReply}>
                                        {isPostingReply ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <Send className="mr-1 h-4 w-4"/>}
                                        Enviar
                                    </Button>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
                
                 {comment.replyCount > 0 && (
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
                                    comment={reply}
                                    parentPath={`${currentPath}/replies`}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
