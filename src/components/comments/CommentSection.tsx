

"use client";

import * as React from 'react';
import type { Figure, UserComment, StarValue, StarValueAsString, UserStarRating } from "@/lib/types";
import { db, app } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc, runTransaction, query, where, orderBy, limit, getDocs, Timestamp, setDoc, deleteDoc, increment, writeBatch } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateCommentLikes } from "@/app/actions/commentRatingActions";
import { grantEstrellaBrillanteAchievement, grantMiPrimeraContribucionAchievement, grantDialogoAbiertoAchievement } from '@/app/actions/achievementActions';
import { countryCodeToNameMap } from "@/config/countries";
import { GENDER_OPTIONS } from "@/config/genderOptions";
import { ADMIN_UID } from '@/config/admin';
import { cn, correctMalformedUrl } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/StarRating";
import { ShareButton } from "@/components/shared/ShareButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    MessagesSquare, Send, Trash2, ThumbsUp, ThumbsDown, MessageSquareReply, Loader2, UserPlus, LogIn
} from "lucide-react";
import Link from 'next/link';
import NextImage from 'next/image';

interface CommentSectionProps {
    figure: Figure;
    currentUser: User | null;
    onNewComment: () => void;
    setAnimationStreak: (streak: number | null) => void;
}

const STAR_SOUND_URLS: Record<StarValue, string> = {
  1: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar1.mp3?alt=media&token=a11df570-a6ee-4828-b5a9-81ccbb2c0457",
  2: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar2.mp3?alt=media&token=58cbf607-df0b-4bbd-b28e-291cf1951c18",
  3: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar3.mp3?alt=media&token=df67dc5b-28ab-4773-8266-60b9127a325f",
  4: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar4.mp3?alt=media&token=40c72095-e6a0-42d6-a3f6-86a81c356826",
  5: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar5.mp3?alt=media&token=8705fce9-1baa-4f49-8783-7bfc9d35a80f",
};


