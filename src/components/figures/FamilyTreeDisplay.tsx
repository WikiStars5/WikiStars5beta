
"use client";

import type { Figure, FamilyMember } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ImageOff, PlusCircle, Edit3, Save, X, Loader2, Users2, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select
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

const RELATIONSHIP_TYPES = [
  { value: "Esposo", label: "Esposo" },
  { value: "Esposa", label: "Esposa" },
  { value: "Novio", label: "Novio" },
  { value: "Novia", label: "Novia" },
];


export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  const { toast } = useToast();
  const router = useRouter();

  const [isEditingCentralNode, setIsEditingCentralNode] = useState(false);
  const [editableCentralPhotoUrl, setEditableCentralPhotoUrl] = useState(figure.photoUrl || '');
  const [isSavingCentralNode, setIsSavingCentralNode] = useState(false);

  const [partnerData, setPartnerData] = useState<FamilyMember | null>(null);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [editablePartnerName, setEditablePartnerName] = useState('');
  const [editablePartnerPhotoUrl, setEditablePartnerPhotoUrl] = useState('');
  const [editablePartnerRelationship, setEditablePartnerRelationship] = useState(RELATIONSHIP_TYPES[0].value); 
  const [isSavingPartner, setIsSavingPartner] = useState(false);


  const handleAddParents = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Padres/Madre aún no implementada." });
  };

  const handleAddPartner = () => {
    if (!partnerData) {
      const newPartner: FamilyMember = {
        id: `new-partner-${Date.now()}`,
        name: "", 
        relationship: RELATIONSHIP_TYPES[0].value, 
        photoUrl: "", 
        figureId: null,
      };
      setPartnerData(newPartner);
      setEditablePartnerName(newPartner.name);
      setEditablePartnerPhotoUrl(newPartner.photoUrl || '');
      setEditablePartnerRelationship(newPartner.relationship);
      setIsEditingPartner(true); 
    } else {
      
      setPartnerData(null);
      setIsEditingPartner(false);
    }
  };

  const handleAddChildren = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Hijos aún no implementada." });
  };

  const handleEditCentralNode = () => {
    setEditableCentralPhotoUrl(figure.photoUrl || '');
    setIsEditingCentralNode(true);
  };

  const handleCancelCentralNodeEdit = () => {
    setEditableCentralPhotoUrl(figure.photoUrl || ''); 
    setIsEditingCentralNode(false);
  };

  const handleSaveCentralNodeImage = async () => {
    if (editableCentralPhotoUrl.trim() && !isValidHttpUrl(editableCentralPhotoUrl)) {
        toast({ title: "URL Inválida", description: "La URL de la imagen para la figura principal no es válida o no pertenece a un dominio permitido. Debe ser un enlace HTTP/HTTPS.", variant: "destructive"});
        return;
    }
    setIsSavingCentralNode(true);
    try {
      await updateFigureInFirestore({ id: figure.id, photoUrl: editableCentralPhotoUrl.trim() || 'https://placehold.co/400x600.png' });
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

  const isValidHttpUrl = (string: string) => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  const handleEditPartner = () => {
    if (partnerData) {
      setEditablePartnerName(partnerData.name);
      setEditablePartnerPhotoUrl(partnerData.photoUrl || '');
      setEditablePartnerRelationship(partnerData.relationship);
      setIsEditingPartner(true);
    }
  };

  const handleCancelPartnerEdit = () => {
    if (partnerData && partnerData.id.startsWith('new-partner-')) {
        setPartnerData(null); 
    }
    setIsEditingPartner(false);
  };

  const handleSavePartner = async () => {
    if (!partnerData) return;
    if (!editablePartnerName.trim()) {
      toast({ title: "Error", description: "El nombre de la pareja no puede estar vacío.", variant: "destructive"});
      return;
    }
    if (editablePartnerPhotoUrl.trim() && !isValidHttpUrl(editablePartnerPhotoUrl)) {
        toast({ title: "URL Inválida", description: "La URL de la imagen para la pareja no es válida o no pertenece a un dominio permitido. Debe ser un enlace HTTP/HTTPS.", variant: "destructive"});
        return;
    }
    if (!editablePartnerRelationship.trim()) {
        toast({ title: "Error", description: "El tipo de relación no puede estar vacío.", variant: "destructive"});
        return;
    }

    setIsSavingPartner(true);
    const updatedPartnerData: FamilyMember = {
      ...partnerData,
      name: editablePartnerName.trim(),
      photoUrl: editablePartnerPhotoUrl.trim(), 
      relationship: editablePartnerRelationship.trim(),
    };
    
    // TODO: Update figure.familyMembers in Firestore with updatedPartnerData
    // This will require modifying the figure's document
    console.log("Guardando datos de pareja (simulado):", updatedPartnerData);
    setPartnerData(updatedPartnerData); 
    toast({ title: "Pareja Guardada (Simulado)", description: `Datos de ${editablePartnerName} actualizados localmente. La integración con Firestore está pendiente.` });
    setIsEditingPartner(false);
    // router.refresh(); // Uncomment when Firestore save is implemented
    setIsSavingPartner(false);
  };

  const partnerImageToDisplay = isEditingPartner 
    ? (editablePartnerPhotoUrl || "") 
    : (partnerData?.photoUrl || "");


  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-[500px] w-full">
      <div className="flex flex-wrap justify-center items-start gap-8 md:gap-16 relative w-full">
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 md:gap-16 relative">
          <div className="relative" style={{ margin: '40px' }}>
            <AddRelationButton onClick={handleAddParents} label="Añadir Padres" title="Añadir Padre o Madre" positionClass="-top-12 left-1/2 -translate-x-1/2 transform" icon={Users2} />
            <Card className="w-60 md:w-64 shadow-xl border-2 border-primary/30 relative overflow-visible bg-card">
              <CardHeader className="p-0">
                <div className="relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b border-primary/20">
                  {displayCentralImageUrl && isValidHttpUrl(displayCentralImageUrl) ? (
                    <Image src={displayCentralImageUrl} alt={`Imagen de ${figure.name}`} fill className="object-cover" sizes="(max-width: 768px) 240px, 256px" key={displayCentralImageUrl} data-ai-hint="figure portrait" />
                  ) : ( <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder person"><ImageOff className="w-16 h-16" /></div> )}
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-2 text-sm">
                <h3 className="text-md font-semibold text-center text-primary truncate" title={figure.name}>{figure.name}</h3>
                {isEditingCentralNode ? (
                  <div className="space-y-3">
                    <div><Label htmlFor={`imageUrl-${figure.id}`} className="text-xs text-muted-foreground block mb-1">Url de la imagen: <span className="italic">(visible al editar)</span></Label><Input id={`imageUrl-${figure.id}`} type="url" value={editableCentralPhotoUrl} onChange={(e) => setEditableCentralPhotoUrl(e.target.value)} className="text-xs h-8" placeholder="Dejar vacío para predeterminado" disabled={isSavingCentralNode} /></div>
                    <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleCancelCentralNodeEdit} disabled={isSavingCentralNode}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleSaveCentralNodeImage} disabled={isSavingCentralNode}>{isSavingCentralNode ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
                  </div>
                ) : ( <Button variant="outline" size="sm" className="w-full mt-1 py-1 h-auto text-xs border-primary/40 text-primary/70 hover:bg-primary/10 hover:text-primary" onClick={handleEditCentralNode}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button> )}
              </CardContent>
            </Card>
            <AddRelationButton onClick={handleAddPartner} label="Añadir Pareja" title="Añadir Pareja (ej. Esposo/a, Novio/a)" positionClass="top-1/2 -right-12 -translate-y-1/2 transform" icon={Heart} />
            <AddRelationButton onClick={handleAddChildren} label="Añadir Hijos" title="Añadir Hijos" positionClass="-bottom-12 left-1/2 -translate-x-1/2 transform" icon={PlusCircle} />
          </div>

          {partnerData && (
            <div className="relative" style={{ margin: '40px' }}>
              <Card className="w-60 md:w-64 shadow-xl border-2 border-pink-500/30 relative overflow-visible bg-card">
                <CardHeader className="p-0">
                  <div className="relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b border-pink-500/20">
                    {partnerImageToDisplay && isValidHttpUrl(partnerImageToDisplay) ? (
                       <Image src={partnerImageToDisplay} alt={`Imagen de ${isEditingPartner ? editablePartnerName : partnerData.name}`} fill className="object-cover" sizes="(max-width: 768px) 240px, 256px" key={partnerImageToDisplay} data-ai-hint="partner portrait" />
                    ) : ( <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder person"><ImageOff className="w-16 h-16" /></div> )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-sm">
                  {isEditingPartner ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="partnerRelationship" className="text-xs text-muted-foreground block mb-1">Tipo de Relación:</Label>
                        <Select value={editablePartnerRelationship} onValueChange={setEditablePartnerRelationship} disabled={isSavingPartner}>
                          <SelectTrigger id="partnerRelationship" className="text-xs h-8">
                            <SelectValue placeholder="Selecciona relación" />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value} className="text-xs">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label htmlFor="partnerName" className="text-xs text-muted-foreground block mb-1">Nombre Pareja:</Label><Input id="partnerName" type="text" value={editablePartnerName} onChange={(e) => setEditablePartnerName(e.target.value)} className="text-xs h-8" placeholder="Nombre de la Pareja" disabled={isSavingPartner} /></div>
                      <div><Label htmlFor="partnerImageUrl" className="text-xs text-muted-foreground block mb-1">Url de la imagen:</Label><Input id="partnerImageUrl" type="url" value={editablePartnerPhotoUrl} onChange={(e) => setEditablePartnerPhotoUrl(e.target.value)} className="text-xs h-8" placeholder="Dejar vacío para predeterminado" disabled={isSavingPartner} /></div>
                      <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleCancelPartnerEdit} disabled={isSavingPartner}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleSavePartner} disabled={isSavingPartner}>{isSavingPartner ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-md font-semibold text-center text-pink-500 truncate" title={partnerData.name || "Nombre no definido"}>{partnerData.name || "Nombre no definido"}</h3>
                      <p className="text-xs text-muted-foreground text-center">{partnerData.relationship}</p>
                      <Button variant="outline" size="sm" className="w-full mt-1 py-1 h-auto text-xs border-pink-500/40 text-pink-500/70 hover:bg-pink-500/10 hover:text-pink-500" onClick={handleEditPartner}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CardDescription className="text-center mt-10 text-xs px-4 max-w-md">
        Esta es la vista inicial para construir el árbol genealógico. Haz clic en los botones de acción (corazón, etc.) para añadir familiares.
        Haz clic en "EDITAR" en una tarjeta para cambiar su información.
      </CardDescription>
    </div>
  );
};

