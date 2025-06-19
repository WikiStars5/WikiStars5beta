
"use client";

import type { Figure, FamilyMember } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ImageOff, PlusCircle, Edit3, Save, X, Loader2, Users2, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateFigureInFirestore } from "@/lib/placeholder-data"; 

interface FamilyTreeDisplayProps {
  figure: Figure;
  allFigures: Figure[]; 
}

const AddRelationButton = ({ onClick, label, positionClass, title, icon: IconComponent = PlusCircle }: { onClick: () => void; label: string, positionClass: string, title: string, icon?: React.ElementType }) => (
  <Button
    variant="outline"
    size="icon"
    className={`absolute ${positionClass} rounded-full w-10 h-10 bg-card hover:bg-primary/10 border-primary text-primary z-10 shadow-lg flex items-center justify-center`}
    onClick={onClick}
    aria-label={label}
    title={title}
  >
    <IconComponent className="h-6 w-6" />
  </Button>
);


export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  const { toast } = useToast();
  const router = useRouter();

  // State for the central figure node
  const [isEditingCentralNode, setIsEditingCentralNode] = useState(false);
  const [editableCentralPhotoUrl, setEditableCentralPhotoUrl] = useState(figure.photoUrl || '');
  const [isSavingCentralNode, setIsSavingCentralNode] = useState(false);

  // State for the partner node
  const [partnerData, setPartnerData] = useState<FamilyMember | null>(null);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [editablePartnerName, setEditablePartnerName] = useState('');
  const [editablePartnerPhotoUrl, setEditablePartnerPhotoUrl] = useState('');
  const [isSavingPartner, setIsSavingPartner] = useState(false);


  const handleAddParents = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Padres/Madre aún no implementada." });
  };

  const handleAddPartner = () => {
    if (!partnerData) {
      const newPartner: FamilyMember = {
        id: `new-partner-${Date.now()}`, // temp id
        name: "Nombre Pareja",
        relationship: "Pareja",
        photoUrl: "https://placehold.co/200x267.png", // Adjusted aspect ratio
        figureId: null,
      };
      setPartnerData(newPartner);
      setEditablePartnerName(newPartner.name);
      setEditablePartnerPhotoUrl(newPartner.photoUrl || '');
      setIsEditingPartner(false); // Start in view mode
    } else {
      // If partner card is already shown, clicking again will hide it for now
      setPartnerData(null);
      setIsEditingPartner(false);
    }
  };

  const handleAddChildren = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Hijos aún no implementada." });
  };

  // --- Central Node Logic ---
  const handleEditCentralNode = () => {
    setEditableCentralPhotoUrl(figure.photoUrl || '');
    setIsEditingCentralNode(true);
  };

  const handleCancelCentralNodeEdit = () => {
    setEditableCentralPhotoUrl(figure.photoUrl || ''); 
    setIsEditingCentralNode(false);
  };

  const handleSaveCentralNodeImage = async () => {
    if (!editableCentralPhotoUrl.trim()) {
        toast({ title: "Error", description: "La URL de la imagen no puede estar vacía.", variant: "destructive"});
        return;
    }
    try { new URL(editableCentralPhotoUrl); } catch (_) {
        toast({ title: "Error", description: "La URL de la imagen no es válida.", variant: "destructive"});
        return;
    }
    setIsSavingCentralNode(true);
    try {
      await updateFigureInFirestore({ id: figure.id, photoUrl: editableCentralPhotoUrl });
      toast({ title: "Éxito", description: "La imagen principal de la figura ha sido actualizada." });
      setIsEditingCentralNode(false);
      router.refresh(); 
    } catch (error: any) {
      toast({ title: "Error al Guardar", description: `No se pudo actualizar la imagen: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSavingCentralNode(false);
    }
  };
  const displayCentralImageUrl = isEditingCentralNode ? editableCentralPhotoUrl : (figure.photoUrl || '');

  // --- Partner Node Logic ---
  const handleEditPartner = () => {
    if (partnerData) {
      setEditablePartnerName(partnerData.name);
      setEditablePartnerPhotoUrl(partnerData.photoUrl || '');
      setIsEditingPartner(true);
    }
  };

  const handleCancelPartnerEdit = () => {
    // Revert changes or remove if it was a "new" unsaved partner
    if (partnerData && partnerData.id.startsWith('new-partner-')) {
        setPartnerData(null); // Remove the placeholder card
    }
    setIsEditingPartner(false);
  };

  const handleSavePartner = async () => {
    if (!partnerData) return;
    if (!editablePartnerName.trim()) {
      toast({ title: "Error", description: "El nombre de la pareja no puede estar vacío.", variant: "destructive"});
      return;
    }
    // Basic URL validation for partner photo
    if (editablePartnerPhotoUrl.trim()) {
        try { new URL(editablePartnerPhotoUrl); } catch (_) {
            toast({ title: "Error", description: "La URL de la imagen para la pareja no es válida.", variant: "destructive"});
            return;
        }
    }

    setIsSavingPartner(true);
    const updatedPartnerData: FamilyMember = {
      ...partnerData,
      name: editablePartnerName.trim(),
      photoUrl: editablePartnerPhotoUrl.trim() || "https://placehold.co/200x267.png",
    };
    
    // TODO: Actualizar figure.familyMembers en Firestore con updatedPartnerData
    // Esto implicará:
    // 1. Obtener los familyMembers actuales de la figura.
    // 2. Añadir o actualizar el `updatedPartnerData` en ese array.
    // 3. Llamar a updateFigureInFirestore con el array `familyMembers` modificado.
    
    console.log("Guardando datos de pareja (simulado):", updatedPartnerData);
    setPartnerData(updatedPartnerData); // Update local state
    toast({ title: "Pareja Guardada (Simulado)", description: `Datos de ${editablePartnerName} actualizados localmente.` });
    setIsEditingPartner(false);
    // router.refresh(); // Descomentar cuando se guarde en Firestore
    setIsSavingPartner(false);
  };


  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-[500px] w-full">
      <div className="flex flex-wrap justify-center items-start gap-8 md:gap-16 relative w-full">
        {/* Placeholder for Grandparents/Parents Row if needed later */}
        {/* <div className="w-full flex justify-center gap-8 mb-8"></div> */}

        {/* Main Figure and Partner Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 md:gap-16 relative">
          {/* Central Figure Card */}
          <div className="relative" style={{ margin: '40px' }}>
            <AddRelationButton
              onClick={handleAddParents}
              label="Añadir Padres"
              title="Añadir Padre o Madre"
              positionClass="-top-12 left-1/2 -translate-x-1/2 transform"
              icon={Users2}
            />
            <Card className="w-60 md:w-64 shadow-xl border-2 border-primary/30 relative overflow-visible bg-card">
              <CardHeader className="p-0">
                <div className="relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b border-primary/20">
                  {displayCentralImageUrl ? (
                    <Image src={displayCentralImageUrl} alt={`Imagen de ${figure.name}`} fill className="object-cover" sizes="(max-width: 768px) 240px, 256px" key={displayCentralImageUrl} data-ai-hint="figure portrait" />
                  ) : ( <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder person"><ImageOff className="w-16 h-16" /></div> )}
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2 text-sm">
                <h3 className="text-md font-semibold text-center text-primary truncate" title={figure.name}>{figure.name}</h3>
                {isEditingCentralNode ? (
                  <div className="space-y-3">
                    <div><Label htmlFor={`imageUrl-${figure.id}`} className="text-xs text-muted-foreground block mb-1">Url de la imagen: <span className="italic">(visible al editar)</span></Label><Input id={`imageUrl-${figure.id}`} type="url" value={editableCentralPhotoUrl} onChange={(e) => setEditableCentralPhotoUrl(e.target.value)} className="text-xs h-8" placeholder="Link de dominio permitido" disabled={isSavingCentralNode} /></div>
                    <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleCancelCentralNodeEdit} disabled={isSavingCentralNode}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleSaveCentralNodeImage} disabled={isSavingCentralNode}>{isSavingCentralNode ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
                  </div>
                ) : ( <Button variant="outline" size="sm" className="w-full mt-1 py-1 h-auto text-xs border-primary/40 text-primary/70 hover:bg-primary/10 hover:text-primary" onClick={handleEditCentralNode}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button> )}
              </CardContent>
            </Card>
            <AddRelationButton onClick={handleAddPartner} label="Añadir Pareja" title="Añadir Pareja (ej. Esposo/a, Novio/a)" positionClass="top-1/2 -right-12 -translate-y-1/2 transform" icon={Heart} />
            <AddRelationButton onClick={handleAddChildren} label="Añadir Hijos" title="Añadir Hijos" positionClass="-bottom-12 left-1/2 -translate-x-1/2 transform" icon={PlusCircle} />
          </div>

          {/* Partner Card (Conditionally Rendered) */}
          {partnerData && (
            <div className="relative" style={{ margin: '40px' }}>
              {/* Optional: Button to remove partner or add another one */}
              {/* <AddRelationButton onClick={() => setPartnerData(null)} label="Quitar Pareja" title="Quitar Pareja" positionClass="top-1/2 -right-12 -translate-y-1/2 transform" icon={XCircle} /> */}
              <Card className="w-60 md:w-64 shadow-xl border-2 border-pink-500/30 relative overflow-visible bg-card">
                <CardHeader className="p-0">
                  <div className="relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b border-pink-500/20">
                    {(isEditingPartner ? editablePartnerPhotoUrl : partnerData.photoUrl) ? (
                      <Image src={(isEditingPartner ? editablePartnerPhotoUrl : partnerData.photoUrl)!} alt={`Imagen de ${isEditingPartner ? editablePartnerName : partnerData.name}`} fill className="object-cover" sizes="(max-width: 768px) 240px, 256px" key={(isEditingPartner ? editablePartnerPhotoUrl : partnerData.photoUrl)} data-ai-hint="partner portrait" />
                    ) : ( <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder person"><ImageOff className="w-16 h-16" /></div> )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-sm">
                  {isEditingPartner ? (
                    <div className="space-y-3">
                      <div><Label htmlFor="partnerName" className="text-xs text-muted-foreground block mb-1">Nombre Pareja:</Label><Input id="partnerName" type="text" value={editablePartnerName} onChange={(e) => setEditablePartnerName(e.target.value)} className="text-xs h-8" placeholder="Nombre de la Pareja" disabled={isSavingPartner} /></div>
                      <div><Label htmlFor="partnerImageUrl" className="text-xs text-muted-foreground block mb-1">Url de la imagen:</Label><Input id="partnerImageUrl" type="url" value={editablePartnerPhotoUrl} onChange={(e) => setEditablePartnerPhotoUrl(e.target.value)} className="text-xs h-8" placeholder="Link de imagen" disabled={isSavingPartner} /></div>
                      <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleCancelPartnerEdit} disabled={isSavingPartner}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleSavePartner} disabled={isSavingPartner}>{isSavingPartner ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-md font-semibold text-center text-pink-500 truncate" title={partnerData.name}>{partnerData.name}</h3>
                      <p className="text-xs text-muted-foreground text-center">{partnerData.relationship}</p>
                      <Button variant="outline" size="sm" className="w-full mt-1 py-1 h-auto text-xs border-pink-500/40 text-pink-500/70 hover:bg-pink-500/10 hover:text-pink-500" onClick={handleEditPartner}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        {/* Placeholder for Children Row if needed later */}
        {/* <div className="w-full flex justify-center gap-8 mt-8"></div> */}
      </div>

      <CardDescription className="text-center mt-10 text-xs px-4 max-w-md">
        Esta es la vista inicial para construir el árbol genealógico. Haz clic en los botones (+) para añadir familiares.
        Haz clic en "EDITAR" en una tarjeta para cambiar su información.
      </CardDescription>
    </div>
  );
};
