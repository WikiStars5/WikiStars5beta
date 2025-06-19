
"use client";

import type { Figure } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ImageOff, PlusCircle, Edit3, Save, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateFigureInFirestore } from "@/lib/placeholder-data"; // Asumiendo que esta función puede actualizar solo el photoUrl

interface FamilyTreeDisplayProps {
  figure: Figure;
  allFigures: Figure[]; 
}

const AddRelationButton = ({ onClick, label, positionClass, title }: { onClick: () => void; label: string, positionClass: string, title: string }) => (
  <Button
    variant="outline"
    size="icon"
    className={`absolute ${positionClass} rounded-full w-10 h-10 bg-card hover:bg-primary/10 border-primary text-primary z-10 shadow-lg flex items-center justify-center`}
    onClick={onClick}
    aria-label={label}
    title={title}
  >
    <PlusCircle className="h-6 w-6" />
  </Button>
);


export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  const { toast } = useToast();
  const router = useRouter();

  const [isEditingCentralNode, setIsEditingCentralNode] = useState(false);
  const [editableCentralPhotoUrl, setEditableCentralPhotoUrl] = useState(figure.photoUrl || '');
  const [isSavingCentralNode, setIsSavingCentralNode] = useState(false);

  const handleAddParents = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Padres/Madre aún no implementada." });
  };

  const handleAddPartner = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Pareja aún no implementada." });
  };

  const handleAddChildren = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Hijos aún no implementada." });
  };

  const handleEditCentralNode = () => {
    setEditableCentralPhotoUrl(figure.photoUrl || '');
    setIsEditingCentralNode(true);
  };

  const handleCancelCentralNodeEdit = () => {
    setEditableCentralPhotoUrl(figure.photoUrl || ''); // Revertir a la original
    setIsEditingCentralNode(false);
  };

  const handleSaveCentralNodeImage = async () => {
    if (!editableCentralPhotoUrl.trim()) {
        toast({ title: "Error", description: "La URL de la imagen no puede estar vacía.", variant: "destructive"});
        return;
    }
    // Simple URL validation (basic check, can be improved)
    try {
        new URL(editableCentralPhotoUrl);
    } catch (_) {
        toast({ title: "Error", description: "La URL de la imagen no es válida.", variant: "destructive"});
        return;
    }

    setIsSavingCentralNode(true);
    try {
      await updateFigureInFirestore({ id: figure.id, photoUrl: editableCentralPhotoUrl });
      toast({ title: "Éxito", description: "La imagen principal de la figura ha sido actualizada." });
      setIsEditingCentralNode(false);
      router.refresh(); // Para recargar los datos del servidor
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: `No se pudo actualizar la imagen: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSavingCentralNode(false);
    }
  };

  const displayImageUrl = isEditingCentralNode ? editableCentralPhotoUrl : (figure.photoUrl || '');


  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-[500px] w-full">
      <div className="relative" style={{ marginBottom: '40px', marginTop: '40px', marginRight: '40px', marginLeft: '40px' }}>
        <AddRelationButton
          onClick={handleAddParents}
          label="Añadir Padres"
          title="Añadir Padre o Madre"
          positionClass="-top-12 left-1/2 -translate-x-1/2 transform"
        />

        <Card className="w-60 md:w-64 shadow-xl border-2 border-primary/30 relative overflow-visible bg-card">
          <CardHeader className="p-0">
            <div className="relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b border-primary/20">
              {displayImageUrl ? (
                <Image
                  src={displayImageUrl}
                  alt={`Imagen de ${figure.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 240px, 256px"
                  key={displayImageUrl} // Fuerza el re-renderizado si la URL cambia
                  data-ai-hint="figure portrait"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder abstract person">
                  <ImageOff className="w-16 h-16" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2 text-sm">
            <h3 className="text-md font-semibold text-center text-primary truncate" title={figure.name}>
              {figure.name}
            </h3>
            
            {isEditingCentralNode ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`imageUrl-${figure.id}`} className="text-xs text-muted-foreground block mb-1">
                    Url de la imagen: <span className="italic">(esto solo es visible cuando se edita)</span>
                  </Label>
                  <Input
                    id={`imageUrl-${figure.id}`}
                    type="url"
                    value={editableCentralPhotoUrl}
                    onChange={(e) => setEditableCentralPhotoUrl(e.target.value)}
                    className="text-xs h-8"
                    placeholder="Link de dominio permitido"
                    disabled={isSavingCentralNode}
                  />
                </div>
                <div className="flex justify-between gap-2 mt-2">
                   <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 py-1 h-auto text-xs"
                    onClick={handleCancelCentralNodeEdit}
                    disabled={isSavingCentralNode}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 py-1 h-auto text-xs"
                    onClick={handleSaveCentralNodeImage}
                    disabled={isSavingCentralNode}
                  >
                    {isSavingCentralNode ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1 py-1 h-auto text-xs border-primary/40 text-primary/70 hover:bg-primary/10 hover:text-primary"
                onClick={handleEditCentralNode}
              >
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                EDITAR
              </Button>
            )}
          </CardContent>
        </Card>

        <AddRelationButton
          onClick={handleAddPartner}
          label="Añadir Pareja"
          title="Añadir Pareja (ej. Esposo/a, Novio/a)"
          positionClass="top-1/2 -right-12 -translate-y-1/2 transform"
        />

        <AddRelationButton
          onClick={handleAddChildren}
          label="Añadir Hijos"
          title="Añadir Hijos"
          positionClass="-bottom-12 left-1/2 -translate-x-1/2 transform"
        />
      </div>
      <CardDescription className="text-center mt-6 text-xs px-4 max-w-md">
        Esta es la vista inicial para construir el árbol genealógico. Haz clic en los botones (+) para añadir familiares.
        Haz clic en "EDITAR" en la tarjeta para cambiar la imagen principal de esta figura.
      </CardDescription>
    </div>
  );
};
