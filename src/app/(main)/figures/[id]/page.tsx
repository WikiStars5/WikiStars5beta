
"use client";

import type { Figure } from "@/lib/types";
import { getFigureFromFirestore, getAllFiguresFromFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Info, UserCircle, Globe, Briefcase, Users2, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, Image as ImageIcon, ImageOff, BarChartHorizontal } from "lucide-react";
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
import { RatingSummaryDisplay } from "@/components/figures/RatingSummaryDisplay"; // Importado
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


  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="personal-info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="personal-info" className="text-base py-2.5 flex items-center gap-2"><Info className="h-5 w-5" />Información Personal</TabsTrigger>
              <TabsTrigger value="attitude-poll" className="text-base py-2.5 flex items-center gap-2"><MessageSquare className="h-5 w-5" />¿Qué te consideras?</TabsTrigger>
              <TabsTrigger value="perception-emotions" className="text-base py-2.5 flex items-center gap-2"><SmilePlus className="h-5 w-5" />Percepción Emocional</TabsTrigger>
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
                      <div>
                        <Label htmlFor="photoUrl" className="font-semibold text-foreground/90">URL de la Imagen del Perfil</Label>
                        <Input
                          id="photoUrl"
                          type="url"
                          value={editedPhotoUrl}
                          onChange={(e) => setEditedPhotoUrl(e.target.value)}
                          placeholder="Ej: https://upload.wikimedia.org/... o https://static.wikia.nocookie.net/..."
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Pega una URL de Wikimedia Commons, Wikia (static.wikia.nocookie.net), Firebase Storage o Placehold.co.
                        </p>
                        {editedPhotoUrl ? (
                          isValidEditedPhotoUrl ? (
                            <div className="mt-2 relative w-32 h-40 border rounded-md overflow-hidden bg-muted flex items-center justify-center data-ai-hint='image preview'">
                              <Image
                                src={editedPhotoUrl}
                                alt="Previsualización de imagen"
                                layout="fill"
                                objectFit="contain"
                              />
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-destructive">URL no válida o de un dominio no permitido para previsualización.</p>
                          )
                        ) : (
                          <div className="mt-2 w-32 h-40 border rounded-md bg-muted flex items-center justify-center text-muted-foreground data-ai-hint='placeholder abstract'">
                            <ImageOff className="h-10 w-10" />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description" className="font-semibold text-foreground/90">Descripción</Label>
                        <Textarea
                          id="description"
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          placeholder="Añade una descripción..."
                          rows={5}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationality" className="font-semibold text-foreground/90">Nacionalidad</Label>
                        <Input
                          id="nationality"
                          value={editedNationality}
                          onChange={(e) => setEditedNationality(e.target.value)}
                          placeholder="Ej: Estadounidense"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="occupation" className="font-semibold text-foreground/90">Ocupación</Label>
                        <Input
                          id="occupation"
                          value={editedOccupation}
                          onChange={(e) => setEditedOccupation(e.target.value)}
                          placeholder="Ej: Científico, Artista"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender" className="font-semibold text-foreground/90">Género</Label>
                        <Input
                          id="gender"
                          value={editedGender}
                          onChange={(e) => setEditedGender(e.target.value)}
                          placeholder="Ej: Masculino, Femenino"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
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

                      <div className="space-y-3 pt-4">
                        <div className="flex items-start">
                          <UserCircle className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-semibold text-foreground/90">Nombre Completo</p>
                            <p className="text-sm text-muted-foreground">{figure.name || "No disponible"}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Globe className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-semibold text-foreground/90">Nacionalidad</p>
                            <p className="text-sm text-muted-foreground">{figure.nationality || "No disponible"}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Briefcase className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-semibold text-foreground/90">Ocupación</p>
                            <p className="text-sm text-muted-foreground">{figure.occupation || "No disponible"}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Users2 className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-semibold text-foreground/90">Género</p>
                            <p className="text-sm text-muted-foreground">{figure.gender || "No disponible"}</p>
                          </div>
                        </div>
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
          </Tabs>

          {/* Nueva Sección de Resumen de Calificaciones */}
          {figure && (
            <RatingSummaryDisplay
              figureName={figure.name}
              averageRating={figure.averageRating}
              totalRatings={figure.totalRatings}
              ratingDistribution={figure.ratingDistribution}
            />
          )}
          {/* Aquí irían los componentes para escribir y listar reseñas en el futuro */}

        </div>

        <aside className="lg:col-span-1 space-y-6">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-headline">Cómo Funciona</AlertTitle>
            <AlertDescription className="text-sm">
              La información personal y la imagen de perfil pueden ser editadas por usuarios con cuenta.
              ¡Expresa tu actitud y percepción emocional votando si has iniciado sesión con una cuenta!
              Las calificaciones y reseñas (próximamente) te permitirán compartir tu opinión detallada.
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

