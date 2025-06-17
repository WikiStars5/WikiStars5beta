
"use client";

import type { Figure } from "@/lib/types";
import { getFigureFromFirestore, getAllFiguresFromFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  Image as ImageIcon, ImageOff, BarChartHorizontal, Star as StarIcon,
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap 
} from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import Image from "next/image"; // For preview
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
import { StarRatingVote } from "@/components/figures/StarRatingVote";
import { RatingSummaryDisplay } from "@/components/figures/RatingSummaryDisplay"; // Import the new component
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";


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

  // New edited state fields
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      setCanUserInteract(!!user && !user.isAnonymous);
    });
    return () => unsubscribe();
  }, []);

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
    const fetchedFigure = await getFigureFromFirestore(id);
    setFigure(fetchedFigure || null);
    if (fetchedFigure) {
      resetEditFields(fetchedFigure);
    }
    try {
      const fetchedAllFigures = await getAllFiguresFromFirestore();
      setAllFigures(fetchedAllFigures);
    } catch (error) {
      console.error("Error fetching all figures for related section:", error);
    }
  }, [id, resetEditFields]);

  useEffect(() => {
    if (id) {
      fetchFigureData();
    }
  }, [id, fetchFigureData]);

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
      await fetchFigureData();
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

  if (!id && figure === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Cargando ID de la figura...</p>
      </div>
    );
  }

  if (figure === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!figure) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Figura No Encontrada</h1>
        <p className="text-muted-foreground">El perfil (ID: {id || "desconocido"}) que buscas no existe en Firestore.</p>
        <Button asChild className="mt-4">
          <Link href="/">Ir a la Página Principal</Link>
        </Button>
      </div>
    );
  }

  const relatedFigures = allFigures.filter(f => f.id !== figure.id).slice(0, 3);
  const isValidEditedPhotoUrl = editedPhotoUrl && (editedPhotoUrl.startsWith('https://upload.wikimedia.org') || editedPhotoUrl.startsWith('https://static.wikia.nocookie.net') || editedPhotoUrl.startsWith('https://firebasestorage.googleapis.com') || editedPhotoUrl.startsWith('https://placehold.co'));

  const renderDetailItem = (icon: React.ElementType, label: string, value?: string) => {
    const IconComponent = icon;
    return (
      <div className="flex items-start">
        <IconComponent className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
        <div>
          <p className="font-semibold text-foreground/90">{label}</p>
          <p className="text-sm text-muted-foreground">{value || "No disponible"}</p>
        </div>
      </div>
    );
  };
  
  const renderEditInput = (id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string) => (
    <div>
      <Label htmlFor={id} className="font-semibold text-foreground/90">{label}</Label>
      <Input id={id} value={value} onChange={onChange} placeholder={placeholder || `Ej: ${label}`} className="mt-1" />
    </div>
  );

  const renderEditTextarea = (id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string, rows?: number) => (
    <div>
      <Label htmlFor={id} className="font-semibold text-foreground/90">{label}</Label>
      <Textarea id={id} value={value} onChange={onChange} placeholder={placeholder || `Añade ${label.toLowerCase()}...`} rows={rows || 3} className="mt-1" />
    </div>
  );


  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="personal-info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="personal-info" className="text-base py-2.5 flex items-center gap-2"><Info className="h-5 w-5" />Información</TabsTrigger>
              <TabsTrigger value="attitude-poll" className="text-base py-2.5 flex items-center gap-2"><MessageSquare className="h-5 w-5" />Actitud</TabsTrigger>
              <TabsTrigger value="perception-emotions" className="text-base py-2.5 flex items-center gap-2"><SmilePlus className="h-5 w-5" />Emoción</TabsTrigger>
              <TabsTrigger value="star-rating" className="text-base py-2.5 flex items-center gap-2"><StarIcon className="h-5 w-5" />Calificar</TabsTrigger>
            </TabsList>

            <TabsContent value="personal-info">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center">
                    <Info className="mr-2 h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl font-headline">
                      Sobre {figure.name}
                    </CardTitle>
                  </div>
                  {canUserInteract && !isEditing && (
                    <Button variant="outline" size="sm" onClick={handleEditToggle}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {!canUserInteract && !isEditing && (
                    <Alert variant="default" className="mb-4">
                      <LogIn className="h-4 w-4" />
                      <AlertTitle>Edición Restringida</AlertTitle>
                      <AlertDescription>
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                          Inicia sesión con una cuenta
                        </Link>
                        {" "}para editar la información de esta figura.
                      </AlertDescription>
                    </Alert>
                  )}
                  {isEditing && canUserInteract ? (
                    <div className="space-y-4">
                      {renderEditInput("photoUrl", "URL de la Imagen del Perfil", editedPhotoUrl, (e) => setEditedPhotoUrl(e.target.value), "Ej: https://upload.wikimedia.org/...")}
                       <p className="text-xs text-muted-foreground mt-1">
                          Pega una URL de Wikimedia Commons, Wikia (static.wikia.nocookie.net), Firebase Storage o Placehold.co.
                        </p>
                        {editedPhotoUrl ? (
                          isValidEditedPhotoUrl ? (
                            <div className="mt-2 relative w-32 h-40 border rounded-md overflow-hidden bg-muted flex items-center justify-center data-ai-hint='image preview'">
                              <Image src={editedPhotoUrl} alt="Previsualización de imagen" layout="fill" objectFit="contain" />
                            </div>
                          ) : ( <p className="mt-1 text-xs text-destructive">URL no válida o de un dominio no permitido para previsualización.</p>)
                        ) : ( <div className="mt-2 w-32 h-40 border rounded-md bg-muted flex items-center justify-center text-muted-foreground data-ai-hint='placeholder abstract'"><ImageOff className="h-10 w-10" /></div>)}
                      
                      {renderEditTextarea("description", "Descripción", editedDescription, (e) => setEditedDescription(e.target.value), "Añade una descripción...", 5)}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        {renderEditInput("alias", "Alias / Otros Nombres", editedAlias, (e) => setEditedAlias(e.target.value), "Ej: La Sacerdotisa del Trueno")}
                        {renderEditInput("species", "Especie / Raza", editedSpecies, (e) => setEditedSpecies(e.target.value), "Ej: Demonio, Humano")}
                        {renderEditInput("firstAppearance", "Primera Aparición", editedFirstAppearance, (e) => setEditedFirstAppearance(e.target.value), "Ej: High School DxD, Novela Ligera, 2008")}
                        {renderEditInput("birthDateOrAge", "Fecha de Nacimiento / Edad", editedBirthDateOrAge, (e) => setEditedBirthDateOrAge(e.target.value), "Ej: Desconocida / Apariencia de 18 años")}
                        {renderEditInput("birthPlace", "Lugar de Nacimiento", editedBirthPlace, (e) => setEditedBirthPlace(e.target.value), "Ej: Inframundo, Japón")}
                        {renderEditInput("nationality", "Nacionalidad", editedNationality, (e) => setEditedNationality(e.target.value), "Ej: Estadounidense")}
                        {renderEditInput("occupation", "Ocupación", editedOccupation, (e) => setEditedOccupation(e.target.value), "Ej: Científico, Artista")}
                        {renderEditInput("gender", "Género", editedGender, (e) => setEditedGender(e.target.value), "Ej: Masculino, Femenino")}
                        {renderEditInput("statusLiveOrDead", "Estado (Vivo/Muerto)", editedStatusLiveOrDead, (e) => setEditedStatusLiveOrDead(e.target.value), "Ej: Viva, Muerto")}
                        {renderEditInput("maritalStatus", "Estado Civil", editedMaritalStatus, (e) => setEditedMaritalStatus(e.target.value), "Ej: Soltero/a, Casado/a")}
                        {renderEditInput("height", "Altura", editedHeight, (e) => setEditedHeight(e.target.value), "Ej: 1.68 cm")}
                        {renderEditInput("weight", "Peso", editedWeight, (e) => setEditedWeight(e.target.value), "Ej: 56 kg (Opcional)")}
                        {renderEditInput("hairColor", "Color de Cabello", editedHairColor, (e) => setEditedHairColor(e.target.value), "Ej: Negro")}
                        {renderEditInput("eyeColor", "Color de Ojos", editedEyeColor, (e) => setEditedEyeColor(e.target.value), "Ej: Violeta")}
                        {renderEditTextarea("distinctiveFeatures", "Rasgos Distintivos", editedDistinctiveFeatures, (e) => setEditedDistinctiveFeatures(e.target.value), "Ej: Una cola de caballo alta, cicatriz...", 3)}
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
                          <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {figure.description ? (
                        <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{figure.description}</p>
                      ) : (
                        <p className="text-base text-muted-foreground">No hay una descripción disponible. {canUserInteract ? "¡Anímate a añadir una!" : "Inicia sesión para añadir una."}</p>
                      )}

                      <div className="space-y-3 pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                        {renderDetailItem(UserCircle, "Nombre Completo", figure.name)}
                        {renderDetailItem(NotepadText, "Alias / Otros Nombres", figure.alias)}
                        {renderDetailItem(Users2, "Género", figure.gender)}
                        {renderDetailItem(Zap, "Especie / Raza", figure.species)}
                        {renderDetailItem(BookOpen, "Primera Aparición", figure.firstAppearance)}
                        {renderDetailItem(Cake, "Fecha de Nacimiento / Edad", figure.birthDateOrAge)}
                        {renderDetailItem(MapPin, "Lugar de Nacimiento", figure.birthPlace)}
                        {renderDetailItem(Globe, "Nacionalidad", figure.nationality)}
                        {renderDetailItem(Briefcase, "Ocupación", figure.occupation)}
                        {renderDetailItem(Activity, "Estado (Vivo/Muerto)", figure.statusLiveOrDead)}
                        {renderDetailItem(HeartHandshake, "Estado Civil", figure.maritalStatus)}
                        {renderDetailItem(StretchVertical, "Altura", figure.height)}
                        {renderDetailItem(Scale, "Peso", figure.weight)}
                        {renderDetailItem(Palette, "Color de Cabello", figure.hairColor)}
                        {renderDetailItem(Eye, "Color de Ojos", figure.eyeColor)}
                        {renderDetailItem(Scan, "Rasgos Distintivos", figure.distinctiveFeatures)}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attitude-poll">
              {figure && currentUser !== undefined && (
                <AttitudeVote
                  figureId={figure.id}
                  figureName={figure.name}
                  initialAttitudeCounts={figure.attitudeCounts}
                  currentUser={currentUser}
                />
              )}
              {(!figure || currentUser === undefined) && (
                 <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="perception-emotions">
              {figure && currentUser !== undefined && (
                <PerceptionEmotions
                  figureId={figure.id}
                  figureName={figure.name}
                  initialPerceptionCounts={figure.perceptionCounts}
                  currentUser={currentUser}
                />
              )}
              {(!figure || currentUser === undefined) && (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="star-rating">
              {figure && currentUser !== undefined && (
                <>
                  <RatingSummaryDisplay 
                    figureName={figure.name} 
                    starRatingCounts={figure.starRatingCounts} 
                  />
                  <StarRatingVote
                    figureId={figure.id}
                    figureName={figure.name}
                    initialStarRatingCounts={figure.starRatingCounts}
                    currentUser={currentUser}
                  />
                </>
              )}
              {(!figure || currentUser === undefined) && (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-headline">Cómo Funciona</AlertTitle>
            <AlertDescription className="text-sm">
              La información personal y la imagen de perfil pueden ser editadas por usuarios con cuenta.
              ¡Expresa tu actitud, emoción y califica con estrellas si has iniciado sesión con una cuenta!
            </AlertDescription>
          </Alert>

          {relatedFigures.length > 0 && (
            <div>
              <h3 className="text-xl font-headline mb-4">También te podría interesar</h3>
              <div className="space-y-4">
                {relatedFigures.map(relatedFig => (
                  <FigureListItem key={relatedFig.id} figure={relatedFig} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

