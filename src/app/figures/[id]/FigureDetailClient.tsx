"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2 as FamilyIcon, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  ImageOff, Star as StarIcon,
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap,
  MessagesSquare, Send, Trash2, Images, PlusCircle, Image as ImageIconLucide, ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AttitudeVote } from '@/components/figures/AttitudeVote';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from 'react';
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { PerceptionEmotions } from "@/components/figures/PerceptionEmotions";
import { RatingSummaryDisplay } from "@/components/figures/RatingSummaryDisplay";
import { ImageGalleryViewer } from "@/components/figures/ImageGalleryViewer";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc, runTransaction, query, where, orderBy, limit, getDocs, Timestamp, setDoc, deleteDoc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/StarRating";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCommentLikes } from "@/app/actions/commentRatingActions";
import { cn, correctMalformedUrl } from "@/lib/utils";
import { countryCodeToNameMap } from "@/config/countries";
import { GENDER_OPTIONS, type GenderOption } from "@/config/genderOptions";
import { ShareButton } from "@/components/shared/ShareButton";
import type { Figure, UserComment, StarValue, StarValueAsString, UserProfile } from "@/lib/types";
import { updateFigureInFirestore } from "@/lib/placeholder-data";

interface FigureDetailClientProps {
  initialFigure: Figure;
}

const STAR_SOUND_URLS: Record<StarValue, string> = {
  1: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar1.mp3?alt=media&token=a11df570-a6ee-4828-b5a9-81ccbb2c0457",
  2: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar2.mp3?alt=media&token=58cbf607-df0b-4bbd-b28e-291cf1951c18",
  3: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar3.mp3?alt=media&token=df67dc5b-28ab-4773-8266-60b9127a325f",
  4: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar4.mp3?alt=media&token=40c72095-e6a0-42d6-a3f6-86a81c356826",
  5: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar5.mp3?alt=media&token=8705fce9-1baa-4f49-8783-7bfc9d35a80f",
};

const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

