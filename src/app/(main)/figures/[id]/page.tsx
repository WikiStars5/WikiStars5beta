
"use client";

import type { Figure, UserComment, StarValue, StarValueAsString } from "@/lib/types";
import { getFigureFromFirestore, getAllFiguresFromFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  Image as ImageIcon, ImageOff, BarChartHorizontal, Star as StarIcon,
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap,
  MessagesSquare, Send, Trash2
} from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import Image from "next/image"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AttitudeVote } from '@/components/figures/AttitudeVote';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState, useEffect, useCallback } from 'react';
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { PerceptionEmotions } from "@/components/figures/PerceptionEmotions";
import { RatingSummaryDisplay } from "@/components/figures/RatingSummaryDisplay";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc, runTransaction, updateDoc as updateFirestoreDoc, query, where, orderBy, limit, getDocs, Timestamp, setDoc, deleteDoc } from 'firebase/firestore';
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
  const [canUserInteract, setCanUserInteract] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [newCommentStars, setNewCommentStars] = useState<StarValue | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsList, setCommentsList] = useState<UserComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const [starAudios, setStarAudios] = useState<Partial<Record<StarValue, HTMLAudioElement>>>({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null);
  const [starRatingOfCommentToDelete, setStarRatingOfCommentToDelete] = useState<StarValue | null>(null);


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
      setCanUserInteract(!!user && !user.isAnonymous);
      if (user && !user.isAnonymous && figure?.id) {
        const userStarRatingDocRef = doc(db, 'userStarRatings', `${user.uid}_${figure.id}`);
        getDoc(userStarRatingDocRef).then(docSnap => {
          if (docSnap.exists()) {
            setNewCommentStars(docSnap.data().starValue as StarValue);
          } else {
            setNewCommentStars(null);
          }
        });
      } else if (!user || user.isAnonymous) {
        setNewCommentStars(null);
      }
    });
    return () => unsubscribe();
  }, [figure?.id, currentUser]); 

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

  const fetchFigureAndComments = useCallback(async () => {
    if (!id) {
      setFigure(undefined); 
      setCommentsList([]);
      setIsLoadingComments(false);
      return;
    }
    setFigure(undefined); 
    setCommentsList([]); 
    setIsLoadingComments(true);

    try {
      const fetchedFigure = await getFigureFromFirestore(id);
      setFigure(fetchedFigure || null); 
      if (fetchedFigure) {
        resetEditFields(fetchedFigure);
        if (currentUser && !currentUser.isAnonymous) {
          const userStarRatingDocRef = doc(db, 'userStarRatings', `${currentUser.uid}_${id}`);
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

    try {
      const commentsQuery = query(
        collection(db, 'userComments'),
        where('figureId', '==', id),
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

    try {
      const fetchedAllFigures = await getAllFiguresFromFirestore();
      setAllFigures(fetchedAllFigures);
    } catch (error) {
      console.error("Error fetching all figures for related section:", error);
    }
  }, [id, resetEditFields, toast, currentUser]);

  useEffect(() => {
    if (id) {
      fetchFigureAndComments();
    }
  }, [id, fetchFigureAndComments]);

  useEffect(() => {
    if (figure && isEditing) {
      resetEditFields(figure);
    }
  }, [figure, isEditing, resetEditFields]);

  const handleEditToggle = () => {
    if (!canUserInteract) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión con una cuenta para editar.", variant: "default" });
      return;
    }
    if (isEditing) {
      resetEditFields(figure);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!figure || !canUserInteract) {
      toast({ title: "Error", description: "Debes iniciar sesión con una cuenta para guardar.", variant: "destructive" });
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
        photoUrl: editedPhotoUrl.trim() || 'https://placehold.co/400x600.png',
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
      fetchFigureAndComments(); 
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
    if (!canUserInteract || !currentUser || !figure) {
        toast({ title: "Error", description: "Debes iniciar sesión para opinar.", variant: "destructive" });
        return;
    }
    if (newCommentStars === null && newComment.trim() === "") {
        toast({ title: "Opinión Vacía", description: "Por favor, selecciona una calificación o escribe un comentario.", variant: "default" });
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
        username: currentUser.displayName || "Usuario Anónimo",
        userPhotoURL: currentUser.photoURL || null,
        text: newComment.trim(),
        starRatingGiven: currentStarsForComment, 
        createdAt: serverTimestamp(),
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
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
      fetchFigureAndComments(); 
    } catch (error: any) {
      console.error("Error submitting opinion:", error);
      toast({ title: "Error al Enviar", description: `No se pudo enviar tu opinión. ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmittingComment(false);
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
      fetchFigureAndComments(); 
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


  if (!id && figure === undefined) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2">Cargando ID...</p></div>;
  if (figure === undefined) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (figure === null) return <div className="text-center py-10"><h1 className="text-2xl font-bold">Figura No Encontrada</h1><p className="text-muted-foreground">ID: {id || "desconocido"}</p><Button asChild className="mt-4"><Link href="/">Ir al Inicio</Link></Button></div>;

  const relatedFigures = allFigures.filter(f => f.id !== figure.id).slice(0, 3);
  const isValidEditedPhotoUrl = editedPhotoUrl && (
    editedPhotoUrl.startsWith('https://upload.wikimedia.org') || 
    editedPhotoUrl.startsWith('https://static.wikia.nocookie.net') || 
    editedPhotoUrl.startsWith('https://firebasestorage.googleapis.com') || 
    editedPhotoUrl.startsWith('https://placehold.co') ||
    editedPhotoUrl.startsWith('https://i.pinimg.com')
  );

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

  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="personal-info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6"> 
              <TabsTrigger value="personal-info" className="text-base py-2.5 flex items-center gap-2"><Info className="h-5 w-5" />Información</TabsTrigger>
              <TabsTrigger value="attitude-poll" className="text-base py-2.5 flex items-center gap-2"><MessageSquare className="h-5 w-5" />Actitud</TabsTrigger>
              <TabsTrigger value="perception-emotions" className="text-base py-2.5 flex items-center gap-2"><SmilePlus className="h-5 w-5" />Emoción</TabsTrigger>
            </TabsList>

            <TabsContent value="personal-info">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center"><Info className="mr-2 h-6 w-6 text-primary" /><CardTitle className="text-2xl font-headline">Sobre {figure.name}</CardTitle></div>
                  {canUserInteract && !isEditing && (<Button variant="outline" size="sm" onClick={handleEditToggle}><Edit className="mr-2 h-4 w-4" />Editar</Button>)}
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {!canUserInteract && !isEditing && (<Alert variant="default" className="mb-4"><LogIn className="h-4 w-4" /><AlertTitle>Edición Restringida</AlertTitle><AlertDescription><Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link> para editar.</AlertDescription></Alert>)}
                  {isEditing && canUserInteract ? (
                    <div className="space-y-4">
                      {renderEditInput("photoUrl", "URL de Imagen", editedPhotoUrl, (e) => setEditedPhotoUrl(e.target.value), "Ej: https://...")}
                      <p className="text-xs text-muted-foreground mt-1">Dominios permitidos: Wikimedia, Wikia, Firebase Storage, Placehold.co, Pinterest.</p>
                      {editedPhotoUrl ? (isValidEditedPhotoUrl ? <div className="mt-2 relative w-32 h-40 border rounded-md overflow-hidden bg-muted flex items-center justify-center" data-ai-hint="image preview"><Image src={editedPhotoUrl} alt="Preview" layout="fill" objectFit="contain" /></div> : <p className="mt-1 text-xs text-destructive">URL no válida/permitida.</p>) : <div className="mt-2 w-32 h-40 border rounded-md bg-muted flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder abstract"><ImageOff className="h-10 w-10" /></div>}
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
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSaving ? "Guardando..." : "Guardar"}</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{figure.description || (canUserInteract ? "No hay descripción. ¡Añade una!" : "No hay descripción. Inicia sesión para añadir una.")}</p>
                      <div className="space-y-3 pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        {renderDetailItem(UserCircle, "Nombre Completo", figure.name)}
                        {renderDetailItem(NotepadText, "Alias", figure.alias)}
                        {renderDetailItem(Users2, "Género", figure.gender)}
                        {renderDetailItem(Zap, "Especie", figure.species)}
                        {renderDetailItem(BookOpen, "Primera Aparición", figure.firstAppearance)}
                        {renderDetailItem(Cake, "Nacimiento/Edad", figure.birthDateOrAge)}
                        {renderDetailItem(MapPin, "Lugar Nacimiento", figure.birthPlace)}
                        {renderDetailItem(Globe, "Nacionalidad", figure.nationality)}
                        {renderDetailItem(Briefcase, "Ocupación", figure.occupation)}
                        {renderDetailItem(Activity, "Estado", figure.statusLiveOrDead)}
                        {renderDetailItem(HeartHandshake, "Estado Civil", figure.maritalStatus)}
                        {renderDetailItem(StretchVertical, "Altura", figure.height)}
                        {renderDetailItem(Scale, "Peso", figure.weight)}
                        {renderDetailItem(Palette, "Color Cabello", figure.hairColor)}
                        {renderDetailItem(Eye, "Color Ojos", figure.eyeColor)}
                        {renderDetailItem(Scan, "Rasgos Distintivos", figure.distinctiveFeatures)}
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

          <Card className="mt-8 w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-headline"><MessagesSquare className="mr-3 h-7 w-7 text-primary" />Califica y Comenta sobre {figure.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {canUserInteract && figure && currentUser !== undefined ? (
                <form onSubmit={handleSubmitComment} className="space-y-6">
                  <div className="mb-4">
                    <Label htmlFor="newCommentStars" className="block text-sm font-medium text-foreground mb-2">Tu calificación (haz clic para seleccionar):</Label>
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
                    <Label htmlFor="newComment" className="sr-only">Tu comentario (opcional)</Label>
                    <Textarea id="newComment" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={newCommentStars ? "Añade un comentario (opcional)..." : "Escribe tu comentario aquí (opcional)..."} rows={4} className="w-full" disabled={isSubmittingComment} />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingComment || (!newComment.trim() && !newCommentStars)}>{isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{isSubmittingComment ? "Enviando..." : "Enviar Opinión"}</Button>
                  </div>
                </form>
              ) : ( <Alert><LogIn className="h-4 w-4" /><AlertTitle>Participación Restringida</AlertTitle><AlertDescription><Link href="/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link> para calificar y comentar.</AlertDescription></Alert>)}
              
              <div className="border-t pt-6 mt-6 space-y-6">
                <h4 className="text-lg font-medium">Comentarios Recientes ({commentsList.length})</h4>
                {isLoadingComments ? (<div className="flex justify-center items-center py-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Cargando...</p></div>
                ) : commentsList.length > 0 ? (
                  commentsList.map((comment) => (
                    <div key={comment.id} className="flex space-x-3 border-b pb-4 last:border-b-0 last:pb-0 relative group">
                      <Avatar className="h-10 w-10"><AvatarImage src={comment.userPhotoURL || undefined} alt={comment.username} data-ai-hint="user avatar" /><AvatarFallback>{comment.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">{comment.username}</p>
                            <div className="flex items-center space-x-2">
                                <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                                {currentUser && (currentUser.uid === comment.userId || currentUser.uid === ADMIN_UID) && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={() => openDeleteDialog(comment.id, comment.starRatingGiven)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Eliminar comentario</span>
                                </Button>
                                )}
                            </div>
                        </div>
                        {comment.starRatingGiven && (<div className="mt-1"><StarRating rating={comment.starRatingGiven} size={14} readOnly /></div>)}
                        {comment.text && comment.text.trim() !== "" && (<p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>)}
                      </div>
                    </div>
                  ))
                ) : (<p className="text-muted-foreground text-center py-4">No hay comentarios. ¡Sé el primero!</p>)}
              </div>
            </CardContent>
          </Card>
        </div> 

        <aside className="lg:col-span-1 space-y-6">
          <Alert><Terminal className="h-4 w-4" /><AlertTitle className="font-headline">Cómo Funciona</AlertTitle><AlertDescription className="text-sm">Edita información, expresa actitud/emoción y califica si tienes cuenta.</AlertDescription></Alert>
          {relatedFigures.length > 0 && (<div><h3 className="text-xl font-headline mb-4">También te podría interesar</h3><div className="space-y-4">{relatedFigures.map(relatedFig => (<FigureListItem key={relatedFig.id} figure={relatedFig} />))}</div></div>)}
        </aside>
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
    </div>
  );
}

