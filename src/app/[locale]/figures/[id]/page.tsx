
"use client";

import type { Figure, UserComment, StarValue, StarValueAsString, GalleryImage, FamilyMember } from "@/lib/types";
import { getFigureFromFirestore, getAllFiguresFromFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2 as FamilyIcon, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  ImageOff, BarChartHorizontal, Star as StarIcon,
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
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { PerceptionEmotions } from "@/components/figures/PerceptionEmotions";
import { RatingSummaryDisplay } from "@/components/figures/RatingSummaryDisplay";
import { ImageGalleryViewer } from "@/components/figures/ImageGalleryViewer";
import { FamilyTreeDisplay } from "@/components/figures/FamilyTreeDisplay";
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
import { submitGalleryImageAction } from "@/app/actions/figureGalleryActions";
import { updateCommentLikes } from "@/app/actions/commentRatingActions";
import { cn, correctMalformedUrl } from "@/lib/utils";

const STAR_SOUND_URLS: Record<StarValue, string> = {
  1: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar1.mp3?alt=media&token=a11df570-a6ee-4828-b5a9-81ccbb2c0457",
  2: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar2.mp3?alt=media&token=58cbf607-df0b-4bbd-b28e-291cf1951c18",
  3: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar3.mp3?alt=media&token=df67dc5b-28ab-4773-8266-60b9127a325f",
  4: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar4.mp3?alt=media&token=40c72095-e6a0-42d6-a3f6-86a81c356826",
  5: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar5.mp3?alt=media&token=8705fce9-1baa-4f49-8783-7bfc9d35a80f",
};

const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

export default function FigurePage() {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const router = useRouter();

  const [figure, setFigure] = useState<Figure | null | undefined>(undefined); 
  const [allFigures, setAllFigures] = useState<Figure[]>([]);
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [editedNationality, setEditedNationality] = useState("");
  const [editedOccupation, setEditedOccupation] = useState("");
  const [editedGender, setEditedGender] = useState("");
  const [editedPhotoUrl, setEditedPhotoUrl] = useState("");
  const [editedAlias, setEditedAlias] = useState("");
  const [editedSpecies, setEditedSpecies] = useState("");
  const [editedFirstAppearance, setEditedFirstAppearance] = useState("");
  const [editedBirthDateOrAge, setEditedBirthDateOrAge] = useState("");
  const [editedBirthPlace, setEditedBirthPlace] = useState("");
  const [editedStatusLiveOrDead, setEditedStatusLiveOrDead] = useState("");
  const [editedMaritalStatus, setEditedMaritalStatus] = useState("");
  const [editedHeight, setEditedHeight] = useState("");
  const [editedWeight, setEditedWeight] = useState("");
  const [editedHairColor, setEditedHairColor] = useState("");
  const [editedEyeColor, setEditedEyeColor] = useState("");
  const [editedDistinctiveFeatures, setEditedDistinctiveFeatures] = useState("");


  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [canEditFigure, setCanEditFigure] = useState(false);
  const [canCommentOrRate, setCanCommentOrRate] = useState(false);
  const [canVoteOnComments, setCanVoteOnComments] = useState(false);
  const [canSubmitGalleryImage, setCanSubmitGalleryImage] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [newCommentStars, setNewCommentStars] = useState<StarValue | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsList, setCommentsList] = useState<UserComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState<string | null>(null);

  const [replies, setReplies] = useState<Record<string, UserComment[]>>({});
  const [visibleReplies, setVisibleReplies] = useState<Record<string, boolean>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  const [starAudios, setStarAudios] = useState<Partial<Record<StarValue, HTMLAudioElement>>>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
  const [starRatingOfCommentToDelete, setStarRatingOfCommentToDelete] = useState<StarValue | null>(null);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSubmittingImage, setIsSubmittingImage] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoadingGalleryImages, setIsLoadingGalleryImages] = useState(true);

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


  const allowedImageDomains = useMemo(() => {
    return [
      'placehold.co', 'firebasestorage.googleapis.com', 'wikimedia.org', 
      'static.wikia.nocookie.net', 'i.pinimg.com', 'encrypted-tbn0.gstatic.com', 'm.media-amazon.com'
    ];
  }, []);


  useEffect(() => {
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

  const playSoundEffect = useCallback((starValue: StarValue) => {
    const audio = starAudios[starValue];
    if (audio) {
      audio.currentTime = 0; 
      audio.play().catch(error => console.error(`Error playing sound for star ${starValue}:`, error));
    } else {
      console.warn(`Audio for star ${starValue} not loaded.`);
    }
  }, [starAudios]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      const isNonAnonymous = !!user && !user.isAnonymous;
      const isAdmin = user?.uid === ADMIN_UID;
      
      setCanEditFigure(isNonAnonymous || isAdmin);
      setCanCommentOrRate(!!user); 
      setCanVoteOnComments(!!user); 
      setCanSubmitGalleryImage(isNonAnonymous);

      if (user && figure?.id) { 
        const userStarRatingDocRef = doc(db, 'userStarRatings', `${user.uid}_${figure.id}`);
        getDoc(userStarRatingDocRef).then(docSnap => {
          if (docSnap.exists()) {
            setNewCommentStars(docSnap.data().starValue as StarValue);
          } else {
            setNewCommentStars(null);
          }
        });
      } else {
        setNewCommentStars(null);
      }
    });
    return () => unsubscribe();
  }, [figure?.id]); 

  const resetEditFields = useCallback((currentFigure: Figure | null) => {
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

  const fetchFigureData = useCallback(async () => {
    if (!id) {
      setFigure(undefined); 
      return;
    }
    setFigure(undefined); 

    try {
      const [fetchedFigure, allFiguresData] = await Promise.all([
        getFigureFromFirestore(id),
        getAllFiguresFromFirestore(),
      ]);
      setFigure(fetchedFigure || null); 
      setAllFigures(allFiguresData);
      if (fetchedFigure) {
        resetEditFields(fetchedFigure);
        if (currentUser && fetchedFigure.id) {
          const userStarRatingDocRef = doc(db, 'userStarRatings', `${currentUser.uid}_${fetchedFigure.id}`);
          const docSnap = await getDoc(userStarRatingDocRef);
          if (docSnap.exists()) {
            setNewCommentStars(docSnap.data().starValue as StarValue);
          } else {
            setNewCommentStars(null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching figure details:", error);
      toast({ title: "Error al Cargar Figura", description: "No se pudo cargar la información de la figura.", variant: "destructive"});
      setFigure(null); 
    }
  }, [id, resetEditFields, toast, currentUser]);

  const fetchComments = useCallback(async () => {
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
        limit(20)
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
        });
      });
      setCommentsList(fetchedComments);
    } catch (error: any) {
      console.error("Error fetching comments:", error); 
      let errorMessage = "No se pudieron cargar los comentarios.";
      if (error.message && error.message.includes("firestore/failed-precondition")) {
          errorMessage = "Error al cargar comentarios: Es posible que falte un índice en Firestore. Revisa la consola del navegador (F12) para un enlace de creación de índice.";
      } else if (error.message) {
          errorMessage = `No se pudieron cargar los comentarios. Detalles: ${error.message}`;
      }
      toast({ title: "Error al Cargar Comentarios", description: errorMessage, variant: "destructive", duration: 7000 });
      setCommentsList([]); 
    } finally {
      setIsLoadingComments(false);
    }
  }, [id, toast]);

  const fetchGalleryImages = useCallback(async () => {
    if (!id) {
      setGalleryImages([]);
      setIsLoadingGalleryImages(false);
      return;
    }
    setGalleryImages([]);
    setIsLoadingGalleryImages(true);
    try {
      const galleryImagesQuery = query(
        collection(db, `figures/${id}/galleryImages`),
        orderBy('createdAt', 'desc'),
        limit(50) 
      );
      const querySnapshot = await getDocs(galleryImagesQuery);
      const fetchedImages: GalleryImage[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedImages.push({ id: docSnap.id, ...docSnap.data() } as GalleryImage);
      });
      setGalleryImages(fetchedImages);
    } catch (error: any) {
      console.error("Error fetching gallery images:", error);
      toast({ title: "Error al Cargar Galería", description: "No se pudieron cargar las imágenes de la galería.", variant: "destructive"});
    } finally {
      setIsLoadingGalleryImages(false);
    }
  }, [id, toast]);


  useEffect(() => {
    if (id) {
      fetchFigureData();
      fetchComments();
      fetchGalleryImages();
    }
  }, [id, fetchFigureData, fetchComments, fetchGalleryImages]);

  useEffect(() => {
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
      fetchFigureData(); 
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
    if (newComment.trim() === "") {
        toast({ title: "Comentario Requerido", description: "Es necesario escribir un comentario para poder enviar una opinión.", variant: "destructive" });
        return;
    }
    setIsSubmittingComment(true);
    
    const figureDocRef = doc(db, "figures", figure.id);
    const userStarRatingDocRef = doc(db, "userStarRatings", `${currentUser.uid}_${figure.id}`);
    const currentStarsForComment = newCommentStars;

    try {
      await runTransaction(db, async (transaction) => {
        const figureSnap = await transaction.get(figureDocRef);
        const userPrevRatingSnap = await transaction.get(userStarRatingDocRef); 

        if (!figureSnap.exists()) throw new Error("Figure document does not exist!");
        
        const figureData = figureSnap.data()!;
        const currentAggregatedStarCounts = (figureData.starRatingCounts || { "1":0,"2":0,"3":0,"4":0,"5":0 }) as Record<StarValueAsString, number>;
        const newAggregatedStarCounts = { ...currentAggregatedStarCounts };
        
        const previousUserStarValue: StarValue | null = userPrevRatingSnap.exists() ? userPrevRatingSnap.data()!.starValue as StarValue : null;

        if (previousUserStarValue !== null) {
          const prevKey = previousUserStarValue.toString() as StarValueAsString;
          newAggregatedStarCounts[prevKey] = Math.max(0, (newAggregatedStarCounts[prevKey] || 0) - 1);
        }
        
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
        
        transaction.update(figureDocRef, { starRatingCounts: newAggregatedStarCounts });
      });

      const commentData = {
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
      await addDoc(collection(db, 'userComments'), commentData);
      
      await runTransaction(db, async (transaction) => {
        const figureSnap = await transaction.get(figureDocRef);
        if (!figureSnap.exists()) throw new Error("Documento de la figura no existe!");
        const currentCommentCount = figureSnap.data().commentCount || 0;
        transaction.update(figureDocRef, { commentCount: currentCommentCount + 1 });
      });

      if (currentStarsForComment) {
        playSoundEffect(currentStarsForComment);
      }
      toast({ title: "Opinión Enviada", description: "Tu calificación y/o comentario ha sido guardado." });
      setNewComment("");
      fetchComments(); 
      fetchFigureData(); 
    } catch (error: any)
    {
      console.error("Error submitting opinion:", error);
      toast({ title: "Error al Enviar", description: `No se pudo enviar tu opinión. ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeDislike = async (commentId: string, action: 'like' | 'dislike', parentCommentId: string | null = null) => {
    if (!currentUser) {
        toast({ title: 'Acción Requerida', description: 'Debes estar conectado (incluso como invitado) para votar.' });
        return;
    }
    if (votingCommentId) return;
    setVotingCommentId(commentId);

    const updateCommentRecursively = (comments: UserComment[], targetCommentId: string, currentUserId: string, action: 'like' | 'dislike'): UserComment[] => {
        return comments.map(comment => {
            if (comment.id === targetCommentId) {
                let newLikes = comment.likes;
                let newDislikes = comment.dislikes;
                let newLikedBy = [...comment.likedBy];
                let newDislikedBy = [...comment.dislikedBy];

                const hasLiked = newLikedBy.includes(currentUserId);
                const hasDisliked = newDislikedBy.includes(currentUserId);

                if (action === 'like') {
                    if (hasLiked) {
                        newLikes--;
                        newLikedBy = newLikedBy.filter(id => id !== currentUserId);
                    } else {
                        newLikes++;
                        newLikedBy.push(currentUserId);
                        if (hasDisliked) {
                            newDislikes--;
                            newDislikedBy = newDislikedBy.filter(id => id !== currentUserId);
                        }
                    }
                } else {
                    if (hasDisliked) {
                        newDislikes--;
                        newDislikedBy = newDislikedBy.filter(id => id !== currentUserId);
                    } else {
                        newDislikes++;
                        newDislikedBy.push(currentUserId);
                        if (hasLiked) {
                            newLikes--;
                            newLikedBy = newLikedBy.filter(id => id !== currentUserId);
                        }
                    }
                }
                return {
                    ...comment,
                    likes: newLikes,
                    dislikes: newDislikes,
                    likedBy: newLikedBy,
                    dislikedBy: newDislikedBy,
                };
            }
            // This part is for potential future nested replies within replies, safe to keep
            if ((comment as any).replies && (comment as any).replies.length > 0) {
                const updatedReplies = updateCommentRecursively((comment as any).replies, targetCommentId, currentUserId, action);
                if (updatedReplies !== (comment as any).replies) {
                    return {
                        ...comment,
                        replies: updatedReplies,
                    };
                }
            }
            return comment;
        });
    };
    
    const originalComments = [...commentsList];
    const originalReplies = { ...replies };

    if (parentCommentId && replies[parentCommentId]) {
      // Optimistic update for a reply
      setReplies(prevReplies => ({
        ...prevReplies,
        [parentCommentId]: updateCommentRecursively(prevReplies[parentCommentId], commentId, currentUser.uid, action)
      }));
    } else {
      // Optimistic update for a top-level comment
      setCommentsList(updateCommentRecursively(commentsList, commentId, currentUser.uid, action));
    }


    try {
        const result = await updateCommentLikes(commentId, figure!.id, currentUser.uid, action);

        if (!result.success) {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
            // Revert optimistic update
            setCommentsList(originalComments);
            setReplies(originalReplies);
        }
        // No need for an else block, as onSnapshot will eventually catch the update.
    } catch (error: any) {
        console.error("Error al llamar a la acción del servidor para me gusta/no me gusta:", error);
        toast({ title: 'Error', description: `Error inesperado al votar: ${error.message}`, variant: 'destructive' });
        // Revert optimistic update
        setCommentsList(originalComments);
        setReplies(originalReplies);
    } finally {
        setVotingCommentId(null);
    }
};

  const handleSubmitGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitGalleryImage || !currentUser || !figure || !newImageUrl.trim()) {
      toast({ title: "Error", description: "Debes iniciar sesión y proporcionar una URL de imagen válida.", variant: "destructive" });
      return;
    }
    setIsSubmittingImage(true);
    const result = await submitGalleryImageAction(figure.id, newImageUrl, currentUser.uid, currentUser.displayName || "Usuario Anónimo");
    setIsSubmittingImage(false);

    if (result.success) {
      toast({ title: "Imagen Añadida", description: result.message });
      setNewImageUrl("");
      fetchGalleryImages(); 
    } else {
      toast({ title: "Error al Añadir Imagen", description: result.message, variant: "destructive" });
    }
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
      fetchFigureData(); 
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

  const handleOpenImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerOpen(true);
  };


  if (!id && figure === undefined) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2">Cargando ID...</p></div>;
  if (figure === undefined) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (figure === null) return <div className="text-center py-10"><h1 className="text-2xl font-bold">Figura No Encontrada</h1><p className="text-muted-foreground">ID: {id || "desconocido"}</p><Button asChild className="mt-4"><Link href="/">Ir al Inicio</Link></Button></div>;

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
    if (!canCommentOrRate || !currentUser || !figure || !replyText.trim()) {
      toast({ title: "Error", description: "Debes estar conectado y escribir un texto para responder.", variant: "destructive" });
      return;
    }
    setIsSubmittingReply(parentId);

    const figureRef = doc(db, "figures", figure.id);
    const parentCommentRef = doc(db, "userComments", parentId);

    try {
      const replyData = {
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

      await runTransaction(db, async (transaction) => {
        transaction.update(figureRef, { commentCount: increment(1) });
        transaction.update(parentCommentRef, { replyCount: increment(1) });
      });

      await addDoc(collection(db, 'userComments'), replyData);

      toast({ title: "Respuesta Enviada", description: "Tu respuesta ha sido guardada." });
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

  const renderComment = (comment: UserComment, level: number) => {
    const MAX_NESTING_LEVEL = 4; 
    const userHasLiked = !!currentUser && comment.likedBy.includes(currentUser.uid);
    const userHasDisliked = !!currentUser && comment.dislikedBy.includes(currentUser.uid);
    const isVoting = votingCommentId === comment.id;

    return (
      <div key={comment.id} className="relative group/comment">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={correctMalformedUrl(comment.userPhotoURL) || undefined} alt={comment.username} />
            <AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{comment.username}</p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                {currentUser && (currentUser.uid === comment.userId || canEditFigure) && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => openDeleteDialog(comment.id, comment.starRatingGiven)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Eliminar comentario</span>
                  </Button>
                )}
              </div>
            </div>
            {comment.starRatingGiven && (<div className="mt-1"><StarRating rating={comment.starRatingGiven} size={14} readOnly /></div>)}
            {comment.text && comment.text.trim() !== "" && (<p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>)}
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
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Respondiendo a ${comment.username}...`} rows={2} className="w-full text-sm" disabled={isSubmittingReply === comment.id} />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} disabled={isSubmittingReply === comment.id}>Cancelar</Button>
                  <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={isSubmittingReply === comment.id || !replyText.trim()}>
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
            {replies[comment.id].map(reply => renderComment({ ...reply, replies: replies[reply.id] || [] }, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-3 space-y-8">
          <Tabs defaultValue="attitude-poll" className="w-full">
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar mb-6 p-1 h-auto rounded-lg bg-muted"> 
              <TabsTrigger value="personal-info" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Info className="h-4 sm:h-5 w-4 sm:w-5" />Información</TabsTrigger>
              <TabsTrigger value="attitude-poll" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 sm:h-5 w-4 sm:w-5" />Actitud</TabsTrigger>
              <TabsTrigger value="perception-emotions" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><SmilePlus className="h-4 sm:h-5 w-4 sm:w-5" />Emoción</TabsTrigger>
              <TabsTrigger value="image-gallery" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Images className="h-4 sm:h-5 w-4 sm:w-5" />Galería</TabsTrigger>
              <TabsTrigger value="family-tree" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><FamilyIcon className="h-4 sm:h-5 w-4 sm:w-5" />Familia</TabsTrigger>
            </TabsList>

            <TabsContent value="personal-info">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center"><Info className="mr-2 h-6 w-6 text-primary" /><CardTitle className="text-2xl font-headline">Sobre {figure.name}</CardTitle></div>
                  {canEditFigure && !isEditing && (<Button variant="outline" size="sm" onClick={handleEditToggle}><Edit className="mr-2 h-4 w-4" />Editar</Button>)}
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {!canEditFigure && !isEditing && (
                    <Alert variant="default" className="mb-4">
                        <LogIn className="h-4 w-4" />
                        <AlertTitle>Edición para usuarios registrados</AlertTitle>
                        <AlertDescription>
                          Para editar la información de esta figura, necesitas{" "}
                          <Link href="/login" className="font-semibold text-primary hover:underline">iniciar sesión</Link> con una cuenta.
                        </AlertDescription>
                    </Alert>
                  )}
                  {isEditing && canEditFigure ? (
                    <div className="space-y-4">
                      {renderEditInput("photoUrl", "URL de Imagen Principal", editedPhotoUrl, (e) => setEditedPhotoUrl(e.target.value), "Ej: https://...")}
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
                      {figure.description && <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{figure.description}</p>}
                      <div className="space-y-3 pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        {figure.alias && renderDetailItem(NotepadText, "Alias", figure.alias)}
                        {figure.gender && renderDetailItem(FamilyIcon, "Género", figure.gender)}
                        {figure.species && renderDetailItem(Zap, "Especie", figure.species)}
                        {figure.firstAppearance && renderDetailItem(BookOpen, "Primera Aparición", figure.firstAppearance)}
                        {figure.birthDateOrAge && renderDetailItem(Cake, "Nacimiento/Edad", figure.birthDateOrAge)}
                        {figure.birthPlace && renderDetailItem(MapPin, "Lugar Nacimiento", figure.birthPlace)}
                        {figure.nationality && renderDetailItem(Globe, "Nacionalidad", figure.nationality)}
                        {figure.occupation && renderDetailItem(Briefcase, "Ocupación", figure.occupation)}
                        {figure.statusLiveOrDead && renderDetailItem(Activity, "Estado (Vivo/Muerto)", figure.statusLiveOrDead)}
                        {figure.maritalStatus && renderDetailItem(HeartHandshake, "Estado Civil", figure.maritalStatus)}
                        {figure.height && renderDetailItem(StretchVertical, "Altura", figure.height)}
                        {figure.weight && renderDetailItem(Scale, "Peso", figure.weight)}
                        {figure.hairColor && renderDetailItem(Palette, "Color Cabello", figure.hairColor)}
                        {figure.eyeColor && renderDetailItem(Eye, "Color Ojos", figure.eyeColor)}
                        {figure.distinctiveFeatures && renderDetailItem(Scan, "Rasgos Distintivos", figure.distinctiveFeatures)}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attitude-poll">{figure && currentUser !== undefined && (<AttitudeVote figureId={figure.id} figureName={figure.name} initialAttitudeCounts={figure.attitudeCounts} currentUser={currentUser} />)}{(!figure || currentUser === undefined) && (<div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}</TabsContent>
            <TabsContent value="perception-emotions">{figure && currentUser !== undefined && (<PerceptionEmotions figureId={figure.id} figureName={figure.name} initialPerceptionCounts={figure.perceptionCounts} currentUser={currentUser} />)}{(!figure || currentUser === undefined) && (<div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}</TabsContent>
            
            <TabsContent value="image-gallery">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-headline"><Images className="mr-3 h-7 w-7 text-primary" />Galería de Imágenes de {figure.name}</CardTitle>
                  <CardDescription>Imágenes de la comunidad. Dominios permitidos: Wikimedia, Wikia, Firebase Storage, Placehold.co, Pinterest, etc.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {canSubmitGalleryImage && (
                    <form onSubmit={handleSubmitGalleryImage} className="flex items-end gap-2 mb-6 p-4 border rounded-lg bg-muted/50">
                      <div className="flex-grow">
                        <Label htmlFor="newImageUrl" className="sr-only">URL de la Imagen</Label>
                        <Input 
                          id="newImageUrl" 
                          type="url" 
                          value={newImageUrl} 
                          onChange={(e) => setNewImageUrl(e.target.value)} 
                          placeholder="Pega aquí la URL de la imagen..." 
                          disabled={isSubmittingImage}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isSubmittingImage || !newImageUrl.trim()}>
                        {isSubmittingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Añadir
                      </Button>
                    </form>
                  )}
                  {!canSubmitGalleryImage && (
                     <Alert variant="default"><LogIn className="h-4 w-4" /><AlertTitle>Añadir a la Galería</AlertTitle><AlertDescription>
                       <Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión con una cuenta</Link> para añadir imágenes.
                     </AlertDescription></Alert>
                  )}

                  {isLoadingGalleryImages ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando galería...</p></div>
                  ) : galleryImages.length > 0 ? (
                    <div className="columns-1 xs:columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
                      {galleryImages.map((img, index) => (
                        <button
                          key={img.id}
                          onClick={() => handleOpenImageViewer(index)}
                          className="group mb-3 block break-inside-avoid relative overflow-hidden rounded-md shadow-md hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          aria-label={`Ver imagen ${index + 1} de ${figure.name}`}
                        >
                          <Image 
                            src={correctMalformedUrl(img.imageUrl)} 
                            alt={`Imagen de galería para ${figure.name} - ${index + 1}`} 
                            width={0}
                            height={0}
                            sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
                            style={{ width: '100%', height: 'auto' }}
                            className="w-full h-auto object-contain rounded-md group-hover:scale-105 transition-transform"
                          />
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIconLucide className="h-10 w-10 text-white/80" />
                            </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-10">Aún no hay imágenes en la galería. ¡Sé el primero en añadir una!</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="family-tree">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-headline"><FamilyIcon className="mr-3 h-7 w-7 text-primary" />Árbol Genealógico de {figure.name}</CardTitle>
                   <CardDescription>Relaciones familiares conocidas de {figure.name}. Edita la información directamente aquí.</CardDescription>
                </CardHeader>
                <CardContent>
                  {figure && allFigures && <FamilyTreeDisplay figure={figure} allFigures={allFigures} canEdit={canEditFigure} />}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {figure && (<RatingSummaryDisplay figureName={figure.name} starRatingCounts={figure.starRatingCounts} />)}

          <Card className="mt-8 w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-headline"><MessagesSquare className="mr-3 h-7 w-7 text-primary" />Califica y Comenta sobre {figure.name}</CardTitle>
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
                  <div>
                    <Label htmlFor="newComment" className="sr-only">Tu comentario</Label>
                    <Textarea id="newComment" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe tu comentario aquí (obligatorio)..." rows={4} className="w-full" disabled={isSubmittingComment} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}><Send className="mr-2 h-4 w-4" />{isSubmittingComment ? "Enviando..." : "Enviar Opinión"}</Button>
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
                <h4 className="text-lg font-medium">Comentarios Recientes ({commentsList.length})</h4>
                {isLoadingComments ? (<div className="flex justify-center items-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando...</p></div>
                ) : commentsList.length > 0 ? (
                  commentsList.map((comment) => renderComment(comment, 0))
                ) : (<p className="text-muted-foreground text-center py-4">No hay comentarios. ¡Sé el primero!</p>)}
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

      {isViewerOpen && galleryImages.length > 0 && (
        <ImageGalleryViewer
          images={galleryImages.map(img => ({...img, imageUrl: correctMalformedUrl(img.imageUrl)}))}
          initialIndex={selectedImageIndex}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}