export default function FigureDetailClient({ initialFigure }: FigureDetailClientProps) {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const router = useRouter();

  const [figure, setFigure] = React.useState<Figure | null | undefined>(initialFigure); 
  
  React.useEffect(() => {
      setFigure(initialFigure);
  }, [initialFigure]);

  const { toast } = useToast();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedDescription, setEditedDescription] = React.useState("");
  const [editedNationality, setEditedNationality] = React.useState("");
  const [editedOccupation, setEditedOccupation] = React.useState("");
  const [editedGender, setEditedGender] = React.useState("");
  const [editedPhotoUrl, setEditedPhotoUrl] = React.useState("");
  const [editedAlias, setEditedAlias] = React.useState("");
  const [editedSpecies, setEditedSpecies] = React.useState("");
  const [editedFirstAppearance, setEditedFirstAppearance] = React.useState("");
  const [editedBirthDateOrAge, setEditedBirthDateOrAge] = React.useState("");
  const [editedBirthPlace, setEditedBirthPlace] = React.useState("");
  const [editedStatusLiveOrDead, setEditedStatusLiveOrDead] = React.useState("");
  const [editedMaritalStatus, setEditedMaritalStatus] = React.useState("");
  const [editedHeight, setEditedHeight] = React.useState("");
  const [editedWeight, setEditedWeight] = React.useState("");
  const [editedHairColor, setEditedHairColor] = React.useState("");
  const [editedEyeColor, setEditedEyeColor] = React.useState("");
  const [editedDistinctiveFeatures, setEditedDistinctiveFeatures] = React.useState("");

  const [isSaving, setIsSaving] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [anonymousUserCountryCode, setAnonymousUserCountryCode] = React.useState<string | null>(null);
  
  const [canEditFigure, setCanEditFigure] = React.useState(false);
  const [canCommentOrRate, setCanCommentOrRate] = React.useState(false);
  const [canVoteOnComments, setCanVoteOnComments] = React.useState(false);

  const [newComment, setNewComment] = React.useState("");
  const [newCommentStars, setNewCommentStars] = React.useState<StarValue | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [guestUsername, setGuestUsername] = React.useState("");
  const [isGuestNameSet, setIsGuestNameSet] = React.useState(false);
  const [guestGender, setGuestGender] = React.useState("");
  const [isGuestGenderSet, setIsGuestGenderSet] = React.useState(false);
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
  const [starRatingOfCommentToDelete, setStarRatingOfCommentToDelete] = React.useState<StarValue | null>(null);

  const [viewerImageUrl, setViewerImageUrl] = React.useState<string | null>(null);
  const [expandedComments, setExpandedComments] = React.useState<Record<string, boolean>>({});


  const MAX_COMMENT_LENGTH = 1000;
  const COMMENT_TRUNCATE_LENGTH = 350;

  const allowedImageDomains = React.useMemo(() => {
    return [
      'placehold.co', 'firebasestorage.googleapis.com', 'wikimedia.org', 
      'static.wikia.nocookie.net', 'pinimg.com', 'flagcdn.com'
    ];
  }, []);

  const displayedComments = React.useMemo(() => {
    if (isLoadingComments) return [];
    let sortedComments = [...commentsList];

    switch (commentSortOrder) {
      case 'mostVoted':
        sortedComments.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
        break;
      case 'oldest':
        sortedComments.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
        break;
      case 'myComment':
        if (!currentUser || currentUser.isAnonymous) return [];
        return commentsList.filter(comment => comment.userId === currentUser.uid);
      case 'newest':
      default:
        sortedComments.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        break;
    }
    return sortedComments;
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


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setCurrentUser(user);
      const isNonAnonymous = !!user && !user.isAnonymous;
      
      setCanEditFigure(isNonAnonymous || (user?.uid === ADMIN_UID));
      setCanCommentOrRate(!!user); 
      setCanVoteOnComments(!!user); 

      if (user) { 
        if (user.isAnonymous) {
            const savedGuestName = localStorage.getItem('wikistars5-guestUsername');
            if (savedGuestName) {
                setGuestUsername(savedGuestName);
                setIsGuestNameSet(true);
            }
            const savedGuestGender = localStorage.getItem('wikistars5-guestGender');
            if (savedGuestGender) {
                setGuestGender(savedGuestGender);
                setIsGuestGenderSet(true);
            }
        }

        if (figure?.id) {
            const userStarRatingDocRef = doc(db, 'userStarRatings', `${user.uid}_${figure.id}`);
            getDoc(userStarRatingDocRef).then(docSnap => {
              if (docSnap.exists()) {
                setNewCommentStars(docSnap.data().starValue as StarValue);
              } else {
                setNewCommentStars(null);
              }
            });
        }
      } else {
        setNewCommentStars(null);
        setIsGuestNameSet(false);
        setGuestUsername("");
        setIsGuestGenderSet(false);
        setGuestGender("");
      }
    });
    return () => unsubscribe();
  }, [figure?.id]); 

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


  const resetEditFields = React.useCallback((currentFigure: Figure | null) => {
    if (currentFigure) {
      setEditedDescription(currentFigure.description || "");
      setEditedNationality(currentFigure.nationality || "");
      setEditedOccupation(currentFigure.occupation || "");
      setEditedGender(currentFigure.gender || "");
      setEditedPhotoUrl(currentFigure.photoUrl || "");
      setEditedAlias(currentFigure.alias || "");
      setEditedSpecies(currentFigure.species || "");
      setEditedFirstAppearance(currentFigure.firstAppearance || "");
      setEditedBirthDateOrAge(currentFigure.birthDateOrAge || "");
      setEditedBirthPlace(currentFigure.birthPlace || "");
      setEditedStatusLiveOrDead(currentFigure.statusLiveOrDead || "");
      setEditedMaritalStatus(currentFigure.maritalStatus || "");
      setEditedHeight(currentFigure.height || "");
      setEditedWeight(currentFigure.weight || "");
      setEditedHairColor(currentFigure.hairColor || "");
      setEditedEyeColor(currentFigure.eyeColor || "");
      setEditedDistinctiveFeatures(currentFigure.distinctiveFeatures || "");
    }
  }, []);

  const fetchComments = React.useCallback(async () => {
     if (!id) {
      setCommentsList([]);
      setIsLoadingComments(false);
      return;
    }
    setCommentsList([]); 
    setIsLoadingComments(true);
    try {
      const commentsQuery = query(
        collection(db, 'userComments'),
        where('figureId', '==', id),
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
          figureId: data.figureId,
          userId: data.userId,
          username: data.username,
          userPhotoURL: data.userPhotoURL || null,
          text: data.text,
          starRatingGiven: data.starRatingGiven || null,
          createdAt: data.createdAt, 
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          likedBy: data.likedBy || [],
          dislikedBy: data.dislikedBy || [],
          parentId: data.parentId || null,
          replyCount: data.replyCount || 0,
          guestUsername: data.guestUsername || null,
          guestUsernameLower: data.guestUsernameLower || null,
          guestGender: data.guestGender || null,
          userCountryCode: data.userCountryCode || null,
        });
      });
      setCommentsList(fetchedComments);
    } catch (error: any) {
      console.error("Error fetching comments:", error); 
      let errorMessage = "No se pudieron cargar los comentarios.";
      if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('deadline'))) {
        errorMessage = "La conexión con la base de datos ha tardado demasiado. Esto puede ser por una conexión lenta o por la falta de un índice en Firestore. Revisa la consola del navegador (F12) para ver si hay un enlace para crear el índice.";
      } else if (error.message && error.message.includes("firestore/failed-precondition")) {
          errorMessage = "Error al cargar comentarios: Es posible que falte un índice en Firestore. Revisa la consola del navegador (F12) para un enlace de creación de índice.";
      } else if (error.message) {
          errorMessage = `No se pudieron cargar los comentarios. Detalles: ${error.message}`;
      }
      toast({ title: "Error al Cargar Comentarios", description: errorMessage, variant: "destructive", duration: 10000 });
      setCommentsList([]); 
    } finally {
      setIsLoadingComments(false);
    }
  }, [id, toast]);


  React.useEffect(() => {
    if (id) {
      fetchComments();
    }
  }, [id, fetchComments]);

  React.useEffect(() => {
    if (figure && isEditing) {
      resetEditFields(figure);
    }
  }, [figure, isEditing, resetEditFields]);

  const handleEditToggle = () => {
    if (isEditing) {
      resetEditFields(figure);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!figure || !canEditFigure) {
      toast({ title: "Error", description: "No tienes permiso para guardar.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const updatedFigureData: Partial<Figure> & { id: string } = {
        id: figure.id,
        description: editedDescription,
        nationality: editedNationality,
        occupation: editedOccupation,
        gender: editedGender,
        photoUrl: correctMalformedUrl(editedPhotoUrl.trim() || 'https://placehold.co/400x600.png'),
        alias: editedAlias,
        species: editedSpecies,
        firstAppearance: editedFirstAppearance,
        birthDateOrAge: editedBirthDateOrAge,
        birthPlace: editedBirthPlace,
        statusLiveOrDead: editedStatusLiveOrDead,
        maritalStatus: editedMaritalStatus,
        height: editedHeight,
        weight: editedWeight,
        hairColor: editedHairColor,
        eyeColor: editedEyeColor,
        distinctiveFeatures: editedDistinctiveFeatures,
      };
      await updateFigureInFirestore(updatedFigureData);
      toast({ title: "Éxito", description: "Información actualizada correctamente." });
      setIsEditing(false);
      router.refresh(); // Use router.refresh() to re-fetch server data
    } catch (error: any) {
      console.error("Error saving figure details:", error);
      let errorMessage = "No se pudo guardar la información.";
      if (error.message) {
        errorMessage += ` Detalles: ${error.message}`;
      }
      toast({ title: "Error al Guardar", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCommentOrRate || !currentUser || !figure) {
        toast({ title: "Error", description: "Debes estar conectado para opinar.", variant: "destructive" });
        return;
    }
    if (currentUser.isAnonymous && (!guestUsername.trim() || !guestGender.trim())) {
        toast({ title: "Información Requerida", description: "Por favor, introduce un nombre y selecciona un sexo para comentar.", variant: "destructive" });
        return;
    }
    if (newComment.trim() === "" || newComment.length > MAX_COMMENT_LENGTH) {
        toast({ title: "Comentario Inválido", description: `El comentario no puede estar vacío o exceder los ${MAX_COMMENT_LENGTH} caracteres.`, variant: "destructive" });
        return;
    }
    setIsSubmittingComment(true);
    
    // 1. Check for unique guest username if applicable (OUTSIDE the transaction)
    if (currentUser.isAnonymous) {
      const normalizedGuestName = guestUsername.trim().toLowerCase();
      if (normalizedGuestName) {
        try {
          const commentsCollectionRef = collection(db, 'userComments');
          const uniquenessQuery = query(
            commentsCollectionRef,
            where('figureId', '==', figure.id),
            where('guestUsernameLower', '==', normalizedGuestName)
          );
          // Use getDocs, which is the correct way to execute a query
          const existingUsernamesSnapshot = await getDocs(uniquenessQuery);
          if (!existingUsernamesSnapshot.empty) {
            toast({
              title: "Nombre en Uso",
              description: "Este nombre de invitado ya está en uso. Por favor, elige otro.",
              variant: "destructive"
            });
            setIsSubmittingComment(false);
            return; // Stop the submission
          }
        } catch (queryError: any) {
          console.error("Error checking guest username uniqueness:", queryError);
          let errorMessage = "No se pudo verificar el nombre de invitado. Inténtalo de nuevo.";
          if (queryError.message && queryError.message.includes("firestore/failed-precondition")) {
            errorMessage = "Error de base de datos: Falta un índice para buscar nombres de invitado. Revisa la consola del navegador (F12) para un enlace de creación de índice."
          }
          toast({
            title: "Error de Verificación",
            description: errorMessage,
            variant: "destructive"
          });
          setIsSubmittingComment(false);
          return;
        }
      }
    }

    const figureDocRef = doc(db, "figures", figure.id);
    const userStarRatingDocRef = doc(db, "userStarRatings", `${currentUser.uid}_${figure.id}`);
    const commentsCollectionRef = collection(db, 'userComments');

    try {
      await runTransaction(db, async (transaction) => {
        // The uniqueness check that was here has been moved outside.
        
        // 2. Handle Star Rating
        const figureSnap = await transaction.get(figureDocRef);
        if (!figureSnap.exists()) throw new Error("Figure document does not exist!");
        const figureData = figureSnap.data()!;
        const currentAggregatedStarCounts = (figureData.starRatingCounts || { "1":0,"2":0,"3":0,"4":0,"5":0 }) as Record<StarValueAsString, number>;
        const newAggregatedStarCounts = { ...currentAggregatedStarCounts };
        
        const userPrevRatingSnap = await transaction.get(userStarRatingDocRef); 
        const previousUserStarValue: StarValue | null = userPrevRatingSnap.exists() ? userPrevRatingSnap.data()!.starValue as StarValue : null;

        if (previousUserStarValue !== null) {
          const prevKey = previousUserStarValue.toString() as StarValueAsString;
          newAggregatedStarCounts[prevKey] = Math.max(0, (newAggregatedStarCounts[prevKey] || 0) - 1);
        }
        
        const currentStarsForComment = newCommentStars;
        if (currentStarsForComment !== null) {
          const newKey = currentStarsForComment.toString() as StarValueAsString;
          newAggregatedStarCounts[newKey] = (newAggregatedStarCounts[newKey] || 0) + 1;
          transaction.set(userStarRatingDocRef, { 
            userId: currentUser.uid,
            figureId: figure.id,
            starValue: currentStarsForComment,
            timestamp: serverTimestamp(),
          });
        } else { 
          if (userPrevRatingSnap.exists()) {
            transaction.delete(userStarRatingDocRef);
          }
        }
        
        // 3. Prepare Comment Document
        const newCommentRef = doc(commentsCollectionRef);
        const commentData: any = {
          figureId: figure.id,
          userId: currentUser.uid,
          username: currentUser.isAnonymous ? "Invitado" : (currentUser.displayName || "Usuario Anónimo"),
          userPhotoURL: currentUser.photoURL || null,
          text: newComment.trim(),
          starRatingGiven: currentStarsForComment, 
          createdAt: serverTimestamp(),
          likes: 0,
          dislikes: 0,
          likedBy: [],
          dislikedBy: [],
          parentId: null,
          replyCount: 0,
        };

        if (currentUser.isAnonymous) {
          commentData.guestUsername = guestUsername.trim();
          commentData.guestUsernameLower = guestUsername.trim().toLowerCase(); // Add normalized name
          commentData.guestGender = guestGender;
          if (anonymousUserCountryCode) {
            commentData.userCountryCode = anonymousUserCountryCode;
          }
        }
        
        // 4. Set up all writes in the transaction
        transaction.set(newCommentRef, commentData);
        transaction.update(figureDocRef, { 
          starRatingCounts: newAggregatedStarCounts,
          commentCount: increment(1)
        });
      });

      // After successful transaction
      if (currentUser.isAnonymous) {
          if (!isGuestNameSet) {
            localStorage.setItem('wikistars5-guestUsername', guestUsername.trim());
            setIsGuestNameSet(true);
          }
          if (!isGuestGenderSet) {
            localStorage.setItem('wikistars5-guestGender', guestGender);
            setIsGuestGenderSet(true);
          }
      }
      
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

      setNewComment("");
      fetchComments(); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Error submitting opinion:", error);
      let errorMessage = `No se pudo enviar tu opinión. ${error.message}`;
      if (error.message.includes("firestore/failed-precondition")) {
          errorMessage = "No se pudo enviar tu opinión. Es posible que falte un índice en Firestore para la validación de nombres de invitado. Revisa la consola del navegador (F12) para un enlace de creación de índice.";
      }
      toast({ title: "Error al Enviar", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };


  const handleLikeDislike = (commentId: string, action: 'like' | 'dislike', parentCommentId: string | null = null) => {
    if (!currentUser || !figure) {
      toast({ title: 'Acción Requerida', description: 'Debes estar conectado para votar.' });
      return;
    }
    if (votingCommentId) return;

    setVotingCommentId(commentId);

    const originalComments = JSON.parse(JSON.stringify(commentsList));
    const originalReplies = JSON.parse(JSON.stringify(replies));
    
    const updateStateOptimistically = (comments: UserComment[], targetId: string, userId: string, voteAction: 'like' | 'dislike'): UserComment[] => {
      return comments.map(comment => {
        if (comment.id === targetId) {
          const newComment = { ...comment, likedBy: [...comment.likedBy], dislikedBy: [...comment.dislikedBy] };
          
          const hasLiked = newComment.likedBy.includes(userId);
          const hasDisliked = newComment.dislikedBy.includes(userId);

          if (voteAction === 'like') {
            if (hasLiked) {
              newComment.likes--;
              newComment.likedBy = newComment.likedBy.filter(id => id !== userId);
            } else {
              newComment.likes++;
              newComment.likedBy.push(userId);
              if (hasDisliked) {
                newComment.dislikes--;
                newComment.dislikedBy = newComment.dislikedBy.filter(id => id !== userId);
              }
            }
          } else { // dislike
            if (hasDisliked) {
              newComment.dislikes--;
              newComment.dislikedBy = newComment.dislikedBy.filter(id => id !== userId);
            } else {
              newComment.dislikes++;
              newComment.dislikedBy.push(userId);
              if (hasLiked) {
                newComment.likes--;
                newComment.likedBy = newComment.likedBy.filter(id => id !== userId);
              }
            }
          }
          return newComment;
        }
        return comment;
      });
    };

    if (parentCommentId && replies[parentCommentId]) {
      setReplies(prev => ({
        ...prev,
        [parentCommentId]: updateStateOptimistically(prev[parentCommentId], commentId, currentUser.uid, action)
      }));
    } else {
      setCommentsList(prev => updateStateOptimistically(prev, commentId, currentUser.uid, action));
    }

    // Fire and forget server update
    (async () => {
      try {
        const result = await updateCommentLikes(commentId, figure.id, currentUser.uid, action);
        if (!result.success) {
          toast({ title: 'Error', description: result.message, variant: 'destructive' });
          setCommentsList(originalComments);
          setReplies(originalReplies);
        }
      } catch (error: any) {
        console.error("Error al llamar a la acción del servidor para me gusta/no me gusta:", error);
        toast({ title: 'Error', description: `Error inesperado al votar: ${error.message}`, variant: 'destructive' });
        setCommentsList(originalComments);
        setReplies(originalReplies);
      } finally {
        setVotingCommentId(null);
      }
    })();
};

  const formatDate = (timestamp: any): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'Fecha desconocida';
    try {
      const date = timestamp.toDate();
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return `${date.toLocaleDateString()} a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (error) {
      return "Error al formatear fecha";
    }
  };

  const handleDeleteCommentConfirmation = async () => {
    if (!commentToDeleteId || !figure || !currentUser) return;
    const commentRef = doc(db, "userComments", commentToDeleteId);
    const figureRef = doc(db, "figures", figure.id);

    try {
      await runTransaction(db, async (transaction) => {
        const figureDoc = await transaction.get(figureRef);
        if (!figureDoc.exists()) throw "Figure document does not exist!";
        
        const figureData = figureDoc.data();
        let newCommentCount = (figureData.commentCount || 0) - 1;
        newCommentCount = Math.max(0, newCommentCount); 
        
        const updates: any = { commentCount: newCommentCount };

        if (starRatingOfCommentToDelete) {
          const starKey = starRatingOfCommentToDelete.toString() as StarValueAsString;
          const currentStarCounts = (figureData.starRatingCounts || { "1":0,"2":0,"3":0,"4":0,"5":0 }) as Record<StarValueAsString, number>;
          const newStarCounts = { ...currentStarCounts };
          newStarCounts[starKey] = Math.max(0, (newStarCounts[starKey] || 0) - 1);
          updates.starRatingCounts = newStarCounts;

          const userStarRatingDocRef = doc(db, 'userStarRatings', `${currentUser.uid}_${figure.id}`);
          const userStarRatingSnap = await transaction.get(userStarRatingDocRef);
          if (userStarRatingSnap.exists() && userStarRatingSnap.data().starValue === starRatingOfCommentToDelete) {
             transaction.delete(userStarRatingDocRef);
             setNewCommentStars(null); 
          }
        }
        
        transaction.update(figureRef, updates);
        transaction.delete(commentRef);
      });

      toast({ title: "Comentario Eliminado", description: "El comentario ha sido eliminado." });
      fetchComments(); 
      router.refresh(); 
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({ title: "Error al Eliminar", description: `No se pudo eliminar el comentario. ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setCommentToDeleteId(null);
      setStarRatingOfCommentToDelete(null);
    }
  };

  const openDeleteDialog = (commentId: string, starRating: StarValue | null) => {
    setCommentToDeleteId(commentId);
    setStarRatingOfCommentToDelete(starRating);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenProfileImage = (imageUrl: string) => {
    if (imageUrl) {
      setViewerImageUrl(imageUrl);
    }
  };

  if (figure === undefined) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isValidUrl = (url: string, domains: string[]): boolean => {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      return domains.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain));
    } catch (e) {
      return false;
    }
  };
  const isValidEditedPhotoUrl = isValidUrl(correctMalformedUrl(editedPhotoUrl), allowedImageDomains);

  const handleReplyClick = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null); 
    } else {
      setReplyingTo(commentId);
      setReplyText(""); 
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!canCommentOrRate || !currentUser || !figure || !replyText.trim() || replyText.length > MAX_COMMENT_LENGTH) {
      toast({ title: "Respuesta Inválida", description: `La respuesta no puede estar vacía o exceder los ${MAX_COMMENT_LENGTH} caracteres.`, variant: "destructive" });
      return;
    }
    setIsSubmittingReply(parentId);

    const figureRef = doc(db, "figures", figure.id);
    const parentCommentRef = doc(db, "userComments", parentId);

    // Data for the new reply
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
    };

    if (currentUser.isAnonymous) {
      if(guestUsername) replyData.guestUsername = guestUsername.trim();
      if(anonymousUserCountryCode) replyData.userCountryCode = anonymousUserCountryCode;
      if(guestGender) replyData.guestGender = guestGender;
    }
    
    try {
      // The whole process is now in a single transaction
      await runTransaction(db, async (transaction) => {
        const parentCommentDoc = await transaction.get(parentCommentRef);
        if (!parentCommentDoc.exists()) throw new Error("El comentario original no fue encontrado.");

        const parentCommentData = parentCommentDoc.data();
        const parentUserId = parentCommentData.userId;
        
        // 1. Create the new reply document reference and set its data
        const newReplyRef = doc(collection(db, 'userComments'));
        transaction.set(newReplyRef, replyData);

        // 2. Increment comment and reply counts
        transaction.update(figureRef, { commentCount: increment(1) });
        transaction.update(parentCommentRef, { replyCount: increment(1) });
        
        // 3. Create a notification for the parent comment's author if they are not the one replying
        if (parentUserId && currentUser.uid !== parentUserId) {
          const notificationRef = doc(collection(db, 'notifications'));
          transaction.set(notificationRef, {
            userId: parentUserId,
            actorId: currentUser.uid,
            actorName: currentUser.isAnonymous ? guestUsername.trim() : (currentUser.displayName || "Usuario Anónimo"),
            actorPhotoUrl: currentUser.photoURL || null,
            type: 'reply',
            isRead: false,
            figureId: figure.id,
            figureName: figure.name,
            commentId: parentId, // The comment being replied to
            replyId: newReplyRef.id,
            createdAt: serverTimestamp()
          });
        }
      });

      toast({ title: "Respuesta Enviada", description: "Tu respuesta ha sido guardada." });
      setReplyText("");
      setReplyingTo(null);
      handleToggleReplies(parentId, true); // Force refresh replies
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast({ title: "Error al Responder", description: `No se pudo enviar tu respuesta. ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmittingReply(null);
    }
  };

  const handleToggleReplies = async (commentId: string, forceRefresh = false) => {
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
  };


  const renderDetailItem = (icon: React.ElementType, label: string, value?: string) => {
    const IconComponent = icon;
    return (
      <div className="flex items-start">
        <IconComponent className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
        <div><p className="font-semibold text-foreground/90">{label}</p><p className="text-sm text-muted-foreground">{value || "No disponible"}</p></div>
      </div>
    );
  };
  
  const renderEditInput = (idField: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string) => (
    <div><Label htmlFor={idField} className="font-semibold text-foreground/90">{label}</Label><Input id={idField} value={value} onChange={onChange} placeholder={placeholder || `Ej: ${label}`} className="mt-1" /></div>
  );

  const renderEditTextarea = (idField: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string, rows?: number) => (
    <div><Label htmlFor={idField} className="font-semibold text-foreground/90">{label}</Label><Textarea id={idField} value={value} onChange={onChange} placeholder={placeholder || `Añade ${label.toLowerCase()}...`} rows={rows || 3} className="mt-1" /></div>
  );

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

    return (
      <div key={comment.id} className="relative group/comment">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={correctMalformedUrl(comment.userPhotoURL) || undefined} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                {comment.username === 'Invitado' && comment.userCountryCode && (
                  <Image
                    src={`https://flagcdn.com/w20/${comment.userCountryCode.toLowerCase()}.png`}
                    alt={countryName || comment.userCountryCode}
                    title={countryName || comment.userCountryCode || ''}
                    width={20}
                    height={15}
                    className="rounded-sm"
                  />
                )}
                 {comment.username === 'Invitado' && genderSymbol && (
                  <span className={cn(
                      "text-sm font-bold",
                      genderOption?.value === 'male' && "text-blue-400",
                      genderOption?.value === 'female' && "text-pink-400"
                    )} title={genderOption?.label}>{genderSymbol}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                {currentUser && (currentUser.uid === comment.userId || (currentUser.uid === ADMIN_UID)) && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => openDeleteDialog(comment.id, comment.starRatingGiven)}>
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
              <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => handleLikeDislike(comment.id, 'like', comment.parentId)} disabled={!canVoteOnComments || isVoting}>
                <ThumbsUp className={cn("h-4 w-4 mr-1", userHasLiked && "fill-blue-500 text-blue-500")} /> {comment.likes}
              </Button>
              <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => handleLikeDislike(comment.id, 'dislike', comment.parentId)} disabled={!canVoteOnComments || isVoting}>
                <ThumbsDown className={cn("h-4 w-4 mr-1", userHasDisliked && "fill-red-500 text-red-500")} /> {comment.dislikes}
              </Button>
              {level < MAX_NESTING_LEVEL && (
                <Button variant="ghost" size="sm" className="px-2 py-1 h-auto text-xs" onClick={() => handleReplyClick(comment.id)} disabled={!canCommentOrRate}>
                  <MessageSquareReply className="h-4 w-4 mr-1" /> Responder
                </Button>
              )}
              {isVoting && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {comment.replyCount > 0 && (
              <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-1" onClick={() => handleToggleReplies(comment.id)}>
                {loadingReplies[comment.id] ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {visibleReplies[comment.id] ? 'Ocultar respuestas' : `Ver ${comment.replyCount} respuestas`}
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
                    disabled={isSubmittingReply === comment.id || !replyText.trim() || replyText.length > MAX_COMMENT_LENGTH}
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
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader 
        figure={figure!} 
        currentUser={currentUser}
        onImageClick={handleOpenProfileImage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-3 space-y-8">
          <Tabs defaultValue="attitude-poll" className="w-full">
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar mb-6 p-1 h-auto rounded-lg bg-black border-b border-white/20"> 
              <TabsTrigger value="personal-info" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Info className="h-4 sm:h-5 w-4 sm:w-5" />Información</TabsTrigger>
              <TabsTrigger value="attitude-poll" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 sm:h-5 w-4 sm:w-5" />Actitud</TabsTrigger>
              <TabsTrigger value="perception-emotions" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><SmilePlus className="h-4 sm:h-5 w-4 sm:w-5" />Emoción</TabsTrigger>
            </TabsList>

            <TabsContent value="personal-info">
              <Card className="border border-white/20 bg-black">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center"><Info className="mr-2 h-6 w-6 text-primary" /><CardTitle className="text-2xl font-headline">Sobre {figure!.name}</CardTitle></div>
                  {canEditFigure && !isEditing && (<Button variant="outline" size="sm" onClick={handleEditToggle}><Edit className="mr-2 h-4 w-4" />Editar</Button>)}
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {!canEditFigure && !isEditing && (
                    <Alert variant="default" className="mb-4">
                        <LogIn className="h-4 w-4" />
                        <AlertTitle>Edición para Usuarios Registrados</AlertTitle>
                        <AlertDescription>
                          Para editar esta sección, necesitas <Link href="/login" className="font-semibold text-primary hover:underline">iniciar sesión</Link> o <Link href="/signup" className="font-semibold text-primary hover:underline">crear una cuenta</Link>.
                        </AlertDescription>
                    </Alert>
                  )}
                  {isEditing && canEditFigure ? (
                    <div className="space-y-4">
                      {renderEditInput("photoUrl", "URL de Imagen de Perfil", editedPhotoUrl, (e) => setEditedPhotoUrl(e.target.value), "Ej: https://...")}
                      <p className="text-xs text-muted-foreground mt-1">Dominios permitidos: {allowedImageDomains.join(', ')}.</p>
                      {editedPhotoUrl ? (isValidEditedPhotoUrl ? <div className="mt-2 relative w-32 h-40 border rounded-md overflow-hidden bg-muted flex items-center justify-center"><Image src={correctMalformedUrl(editedPhotoUrl)} alt="Preview" layout="fill" objectFit="contain" /></div> : <p className="mt-1 text-xs text-destructive">URL no válida/permitida.</p>) : <div className="mt-2 w-32 h-40 border rounded-md bg-muted flex items-center justify-center text-muted-foreground"><ImageOff className="h-10 w-10" /></div>}
                      {renderEditTextarea("description", "Descripción", editedDescription, (e) => setEditedDescription(e.target.value), "Añade una descripción...", 5)}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        {renderEditInput("alias", "Alias", editedAlias, (e) => setEditedAlias(e.target.value))}
                        {renderEditInput("species", "Especie", editedSpecies, (e) => setEditedSpecies(e.target.value))}
                        {renderEditInput("firstAppearance", "Primera Aparición", editedFirstAppearance, (e) => setEditedFirstAppearance(e.target.value))}
                        {renderEditInput("birthDateOrAge", "Nacimiento/Edad", editedBirthDateOrAge, (e) => setEditedBirthDateOrAge(e.target.value))}
                        {renderEditInput("birthPlace", "Lugar Nacimiento", editedBirthPlace, (e) => setEditedBirthPlace(e.target.value))}
                        {renderEditInput("nationality", "Nacionalidad", editedNationality, (e) => setEditedNationality(e.target.value))}
                        {renderEditInput("occupation", "Ocupación", editedOccupation, (e) => setEditedOccupation(e.target.value))}
                        {renderEditInput("gender", "Género", editedGender, (e) => setEditedGender(e.target.value))}
                        {renderEditInput("statusLiveOrDead", "Estado (Vivo/Muerto)", editedStatusLiveOrDead, (e) => setEditedStatusLiveOrDead(e.target.value))}
                        {renderEditInput("maritalStatus", "Estado Civil", editedMaritalStatus, (e) => setEditedMaritalStatus(e.target.value))}
                        {renderEditInput("height", "Altura", editedHeight, (e) => setEditedHeight(e.target.value))}
                        {renderEditInput("weight", "Peso", editedWeight, (e) => setEditedWeight(e.target.value))}
                        {renderEditInput("hairColor", "Color Cabello", editedHairColor, (e) => setEditedHairColor(e.target.value))}
                        {renderEditInput("eyeColor", "Color Ojos", editedEyeColor, (e) => setEditedEyeColor(e.target.value))}
                        {renderEditTextarea("distinctiveFeatures", "Rasgos Distintivos", editedDistinctiveFeatures, (e) => setEditedDistinctiveFeatures(e.target.value), "Ej: Cicatriz...", 3)}
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}><X className="mr-2 h-4 w-4" />Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSaving ? "Actualizando..." : "Actualizar Figura"}</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {figure!.description && <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{figure!.description}</p>}
                      <div className="space-y-3 pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        {figure!.alias && renderDetailItem(NotepadText, "Alias", figure!.alias)}
                        {figure!.gender && renderDetailItem(FamilyIcon, "Género", figure!.gender)}
                        {figure!.species && renderDetailItem(Zap, "Especie", figure!.species)}
                        {figure!.firstAppearance && renderDetailItem(BookOpen, "Primera Aparición", figure!.firstAppearance)}
                        {figure!.birthDateOrAge && renderDetailItem(Cake, "Nacimiento/Edad", figure!.birthDateOrAge)}
                        {figure!.birthPlace && renderDetailItem(MapPin, "Lugar de Nacimiento", figure!.birthPlace)}
                        {figure!.nationality && renderDetailItem(Globe, "Nacionalidad", figure!.nationality)}
                        {figure!.occupation && renderDetailItem(Briefcase, "Ocupación", figure!.occupation)}
                        {figure!.statusLiveOrDead && renderDetailItem(Activity, "Estado (Vivo/Muerto)", figure!.statusLiveOrDead)}
                        {figure!.maritalStatus && renderDetailItem(HeartHandshake, "Estado Civil", figure!.maritalStatus)}
                        {figure!.height && renderDetailItem(StretchVertical, "Altura", figure!.height)}
                        {figure!.weight && renderDetailItem(Scale, "Peso", figure!.weight)}
                        {figure!.hairColor && renderDetailItem(Palette, "Color de Cabello", figure!.hairColor)}
                        {figure!.eyeColor && renderDetailItem(Eye, "Color de Ojos", figure!.eyeColor)}
                        {figure!.distinctiveFeatures && renderDetailItem(Scan, "Rasgos Distintivos", figure!.distinctiveFeatures)}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attitude-poll">{figure && currentUser !== undefined && (<AttitudeVote figureId={figure.id} figureName={figure.name} initialAttitudeCounts={figure.attitudeCounts} currentUser={currentUser} />)}{(!figure || currentUser === undefined) && (<div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}</TabsContent>
            <TabsContent value="perception-emotions">{figure && currentUser !== undefined && (<PerceptionEmotions figureId={figure.id} figureName={figure.name} initialPerceptionCounts={figure.perceptionCounts} currentUser={currentUser} />)}{(!figure || currentUser === undefined) && (<div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}</TabsContent>
          </Tabs>
          
          {figure && (<RatingSummaryDisplay figureName={figure.name} starRatingCounts={figure.starRatingCounts} />)}

          <Card className="mt-8 w-full border border-white/20 bg-black">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-headline"><MessagesSquare className="mr-3 h-7 w-7 text-primary" />Califica y Comenta sobre {figure!.name}</CardTitle>
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
                  {currentUser?.isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        {isGuestNameSet ? (
                            <div className="text-sm p-3 bg-muted rounded-md border h-full flex flex-col justify-center">
                                <span className="text-muted-foreground text-xs">Comentarás como: </span>
                                <strong className="text-foreground">{guestUsername}</strong>
                            </div>
                        ) : (
                            <>
                                <Label htmlFor="guestUsername">Nombre de Invitado (Requerido)</Label>
                                <Input
                                    id="guestUsername"
                                    value={guestUsername}
                                    onChange={(e) => setGuestUsername(e.target.value)}
                                    placeholder="Escribe un nombre"
                                    disabled={isSubmittingComment}
                                    maxLength={50}
                                />
                            </>
                        )}
                      </div>
                      <div>
                        {isGuestGenderSet ? (
                             <div className="text-sm p-3 bg-muted rounded-md border h-full flex flex-col justify-center">
                                <span className="text-muted-foreground text-xs">Sexo: </span>
                                <strong className="text-foreground">{GENDER_OPTIONS.find(g => g.value === guestGender)?.label || 'No especificado'}</strong>
                            </div>
                        ) : (
                            <>
                              <Label htmlFor="guestGender">Sexo (Requerido)</Label>
                               <Select onValueChange={setGuestGender} value={guestGender} disabled={isSubmittingComment}>
                                <SelectTrigger id="guestGender">
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
                            </>
                        )}
                      </div>
                    </div>
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
                      disabled={isSubmittingComment} 
                      maxLength={MAX_COMMENT_LENGTH}
                    />
                    <div className="text-right text-sm text-muted-foreground mt-1">
                      {newComment.length} / {MAX_COMMENT_LENGTH}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingComment || !newComment.trim() || newComment.length > MAX_COMMENT_LENGTH || (currentUser?.isAnonymous && (!guestUsername.trim() || !guestGender.trim()))}>
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmittingComment ? "Enviando..." : "Enviar Opinión"}
                    </Button>
                  </div>
                </form>
              ) : ( 
                <Alert>
                  <LogIn className="h-4 w-4" />
                  <AlertTitle>Participación</AlertTitle>
                  <AlertDescription>
                    {currentUser === null ? (
                      "Cargando estado de usuario..."
                    ) : (
                      <>
                        Para calificar o comentar, considera <Link href="/login" className="font-semibold text-primary hover:underline">iniciar sesión</Link> o <Link href="/signup" className="font-semibold text-primary hover:underline">registrarte</Link> para una experiencia completa, aunque puedes continuar como invitado.
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="border-t pt-6 mt-6 space-y-6">
                <Tabs defaultValue="newest" onValueChange={(value) => setCommentSortOrder(value)} className="w-full">
                  <div className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                      <h4 className="text-lg font-medium">Comentarios ({displayedComments.length})</h4>
                      <TabsList className="flex h-auto w-full flex-wrap justify-center gap-1 sm:w-auto">
                        <TabsTrigger value="newest" className="text-xs sm:text-sm">Más Nuevos</TabsTrigger>
                        <TabsTrigger value="oldest" className="text-xs sm:text-sm">Más Antiguos</TabsTrigger>
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
        </div> 
      </div>

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
              setStarRatingOfCommentToDelete(null);
            }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCommentConfirmation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewerImageUrl && (
        <ImageGalleryViewer
            imageUrl={viewerImageUrl}
            isOpen={!!viewerImageUrl}
            onClose={() => setViewerImageUrl(null)}
        />
      )}
    </div>
  );
}