export function CommentSection({ figure, currentUser, onNewComment, setAnimationStreak }: CommentSectionProps) {
    const { toast } = useToast();
    const router = useRouter();

    const [anonymousUserCountryCode, setAnonymousUserCountryCode] = React.useState<string | null>(null);
    const [newComment, setNewComment] = React.useState("");
    const [newCommentStars, setNewCommentStars] = React.useState<StarValue | null>(null);
    const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
    
    const [isGuestInfoDialogOpen, setIsGuestInfoDialogOpen] = React.useState(false);
    const [tempGuestUsername, setTempGuestUsername] = React.useState("");
    const [tempGuestGender, setTempGuestGender] = React.useState("");
    const [isGuestInfoSet, setIsGuestInfoSet] = React.useState(false);


    const [commentsList, setCommentsList] = React.useState<UserComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = React.useState(true);
    const [votingCommentId, setVotingCommentId] = React.useState<string | null>(null);
    const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
    const [replyText, setReplyText] = React.useState("");
    const [isSubmittingReply, setIsSubmittingReply] = React.useState<string | null>(null);

    const [replies, setReplies] = React.useState<Record<string, UserComment[]>>({});
    const [visibleReplies, setVisibleReplies] = React.useState<Record<string, boolean>>({});
    const [loadingReplies, setLoadingReplies] = React.useState<Record<string, boolean>>({});
    const [commentSortOrder, setCommentSortOrder] = React.useState('newest');

    const [starAudios, setStarAudios] = React.useState<Partial<Record<StarValue, HTMLAudioElement>>>({});

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const [commentToDeleteId, setCommentToDeleteId] = React.useState<string | null>(null);
    
    const [expandedComments, setExpandedComments] = React.useState<Record<string, boolean>>({});
    const [highlightedCommentId, setHighlightedCommentId] = React.useState<string | null>(null);

    const MAX_COMMENT_LENGTH = 1000;
    const COMMENT_TRUNCATE_LENGTH = 350;

    const canCommentOrRate = !!currentUser;

    const displayedComments = React.useMemo(() => {
        if (isLoadingComments) return [];
        let commentsToDisplay = [...commentsList];

        switch (commentSortOrder) {
        case 'mostVoted':
            commentsToDisplay = commentsToDisplay.filter(
            (comment) => (comment.likes || 0) > 0 || (comment.dislikes || 0) > 0
            );
            commentsToDisplay.sort((a, b) => {
            const scoreA = (a.likes || 0) - (a.dislikes || 0);
            const scoreB = (b.likes || 0) - (b.dislikes || 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;
            if (likesB !== likesA) return likesB - likesA;
            return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
            break;
        case 'myComment':
            if (!currentUser || currentUser.isAnonymous) {
            commentsToDisplay = [];
            } else {
            commentsToDisplay = commentsToDisplay.filter(
                (comment) => comment.userId === currentUser.uid
            );
            }
            break;
        case 'newest':
        default:
            commentsToDisplay.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            break;
        }
        return commentsToDisplay;
    }, [commentsList, commentSortOrder, currentUser, isLoadingComments]);

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const audios: Partial<Record<StarValue, HTMLAudioElement>> = {};
            (Object.keys(STAR_SOUND_URLS) as unknown as StarValue[]).forEach(key => {
                const numericKey = Number(key) as StarValue; 
                if (STAR_SOUND_URLS[numericKey]) { 
                const audio = new Audio(STAR_SOUND_URLS[numericKey]);
                audio.preload = "auto";
                audios[numericKey] = audio; 
                }
            });
            setStarAudios(audios);
        }
    }, []);

    const playSoundEffect = React.useCallback((starValue: StarValue) => {
        const audio = starAudios[starValue];
        if (audio) {
        audio.currentTime = 0; 
        audio.play().catch(error => console.error(`Error playing sound for star ${starValue}:`, error));
        } else {
        console.warn(`Audio for star ${starValue} not loaded.`);
        }
    }, [starAudios]);

    const loadLocalStarRating = React.useCallback(() => {
      if (!currentUser || !figure?.id) return;
      try {
        const localRatingsJSON = localStorage.getItem('wikistars5-userStarRatings');
        if (localRatingsJSON) {
          const localRatings: UserStarRating[] = JSON.parse(localRatingsJSON);
          const currentVote = localRatings.find(r => r.figureId === figure.id);
          if (currentVote) {
            setNewCommentStars(currentVote.starValue);
          } else {
            setNewCommentStars(null);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, [currentUser, figure?.id]);

    React.useEffect(() => {
      if (currentUser) {
        if (currentUser.isAnonymous) {
          const savedGuestName = localStorage.getItem('wikistars5-guestUsername');
          const savedGuestGender = localStorage.getItem('wikistars5-guestGender');
          if (savedGuestName && savedGuestGender) {
            setIsGuestInfoSet(true);
            setTempGuestUsername(savedGuestName);
            setTempGuestGender(savedGuestGender);
          }
        }
        loadLocalStarRating(); // Load from localStorage first

        // Then, sync with Firestore to get the most updated state
        const userStarRatingDocRef = doc(db, 'userStarRatings', `${currentUser.uid}_${figure.id}`);
        getDoc(userStarRatingDocRef).then(docSnap => {
          if (docSnap.exists()) {
            setNewCommentStars(docSnap.data().starValue as StarValue);
          } else {
            // Only clear if not already set by local storage to avoid flicker
            if (newCommentStars === null) {
              setNewCommentStars(null);
            }
          }
        }).catch(error => console.error("Error syncing star rating from Firestore:", error));

      } else {
        // Reset for logged out users
        setNewCommentStars(null);
        setIsGuestInfoSet(false);
        setTempGuestUsername("");
        setTempGuestGender("");
      }
    }, [figure?.id, currentUser, loadLocalStarRating]);


    React.useEffect(() => {
        const fetchCountryCode = async () => {
        if (currentUser && currentUser.isAnonymous && !anonymousUserCountryCode) {
            try {
            const response = await fetch('https://ipapi.co/country_code/');
            if (response.ok) {
                const countryCode = await response.text();
                setAnonymousUserCountryCode(countryCode.trim());
            }
            } catch (error) {
            console.warn("Could not fetch anonymous user country:", error);
            }
        }
        };
        fetchCountryCode();
    }, [currentUser, anonymousUserCountryCode]);


    const fetchComments = React.useCallback(async () => {
        if (!figure.id) {
            setCommentsList([]);
            setIsLoadingComments(false);
            return;
        }
        setCommentsList([]); 
        setIsLoadingComments(true);
        try {
        const commentsQuery = query(
            collection(db, 'userComments'),
            where('figureId', '==', figure.id),
            where('parentId', '==', null), 
            orderBy('createdAt', 'desc'),
            limit(50) 
        );
        const querySnapshot = await getDocs(commentsQuery);
        const fetchedComments: UserComment[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedComments.push({
            id: docSnap.id,
            ...data
            } as UserComment);
        });
        setCommentsList(fetchedComments);
        } catch (error: any) {
        console.error("Error fetching comments:", error); 
        let errorMessage = "No se pudieron cargar los comentarios.";
        if (error.code === 'unavailable' || (error.message && (error.message.toLowerCase().includes('deadline') || error.message.toLowerCase().includes('could not reach')))) {
            errorMessage = "La conexión con la base de datos ha tardado demasiado. Esto puede ser por una conexión lenta o por la falta de un índice en Firestore. Revisa la consola del navegador (F12) para ver si hay un enlace para crear el índice.";
        } else if (error.message && (error.message.includes("firestore/failed-precondition") || error.message.toLowerCase().includes('index')) ) {
            errorMessage = "Error al cargar comentarios: Falta un índice en Firestore. Revisa la consola del navegador (F12) para un enlace que te permita crearlo.";
        } else if (error.message) {
            errorMessage = `No se pudieron cargar los comentarios. Detalles: ${error.message}`;
        }
        toast({ title: "Error al Cargar Comentarios", description: errorMessage, variant: "destructive", duration: 10000 });
        setCommentsList([]); 
        } finally {
        setIsLoadingComments(false);
        }
    }, [figure.id, toast]);

    const handleToggleReplies = React.useCallback(async (commentId: string, forceRefresh = false) => {
        if (visibleReplies[commentId] && !forceRefresh) {
        setVisibleReplies(prev => ({ ...prev, [commentId]: false }));
        return;
        }

        setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
        try {
        const repliesQuery = query(
            collection(db, 'userComments'),
            where('parentId', '==', commentId),
            orderBy('createdAt', 'asc')
        );
        const querySnapshot = await getDocs(repliesQuery);
        const fetchedReplies: UserComment[] = [];
        querySnapshot.forEach((doc) => {
            fetchedReplies.push({ id: doc.id, ...doc.data() } as UserComment);
        });
        setReplies(prev => ({ ...prev, [commentId]: fetchedReplies }));
        setVisibleReplies(prev => ({ ...prev, [commentId]: true }));
        } catch (error) {
        console.error("Error fetching replies:", error);
        toast({ title: "Error", description: "No se pudieron cargar las respuestas.", variant: "destructive" });
        } finally {
        setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
        }
    }, [toast, visibleReplies]);

    React.useEffect(() => {
        if (figure.id) {
        fetchComments();
        }
    }, [figure.id, fetchComments]);
    
    React.useEffect(() => {
        const handleHighlighting = async () => {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#comment-')) return;
    
        const targetId = hash.substring(1);
        
        const findAndHighlight = () => {
            const element = document.getElementById(targetId);
            if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCommentId(targetId);
            setTimeout(() => setHighlightedCommentId(null), 5000); 
            history.replaceState(null, '', ' ');
            return true;
            }
            return false;
        };
    
        if (findAndHighlight()) {
            return;
        }
    
        const potentialReplyId = targetId.replace('comment-', '');
        try {
            const replyRef = doc(db, 'userComments', potentialReplyId);
            const replySnap = await getDoc(replyRef);
            if (replySnap.exists()) {
            const parentId = replySnap.data().parentId;
            if (parentId && !visibleReplies[parentId]) {
                await handleToggleReplies(parentId, true); 
                setTimeout(findAndHighlight, 100);
            }
            }
        } catch (error) {
            console.error("Error pre-fetching reply for highlighting:", error);
        }
        };
    
        const timer = setTimeout(handleHighlighting, 100); 
        return () => clearTimeout(timer);
    }, [isLoadingComments, handleToggleReplies, visibleReplies]);

    const handleSaveGuestInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempGuestUsername.trim() || !tempGuestGender) {
            toast({ title: "Campos Requeridos", description: "Por favor, introduce un nombre y selecciona un sexo.", variant: "destructive" });
            return;
        }

        const username = tempGuestUsername.trim();
        const gender = tempGuestGender;
        
        localStorage.setItem('wikistars5-guestUsername', username);
        localStorage.setItem('wikistars5-guestGender', gender);
        setIsGuestInfoSet(true);
        setIsGuestInfoDialogOpen(false);
        toast({ title: "¡Identidad de Invitado Guardada!", description: `Ahora puedes comentar como ${username}.` });
    };
  
    const updateLocalStreak = () => {
        try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const streaksJSON = localStorage.getItem('wikistars5-userStreaks');
        let streaks = streaksJSON ? JSON.parse(streaksJSON) : [];
        let figureStreak = streaks.find((s:any) => s.figureId === figure.id);
        let newStreakValue = 1;

        if (figureStreak) {
            const lastCommentDate = new Date(figureStreak.lastCommentDate);
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            
            if (figureStreak.lastCommentDate === todayStr) {
            return;
            } else if (lastCommentDate.toDateString() === yesterday.toDateString()) {
            figureStreak.currentStreak += 1;
            } else {
            figureStreak.currentStreak = 1;
            }
            figureStreak.lastCommentDate = todayStr;
            newStreakValue = figureStreak.currentStreak;
        } else {
            streaks.push({
            figureId: figure.id,
            figureName: figure.name,
            figurePhotoUrl: figure.photoUrl,
            currentStreak: 1,
            lastCommentDate: todayStr,
            });
        }
        
        localStorage.setItem('wikistars5-userStreaks', JSON.stringify(streaks));
        onNewComment();
        setAnimationStreak(newStreakValue);

        } catch (error) {
        console.error("Error updating local streak:", error);
        }
    };


    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canCommentOrRate || !currentUser) {
            toast({ title: "Error", description: "Debes estar conectado para opinar.", variant: "destructive" });
            return;
        }
        if (currentUser.isAnonymous && !isGuestInfoSet) {
            toast({ title: "Información Requerida", description: "Por favor, define tu identidad de invitado para poder comentar.", variant: "destructive" });
            return;
        }
        if (newComment.trim() === "" || newComment.length > MAX_COMMENT_LENGTH) {
            toast({ title: "Comentario Inválido", description: `El comentario no puede estar vacío o exceder los ${MAX_COMMENT_LENGTH} caracteres.`, variant: "destructive" });
            return;
        }
        setIsSubmittingComment(true);
        
        const userStarRatingDocRef = doc(db, "userStarRatings", `${currentUser.uid}_${figure.id}`);
        const commentsCollectionRef = collection(db, 'userComments');
        
        try {
            // Optimistic UI update for star rating in localStorage
            const localRatingsJSON = localStorage.getItem('wikistars5-userStarRatings');
            let localRatings: UserStarRating[] = localRatingsJSON ? JSON.parse(localRatingsJSON) : [];
            localRatings = localRatings.filter(r => r.figureId !== figure.id);
            if (newCommentStars) {
                localRatings.push({ userId: currentUser.uid, figureId: figure.id, starValue: newCommentStars, timestamp: new Date() as any });
            }
            localStorage.setItem('wikistars5-userStarRatings', JSON.stringify(localRatings));

            const newCommentRef = doc(commentsCollectionRef);
            const commentData: any = {
                id: newCommentRef.id,
                figureId: figure.id,
                userId: currentUser.uid,
                username: currentUser.isAnonymous ? "Invitado" : (currentUser.displayName || "Usuario Anónimo"),
                userPhotoURL: currentUser.photoURL || null,
                text: newComment.trim(),
                starRatingGiven: newCommentStars, 
                createdAt: serverTimestamp(),
                likes: 0,
                dislikes: 0,
                likedBy: [],
                dislikedBy: [],
                parentId: null,
                replyCount: 0,
                isAnonymous: currentUser.isAnonymous,
            };

            if (currentUser.isAnonymous) {
                commentData.guestUsername = localStorage.getItem('wikistars5-guestUsername');
                commentData.guestUsernameLower = localStorage.getItem('wikistars5-guestUsername')?.toLowerCase();
                commentData.guestGender = localStorage.getItem('wikistars5-guestGender');
                if (anonymousUserCountryCode) {
                    commentData.userCountryCode = anonymousUserCountryCode;
                }
            }
            
            // Client only writes the comment and the separate rating doc.
            // The Cloud Function trigger will handle updating the counters on the figure document.
            const batch = writeBatch(db);
            batch.set(newCommentRef, commentData);
            if (newCommentStars) {
                batch.set(userStarRatingDocRef, { 
                    userId: currentUser.uid,
                    figureId: figure.id,
                    starValue: newCommentStars,
                    timestamp: serverTimestamp(),
                });
            } else {
                batch.delete(userStarRatingDocRef);
            }
            await batch.commit();
        
        updateLocalStreak();
        
        if (newCommentStars) {
            playSoundEffect(newCommentStars);
        }

        toast({
            title: "¡Opinión Enviada!",
            description: "¡Gracias por contribuir! Compártelo para que más gente opine.",
            duration: 8000,
            action: (
            <ShareButton figureName={figure.name} figureId={figure.id} showText />
            ),
        });
        
        if (!currentUser.isAnonymous) {
            if (newCommentStars) {
                const achResult1 = await grantEstrellaBrillanteAchievement(currentUser.uid);
                if (achResult1.unlocked) toast({ title: "¡Logro Desbloqueado!", description: achResult1.message });
            }
            const achResult2 = await grantMiPrimeraContribucionAchievement(currentUser.uid);
            if (achResult2.unlocked) toast({ title: "¡Logro Desbloqueado!", description: achResult2.message });
        }

        setNewComment("");
        fetchComments(); 
        onNewComment();
        } catch (error: any) {
            console.error("Error submitting opinion:", error);
            let errorMessage = `No se pudo enviar tu opinión. ${error.message}`;
            toast({ title: "Error al Enviar", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmittingComment(false);
        }
    };


    const handleLikeDislike = async (commentId: string, action: 'like' | 'dislike', parentCommentId: string | null = null) => {
        if (!currentUser || !figure) {
        toast({ title: 'Acción Requerida', description: 'Debes estar conectado para votar.' });
        return;
        }
        if (votingCommentId) return;

        setVotingCommentId(commentId);
        
        try {
            const actorName = currentUser.isAnonymous ? (localStorage.getItem('wikistars5-guestUsername') || "Invitado") : (currentUser.displayName || "Usuario Anónimo");
            
            const result = await updateCommentLikes(
            commentId,
            figure.id,
            figure.name,
            currentUser.uid,
            actorName,
            currentUser.photoURL,
            action
            );

            if (!result.success) {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
            } else {
                const updateList = (list: UserComment[]) => list.map(c => {
                    if (c.id === commentId) {
                        return { ...c, likes: result.newLikes ?? c.likes, dislikes: result.newDislikes ?? c.dislikes };
                    }
                    return c;
                });
                if (parentCommentId) {
                    setReplies(prev => ({...prev, [parentCommentId]: updateList(prev[parentCommentId])}));
                } else {
                    setCommentsList(prev => updateList(prev));
                }
            }
        } catch (error: any) {
            console.error("Error al llamar a la acción del servidor para me gusta/no me gusta:", error);
            toast({ title: 'Error', description: `Error inesperado al votar: ${error.message}`, variant: 'destructive' });
        } finally {
            setVotingCommentId(null);
            if (parentCommentId) {
            handleToggleReplies(parentCommentId, true);
            } else {
            fetchComments();
            }
        }
    };

    const handleDeleteCommentConfirmation = async () => {
        if (!commentToDeleteId || !figure || !currentUser) return;
        
        try {
            const commentRef = doc(db, "userComments", commentToDeleteId);
            const commentToDeleteSnap = await getDoc(commentRef);
        
            if (!commentToDeleteSnap.exists()) {
                toast({ title: "Error", description: "El comentario ya no existe.", variant: "destructive" });
                setIsDeleteDialogOpen(false);
                setCommentToDeleteId(null);
                return;
            }
    
            // The Cloud Function onDelete trigger will handle decrementing counters.
            // Client is now only responsible for deleting the documents.
    
            const batch = writeBatch(db);
    
            // Delete the main comment
            batch.delete(commentRef);
    
            // Find and delete all replies
            const repliesQuery = query(collection(db, 'userComments'), where('parentId', '==', commentToDeleteId));
            const repliesSnapshot = await getDocs(repliesQuery);
            repliesSnapshot.forEach(replyDoc => batch.delete(replyDoc.ref));
    
            await batch.commit();
    
            toast({ title: "Comentario Eliminado", description: "El comentario y sus respuestas han sido eliminados." });
        
            // If the deleted comment had a star rating, optimistically update local state.
            const commentToDeleteData = commentToDeleteSnap.data() as UserComment;
            if (commentToDeleteData.starRatingGiven && currentUser.uid === commentToDeleteData.userId) {
                setNewCommentStars(null);
                try {
                    const localRatingsJSON = localStorage.getItem('wikistars5-userStarRatings');
                    let localRatings: UserStarRating[] = localRatingsJSON ? JSON.parse(localRatingsJSON) : [];
                    localRatings = localRatings.filter(r => r.figureId !== figure.id);
                    localStorage.setItem('wikistars5-userStarRatings', JSON.stringify(localRatings));
                } catch(e) { console.error("Error clearing local star rating", e); }
            }
            
            if (commentToDeleteData.parentId) {
                handleToggleReplies(commentToDeleteData.parentId, true);
            } else {
                fetchComments();
            }
            
            router.refresh();

        } catch (error: any) {
            console.error("Error deleting comment and its replies:", error);
            let errorMessage = `No se pudo eliminar el comentario. ${error.message}`;
            toast({ title: "Error al Eliminar", description: errorMessage, variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setCommentToDeleteId(null);
        }
    };


    const openDeleteDialog = (commentId: string) => {
        setCommentToDeleteId(commentId);
        setIsDeleteDialogOpen(true);
    };

    const handleReplyClick = (commentId: string) => {
        if (replyingTo === commentId) {
        setReplyingTo(null); 
        } else {
        setReplyingTo(commentId);
        setReplyText(""); 
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!canCommentOrRate || !currentUser || !figure) {
        toast({ title: "Acción Requerida", description: "Debes estar conectado para responder.", variant: "destructive" });
        return;
        }
        if (currentUser.isAnonymous && !isGuestInfoSet) {
        toast({ title: "Información Requerida", description: "Por favor, define tu identidad de invitado para poder responder.", variant: "destructive" });
        return;
        }
        if (!replyText.trim() || replyText.length > MAX_COMMENT_LENGTH) {
        toast({ title: "Respuesta Inválida", description: `La respuesta no puede estar vacía o exceder los ${MAX_COMMENT_LENGTH} caracteres.`, variant: "destructive" });
        return;
        }
        setIsSubmittingReply(parentId);

        const replyData: any = {
        figureId: figure.id,
        userId: currentUser.uid,
        username: currentUser.isAnonymous ? "Invitado" : (currentUser.displayName || "Usuario Anónimo"),
        userPhotoURL: currentUser.photoURL || null,
        text: replyText.trim(),
        starRatingGiven: null,
        createdAt: serverTimestamp(),
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        parentId: parentId,
        replyCount: 0,
        isAnonymous: currentUser.isAnonymous,
        };

        if (currentUser.isAnonymous) {
        replyData.guestUsername = localStorage.getItem('wikistars5-guestUsername');
        replyData.userCountryCode = anonymousUserCountryCode;
        replyData.guestGender = localStorage.getItem('wikistars5-guestGender');
        }
        
        try {
            // The client just writes the new reply document.
            // The Cloud Function will handle incrementing the figure's and parent comment's counters,
            // and creating a notification.
            await addDoc(collection(db, 'userComments'), replyData);
            
            updateLocalStreak();

            toast({ title: "Respuesta Enviada", description: "Tu respuesta ha sido guardada." });
            if (!currentUser.isAnonymous) {
                const achResult = await grantDialogoAbiertoAchievement(currentUser.uid);
                if (achResult.unlocked) toast({ title: "¡Logro Desbloqueado!", description: achResult.message });
            }
            setReplyText("");
            setReplyingTo(null);
            handleToggleReplies(parentId, true); 
        } catch (error: any) {
            console.error("Error submitting reply:", error);
            toast({ title: "Error al Responder", description: `No se pudo enviar tu respuesta. ${error.message}`, variant: "destructive" });
        } finally {
            setIsSubmittingReply(null);
        }
    };


    const toggleCommentExpansion = (commentId: string) => {
        setExpandedComments(prev => ({
        ...prev,
        [commentId]: !prev[commentId],
        }));
    };

    const renderComment = (comment: UserComment, level: number) => {
        const MAX_NESTING_LEVEL = 4; 
        const userHasLiked = !!currentUser && comment.likedBy.includes(currentUser.uid);
        const userHasDisliked = !!currentUser && comment.dislikedBy.includes(currentUser.uid);
        const isVoting = votingCommentId === comment.id;
        const countryName = comment.userCountryCode ? countryCodeToNameMap.get(comment.userCountryCode) : null;
        const genderOption = comment.guestGender ? GENDER_OPTIONS.find(g => g.value === comment.guestGender) : null;
        const genderSymbol = genderOption?.symbol || null;
        const isLongComment = comment.text && comment.text.length > COMMENT_TRUNCATE_LENGTH;
        const isExpanded = !!expandedComments[comment.id];
        const displayName = comment.guestUsername || comment.username;
        const isHighlighted = highlightedCommentId === `comment-${comment.id}`;

        return (
        <div 
            key={comment.id} 
            id={`comment-${comment.id}`}
            className={cn(
            "relative group/comment scroll-mt-24 p-2 rounded-lg -m-2",
            isHighlighted && "bg-primary/10 ring-2 ring-primary/50 transition-all duration-500"
            )}
        >
            <div className="flex space-x-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={correctMalformedUrl(comment.userPhotoURL) || undefined} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                    {comment.isAnonymous && comment.userCountryCode && (
                    <NextImage
                        src={`https://flagcdn.com/w20/${comment.userCountryCode.toLowerCase()}.png`}
                        alt={countryName || comment.userCountryCode}
                        title={countryName || comment.userCountryCode || ''}
                        width={20}
                        height={15}
                        className="rounded-sm"
                    />
                    )}
                    {comment.isAnonymous && genderSymbol && (
                    <span className={cn(
                        "text-sm font-bold",
                        genderOption?.value === 'male' && "text-blue-400",
                        genderOption?.value === 'female' && "text-pink-400"
                        )} title={genderOption?.label}>{genderSymbol}</span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {currentUser && (currentUser.uid === comment.userId || (currentUser.uid === ADMIN_UID)) && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => openDeleteDialog(comment.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar comentario</span>
                    </Button>
                    )}
                </div>
                </div>
                {comment.starRatingGiven && (<div className="mt-1"><StarRating rating={comment.starRatingGiven} size={14} readOnly /></div>)}
                {comment.text && comment.text.trim() !== "" && (
                <div className="mt-2">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                    {isLongComment && !isExpanded
                        ? `${comment.text.substring(0, COMMENT_TRUNCATE_LENGTH)}...`
                        : comment.text
                    }
                    </p>
                    {isLongComment && (
                    <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-primary hover:text-primary/80"
                        onClick={() => toggleCommentExpansion(comment.id)}
                    >
                        {isExpanded ? 'Leer menos' : 'Leer más'}
                    </Button>
                    )}
                </div>
                )}
                <div className="flex items-center gap-1 mt-2">
                <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => handleLikeDislike(comment.id, 'like', comment.parentId)} disabled={!canCommentOrRate || isVoting}>
                    <ThumbsUp className={cn("h-4 w-4 mr-1", userHasLiked && "fill-blue-500 text-blue-500")} /> {comment.likes}
                </Button>
                <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => handleLikeDislike(comment.id, 'dislike', comment.parentId)} disabled={!canCommentOrRate || isVoting}>
                    <ThumbsDown className={cn("h-4 w-4 mr-1", userHasDisliked && "fill-red-500 text-red-500")} /> {comment.dislikes}
                </Button>
                {level < MAX_NESTING_LEVEL && (
                    <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => handleReplyClick(comment.id)} disabled={!canCommentOrRate}>
                    <MessageSquareReply className="h-4 w-4 mr-1" /> Responder
                    </Button>
                )}
                {isVoting && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {(comment.replyCount ?? 0) > 0 && (
                <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-1" onClick={() => handleToggleReplies(comment.id)}>
                    {loadingReplies[comment.id] ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    {visibleReplies[comment.id] ? 'Ocultar respuestas' : `Ver ${comment.replyCount} ${comment.replyCount === 1 ? 'respuesta' : 'respuestas'}`}
                </Button>
                )}
                {replyingTo === comment.id && (
                <div className="mt-4">
                    <Textarea 
                        value={replyText} 
                        onChange={(e) => setReplyText(e.target.value)} 
                        placeholder={`Respondiendo a ${displayName}...`} 
                        rows={2} 
                        className="w-full text-sm" 
                        disabled={isSubmittingReply === comment.id} 
                        maxLength={MAX_COMMENT_LENGTH}
                    />
                    <div className="text-right text-xs text-muted-foreground mt-1">
                        {replyText.length} / {MAX_COMMENT_LENGTH}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} disabled={isSubmittingReply === comment.id}>Cancelar</Button>
                    <Button 
                        size="sm" 
                        onClick={() => handleSubmitReply(comment.id)} 
                        disabled={isSubmittingReply === comment.id || !replyText.trim() || replyText.length > MAX_COMMENT_LENGTH || (currentUser?.isAnonymous && !isGuestInfoSet)}
                    >
                        {isSubmittingReply === comment.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Enviar Respuesta
                    </Button>
                    </div>
                </div>
                )}
            </div>
            </div>
            {visibleReplies[comment.id] && replies[comment.id] && (
            <div className="mt-4 pl-12 border-l-2 border-muted-foreground/20 space-y-4">
                {replies[comment.id].map(reply => renderComment(reply, level + 1))}
            </div>
            )}
        </div>
        );
    };

    return (
        <>
            <Card className="mt-8 w-full border border-white/20 bg-black">
                <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-2xl font-headline"><MessagesSquare className="mr-3 h-7 w-7 text-primary" />Califica y Comenta sobre {figure.name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                {canCommentOrRate && figure && currentUser !== undefined ? (
                    <form onSubmit={handleSubmitComment} className="space-y-6">
                    <div className="mb-4">
                        <Label htmlFor="newCommentStars" className="block text-sm font-medium text-foreground mb-2">Tu calificación (opcional):</Label>
                        <StarRating
                            rating={newCommentStars || 0}
                            onRatingChange={(rating) => {
                            const starVal = rating as StarValue;
                            setNewCommentStars(starVal);
                            }}
                            size={32}
                        />
                    </div>
                    {currentUser?.isAnonymous && !isGuestInfoSet && (
                        <Dialog open={isGuestInfoDialogOpen} onOpenChange={setIsGuestInfoDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Continuar como Invitado para Comentar
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>Definir Identidad de Invitado</DialogTitle>
                            <DialogDescription>
                                Para comentar, elige un nombre de invitado y un sexo. Esta información se guardará en tu perfil y navegador.
                            </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveGuestInfo} className="space-y-4">
                                <div>
                                <Label htmlFor="guestUsernameDialog">Nombre de Invitado (Requerido)</Label>
                                <Input
                                    id="guestUsernameDialog"
                                    value={tempGuestUsername}
                                    onChange={(e) => setTempGuestUsername(e.target.value)}
                                    placeholder="Elige un nombre"
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="guestGenderDialog">Sexo (Requerido)</Label>
                                <Select onValueChange={setTempGuestGender} value={tempGuestGender} required>
                                    <SelectTrigger id="guestGenderDialog">
                                    <SelectValue placeholder="Selecciona tu sexo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {GENDER_OPTIONS.filter(g => g.value === 'male' || g.value === 'female').map((gender) => (
                                        <SelectItem key={gender.value} value={gender.value}>
                                        {gender.symbol && <span aria-hidden="true" className="mr-2">{gender.symbol}</span>}
                                        {gender.label}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">Guardar Identidad</Button>
                            </form>
                        </DialogContent>
                        </Dialog>
                    )}
                    <div>
                        <Label htmlFor="newComment" className="sr-only">Tu comentario</Label>
                        <Textarea 
                        id="newComment" 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder="Escribe tu comentario aquí (obligatorio)..." 
                        rows={4} 
                        className="w-full" 
                        disabled={isSubmittingComment || (currentUser?.isAnonymous && !isGuestInfoSet)} 
                        maxLength={MAX_COMMENT_LENGTH}
                        />
                        <div className="text-right text-sm text-muted-foreground mt-1">
                        {newComment.length} / {MAX_COMMENT_LENGTH}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmittingComment || !newComment.trim() || newComment.length > MAX_COMMENT_LENGTH || (currentUser?.isAnonymous && !isGuestInfoSet)}>
                        <Send className="mr-2 h-4 w-4" />
                        {isSubmittingComment ? "Enviando..." : "Enviar Opinión"}
                        </Button>
                    </div>
                    </form>
                ) : ( 
                    <div className="text-center py-6 text-muted-foreground">
                        <LogIn className="mx-auto h-8 w-8 mb-2" />
                        <p>
                        <Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link> o <Link href="/signup" className="font-semibold text-primary hover:underline">regrístrate</Link> para participar.
                        </p>
                    </div>
                )}
                
                <div className="border-t pt-6 mt-6 space-y-6">
                    <Tabs defaultValue="newest" onValueChange={(value) => setCommentSortOrder(value)} className="w-full">
                    <div className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                        <h4 className="text-lg font-medium">Comentarios ({displayedComments.length})</h4>
                        <TabsList className="flex h-auto w-full flex-wrap justify-center gap-1 sm:w-auto">
                            <TabsTrigger value="newest" className="text-xs sm:text-sm">Más Nuevos</TabsTrigger>
                            <TabsTrigger value="mostVoted" className="text-xs sm:text-sm">Más Votados</TabsTrigger>
                            {currentUser && !currentUser.isAnonymous && (
                            <TabsTrigger value="myComment" className="text-xs sm:text-sm">Mi Comentario</TabsTrigger>
                            )}
                        </TabsList>
                    </div>
                    <div className="mt-4 space-y-6">
                        {isLoadingComments ? (
                        <div className="flex justify-center items-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando...</p></div>
                        ) : displayedComments.length > 0 ? (
                        displayedComments.map((comment) => renderComment(comment, 0))
                        ) : (
                        <p className="text-muted-foreground text-center py-6">
                            {commentSortOrder === 'myComment' 
                            ? 'No has realizado ningún comentario sobre esta figura.' 
                            : 'No hay comentarios que coincidan con este filtro. ¡Sé el primero!'}
                        </p>
                        )}
                    </div>
                    </Tabs>
                </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el comentario.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                    setCommentToDeleteId(null);
                    }}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCommentConfirmation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    