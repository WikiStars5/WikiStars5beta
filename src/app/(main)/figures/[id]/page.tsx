
"use client";

import type { Figure } from "@/lib/types";
import { getFigureFromFirestore, getAllFiguresFromFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Info, UserCircle, Globe, Briefcase, Users2, Edit, Save, X, Loader2, LogIn } from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DisqusComments from '@/components/DisqusComments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState, useEffect, useCallback } from 'react';
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { PerceptionEmotions } from "@/components/figures/PerceptionEmotions";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

/*
RECOMMENDED FIRESTORE RULES:
(Apply these in your Firebase Console -> Firestore Database -> Rules)

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Rules for 'figures' collection ---
    match /figures/{figureId} {
      allow get: if true; // PUBLIC ACCESS: Allow anyone to read (get) individual figure documents.

      // ADMIN-ONLY ACCESS: Allow ONLY the admin (UID: JZP4A5GvZUbWuT0Y1DIiawWcSUp2)
      // to create and delete figure documents if they are NOT anonymous.
      allow create, delete: if request.auth != null &&
                              !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                              request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

      // AUTHENTICATED NON-ANONYMOUS USER ACCESS for updates:
      allow update: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      (
                        // Admin can update any field
                        request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'
                        ||
                        // Non-admin, non-anonymous users can update specific fields
                        (
                          (
                            request.resource.data.description != resource.data.description ||
                            request.resource.data.nationality != resource.data.nationality ||
                            request.resource.data.occupation != resource.data.occupation ||
                            request.resource.data.gender != resource.data.gender ||
                            request.resource.data.perceptionCounts != resource.data.perceptionCounts
                          ) &&
                          request.resource.data.name == resource.data.name &&
                          request.resource.data.id == resource.data.id // Prevent ID change
                        )
                      );
    }

    match /figures {
      allow list: if true; // PUBLIC ACCESS: Allow anyone to list all documents.
    }
    // --- End of rules for 'figures' collection ---

    // --- Rules for 'userPerceptions' collection ---
    match /userPerceptions/{perceptionDocId} {
      function getUserIdFromDocId() { return perceptionDocId.split('_')[0]; }
      function getFigureIdFromDocId() { return perceptionDocId.split('_')[1]; }
      function isOwnerNonAnonymous() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocId();
      }
      function isCreatingOwnValidDocNonAnonymous() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocId() &&
               request.resource.data.figureId == getFigureIdFromDocId() &&
               request.resource.data.keys().hasAll(['userId', 'figureId', 'emotion', 'timestamp']) &&
               request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      }
      allow read, delete: if isOwnerNonAnonymous();
      allow update: if isOwnerNonAnonymous() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emotion', 'timestamp']) &&
                      request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      allow create: if isCreatingOwnValidDocNonAnonymous();
    }
    // --- End of rules for 'userPerceptions' collection ---

    // --- Rules for 'users' collection ---
    match /users/{userId} {
      allow read: if request.auth != null &&
                     request.auth.uid == userId &&
                     !request.auth.token.firebase.sign_in_provider.matches('anonymous');
      allow create: if request.auth != null &&
                       request.auth.uid == userId &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       request.resource.data.uid == userId &&
                       request.resource.data.role == 'user' &&
                       request.resource.data.keys().hasAll([
                         'uid', 'email', 'username', 'photoURL',
                         'country', 'countryCode', 'role',
                         'createdAt', 'lastLoginAt'
                       ]);
      allow update: if request.auth != null &&
                       request.auth.uid == userId &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       !(request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'uid', 'email', 'createdAt', 'role'
                       ])) &&
                       (request.resource.data.photoURL == resource.data.photoURL || request.resource.data.photoURL == request.auth.token.picture);
      allow delete: if false;
    }
    // --- End of rules for 'users' collection ---
  }
}
*/

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
  const [isSaving, setIsSaving] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [canUserInteract, setCanUserInteract] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      setCanUserInteract(!!user && !user.isAnonymous); // Only non-anonymous users can interact
    });
    return () => unsubscribe();
  }, []);

  const fetchFigureData = useCallback(async () => {
    if (!id) {
      setFigure(undefined);
      return;
    }
    const fetchedFigure = await getFigureFromFirestore(id);
    setFigure(fetchedFigure || null);
    if (fetchedFigure) {
      setEditedDescription(fetchedFigure.description || "");
      setEditedNationality(fetchedFigure.nationality || "");
      setEditedOccupation(fetchedFigure.occupation || "");
      setEditedGender(fetchedFigure.gender || "");
    }
    try {
      const fetchedAllFigures = await getAllFiguresFromFirestore();
      setAllFigures(fetchedAllFigures);
    } catch (error) {
      console.error("Error fetching all figures for related section:", error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchFigureData();
    }
  }, [id, fetchFigureData]);

  useEffect(() => {
    if (figure && isEditing) {
      setEditedDescription(figure.description || "");
      setEditedNationality(figure.nationality || "");
      setEditedOccupation(figure.occupation || "");
      setEditedGender(figure.gender || "");
    }
  }, [figure, isEditing]);

  const handleEditToggle = () => {
    if (!canUserInteract) {
      toast({ title: "Acción Requerida", description: "Debes iniciar sesión con una cuenta para editar.", variant: "default" });
      return;
    }
    if (isEditing) { // Reset fields if cancelling edit
      if (figure) {
        setEditedDescription(figure.description || "");
        setEditedNationality(figure.nationality || "");
        setEditedOccupation(figure.occupation || "");
        setEditedGender(figure.gender || "");
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!figure || !canUserInteract) { // Check canUserInteract instead of just currentUser
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
      };

      await updateFigureInFirestore(updatedFigureData);

      toast({ title: "Éxito", description: "Información actualizada correctamente." });
      setIsEditing(false);
      await fetchFigureData(); // Re-fetch data to show updates
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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  const pageUrl = `${baseUrl}/figures/${figure.id}`;
  const commentsPageIdentifier = figure.id;
  const pageTitle = figure.name;

  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal-info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="personal-info" className="text-base py-2.5">Información Personal</TabsTrigger>
              <TabsTrigger value="comments" className="text-base py-2.5">Calificaciones y Comentarios</TabsTrigger>
              <TabsTrigger value="perception-emotions" className="text-base py-2.5">Percepción Emocional</TabsTrigger>
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

            <TabsContent value="comments">
              {figure && (
                <DisqusComments
                  pageUrl={pageUrl}
                  pageIdentifier={commentsPageIdentifier}
                  pageTitle={pageTitle}
                />
              )}
            </TabsContent>

            <TabsContent value="perception-emotions">
              {figure && (
                <PerceptionEmotions
                  figureId={figure.id}
                  figureName={figure.name}
                  initialPerceptionCounts={figure.perceptionCounts}
                  currentUser={currentUser}
                />
              )}
              {(!figure) && (
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
              Las discusiones y comentarios sobre {figure.name} son gestionados a través de Disqus.
              La información personal puede ser editada por usuarios con cuenta.
              ¡Expresa tu percepción emocional votando si has iniciado sesión con una cuenta!
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
