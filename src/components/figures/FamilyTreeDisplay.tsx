
"use client";

import type { Figure, FamilyMember } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ImageOff, PlusCircle, Edit3, Save, X, Loader2, Users2, Heart, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateFigureInFirestore } from "@/lib/placeholder-data"; 

interface FamilyTreeDisplayProps {
  figure: Figure;
  allFigures: Figure[]; 
}

const AddRelationButton = ({ onClick, label, positionClass, title, icon: IconComponent = PlusCircle, isVisible = true }: { onClick: () => void; label: string, positionClass: string, title: string, icon?: React.ElementType, isVisible?: boolean }) => {
  if (!isVisible) return null;
  return (
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
};

const PARTNER_RELATIONSHIP_TYPES = [
  { value: "Esposo", label: "Esposo" },
  { value: "Esposa", label: "Esposa" },
  { value: "Novio", label: "Novio" },
  { value: "Novia", label: "Novia" },
];

const CHILD_RELATIONSHIP_TYPES = [
  { value: "Hijo", label: "Hijo" },
  { value: "Hija", label: "Hija" },
  { value: "Hijastro", label: "Hijastro" },
  { value: "Hijastra", label: "Hijastra" },
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
  const [editablePartnerRelationship, setEditablePartnerRelationship] = useState(PARTNER_RELATIONSHIP_TYPES[0].value); 
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  
  // State for managing the active child being added/edited
  const [activeChildData, setActiveChildData] = useState<FamilyMember | null>(null);
  const [isEditingActiveChild, setIsEditingActiveChild] = useState(false);
  const [editableChildName, setEditableChildName] = useState('');
  const [editableChildPhotoUrl, setEditableChildPhotoUrl] = useState('');
  const [editableChildRelationship, setEditableChildRelationship] = useState(CHILD_RELATIONSHIP_TYPES[0].value);
  const [isSavingActiveChild, setIsSavingActiveChild] = useState(false);

  // This effect loads the first partner and first child for demonstration purposes.
  // A more robust solution would handle displaying multiple family members.
  useEffect(() => {
    const firstPartner = figure.familyMembers?.find(fm => 
      PARTNER_RELATIONSHIP_TYPES.some(rt => rt.value.toLowerCase() === fm.relationship.toLowerCase())
    );
    if (firstPartner) {
      setPartnerData(firstPartner);
    } else {
      setPartnerData(null); // Ensure partnerData is null if no partner found
    }

    // For simplicity, this example will focus on adding/editing one child at a time via UI.
    // To display existing children, you'd filter figure.familyMembers
    // For now, activeChildData is for the *interactive* adding/editing slot.
    // Example: load the first child found if any
    const firstChild = figure.familyMembers?.find(fm =>
        CHILD_RELATIONSHIP_TYPES.some(rt => rt.value.toLowerCase() === fm.relationship.toLowerCase())
    );
    if (firstChild) {
        // setActiveChildData(firstChild); // Uncomment to load first existing child on mount
        // setIsEditingActiveChild(false);
    }


  }, [figure.familyMembers]);


  const handleAddParents = () => {
    toast({ title: "Próximamente", description: "Funcionalidad para añadir Padres/Madre aún no implementada." });
  };

  const handleAddPartner = () => {
    if (partnerData) { // If a partner is already shown, toggle to edit or clear
        if(isEditingPartner) { // if already editing, maybe do nothing or specific action
            return;
        }
        setEditablePartnerName(partnerData.name);
        setEditablePartnerPhotoUrl(partnerData.photoUrl || '');
        setEditablePartnerRelationship(partnerData.relationship);
        setIsEditingPartner(true);
    } else {
        const newPartner: FamilyMember = {
          id: `new-partner-${Date.now()}`, 
          name: "", 
          relationship: PARTNER_RELATIONSHIP_TYPES[0].value, 
          photoUrl: "", 
          figureId: null,
        };
        setPartnerData(newPartner);
        setEditablePartnerName(newPartner.name);
        setEditablePartnerPhotoUrl(newPartner.photoUrl || '');
        setEditablePartnerRelationship(newPartner.relationship);
        setIsEditingPartner(true); 
    }
  };
  
  const handleAddChildren = () => {
     if (activeChildData) { // If a child form is already active, toggle to edit
        if(isEditingActiveChild) return; // Already editing, do nothing
        setEditableChildName(activeChildData.name);
        setEditableChildPhotoUrl(activeChildData.photoUrl || '');
        setEditableChildRelationship(activeChildData.relationship);
        setIsEditingActiveChild(true);
    } else {
        const newChild: FamilyMember = {
          id: `new-child-${Date.now()}`,
          name: "",
          relationship: CHILD_RELATIONSHIP_TYPES[0].value, // Default to "Hijo"
          photoUrl: "",
          figureId: null,
        };
        setActiveChildData(newChild);
        setEditableChildName(newChild.name);
        setEditableChildPhotoUrl(newChild.photoUrl || '');
        setEditableChildRelationship(newChild.relationship);
        setIsEditingActiveChild(true);
    }
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
        toast({ title: "URL Inválida", description: "La URL de la imagen para la figura principal no es válida.", variant: "destructive"});
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
    if (!string) return true; 
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
    if (!partnerData || !figure) return;
    if (!editablePartnerName.trim()) {
      toast({ title: "Error", description: "El nombre de la pareja no puede estar vacío.", variant: "destructive"});
      return;
    }
    if (editablePartnerPhotoUrl.trim() && !isValidHttpUrl(editablePartnerPhotoUrl)) {
        toast({ title: "URL Inválida", description: "La URL de la imagen para la pareja no es válida.", variant: "destructive"});
        return;
    }
    if (!editablePartnerRelationship.trim()) {
        toast({ title: "Error", description: "El tipo de relación no puede estar vacío.", variant: "destructive"});
        return;
    }

    setIsSavingPartner(true);
    
    const finalPartnerData: FamilyMember = {
      ...partnerData,
      id: partnerData.id.startsWith('new-partner-') ? `fm-${Date.now()}` : partnerData.id,
      name: editablePartnerName.trim(),
      photoUrl: editablePartnerPhotoUrl.trim() || null,
      relationship: editablePartnerRelationship.trim(),
    };

    const currentFamilyMembers = figure.familyMembers || [];
    let updatedFamilyMembers;
    const existingMemberIndex = currentFamilyMembers.findIndex(fm => fm.id === finalPartnerData.id);

    if (existingMemberIndex > -1) {
      updatedFamilyMembers = [...currentFamilyMembers];
      updatedFamilyMembers[existingMemberIndex] = finalPartnerData;
    } else {
      updatedFamilyMembers = [...currentFamilyMembers, finalPartnerData];
    }
    
    try {
      await updateFigureInFirestore({
        id: figure.id,
        familyMembers: updatedFamilyMembers,
      });
      
      setPartnerData(finalPartnerData); 
      toast({ title: "Pareja Guardada", description: `Datos de ${finalPartnerData.name} actualizados.` });
      setIsEditingPartner(false);
      router.refresh(); 
    } catch (error: any) {
      toast({ title: "Error al Guardar Pareja", description: `No se pudo guardar: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSavingPartner(false);
    }
  };

  const partnerImageToDisplay = isEditingPartner 
    ? (editablePartnerPhotoUrl || "") 
    : (partnerData?.photoUrl || "");

  const showAddPartnerButton = isEditingCentralNode && !partnerData;


  // --- Child Logic ---
  const handleEditActiveChild = () => {
    if (activeChildData) {
      setEditableChildName(activeChildData.name);
      setEditableChildPhotoUrl(activeChildData.photoUrl || '');
      setEditableChildRelationship(activeChildData.relationship);
      setIsEditingActiveChild(true);
    }
  };

  const handleCancelActiveChildEdit = () => {
    if (activeChildData && activeChildData.id.startsWith('new-child-')) {
        setActiveChildData(null);
    }
    setIsEditingActiveChild(false);
  };

  const handleSaveActiveChild = async () => {
    if (!activeChildData || !figure) return;
    if (!editableChildName.trim()) {
      toast({ title: "Error", description: "El nombre del hijo/a no puede estar vacío.", variant: "destructive"});
      return;
    }
    if (editableChildPhotoUrl.trim() && !isValidHttpUrl(editableChildPhotoUrl)) {
        toast({ title: "URL Inválida", description: "La URL de la imagen para el hijo/a no es válida.", variant: "destructive"});
        return;
    }
    if (!editableChildRelationship.trim()) {
        toast({ title: "Error", description: "El tipo de relación del hijo/a no puede estar vacío.", variant: "destructive"});
        return;
    }

    setIsSavingActiveChild(true);
    
    const finalChildData: FamilyMember = {
      ...activeChildData,
      id: activeChildData.id.startsWith('new-child-') ? `fm-child-${Date.now()}` : activeChildData.id,
      name: editableChildName.trim(),
      photoUrl: editableChildPhotoUrl.trim() || null,
      relationship: editableChildRelationship.trim(),
    };

    const currentFamilyMembers = figure.familyMembers || [];
    let updatedFamilyMembers;
    const existingMemberIndex = currentFamilyMembers.findIndex(fm => fm.id === finalChildData.id);

    if (existingMemberIndex > -1) {
      updatedFamilyMembers = [...currentFamilyMembers];
      updatedFamilyMembers[existingMemberIndex] = finalChildData;
    } else {
      updatedFamilyMembers = [...currentFamilyMembers, finalChildData];
    }
    
    try {
      await updateFigureInFirestore({
        id: figure.id,
        familyMembers: updatedFamilyMembers,
      });
      
      setActiveChildData(finalChildData); 
      toast({ title: "Hijo/a Guardado", description: `Datos de ${finalChildData.name} actualizados.` });
      setIsEditingActiveChild(false);
      // Potentially clear activeChildData if we want the slot to be "empty" for a new add
      // setActiveChildData(null); // Uncomment this if "Add Child" should always present a fresh form
      router.refresh(); 
    } catch (error: any) {
      toast({ title: "Error al Guardar Hijo/a", description: `No se pudo guardar: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSavingActiveChild(false);
    }
  };
  
  const activeChildImageToDisplay = isEditingActiveChild
    ? (editableChildPhotoUrl || "")
    : (activeChildData?.photoUrl || "");

  const showAddChildButton = isEditingCentralNode && !activeChildData; // Only show if editing main and no active child form


  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-[500px] w-full">
      <div className="flex flex-col items-center space-y-8 md:space-y-12 w-full">
        
        {/* Parents Row (Placeholder for now) */}
        {/* <div className="flex justify-center gap-8 md:gap-16 relative w-full"> ... Parents ... </div> */}

        {/* Central Figure and Partner Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 md:gap-16 relative w-full">
          <div className="relative" style={{ margin: '40px 0' }}>
            <AddRelationButton onClick={handleAddParents} label="Añadir Padres" title="Añadir Padre o Madre" positionClass="-top-12 left-1/2 -translate-x-1/2 transform" icon={Users2} isVisible={isEditingCentralNode} />
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
                    <div><Label htmlFor={`imageUrl-${figure.id}`} className="text-xs text-muted-foreground block mb-1">Url de la imagen: <span className="italic">(visible al editar)</span></Label><Input id={`imageUrl-${figure.id}`} type="url" value={editableCentralPhotoUrl} onChange={(e) => setEditableCentralPhotoUrl(e.target.value)} className="text-xs h-8" placeholder="https://dominio.com/imagen.jpg" disabled={isSavingCentralNode} /></div>
                    <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleCancelCentralNodeEdit} disabled={isSavingCentralNode}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleSaveCentralNodeImage} disabled={isSavingCentralNode}>{isSavingCentralNode ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
                  </div>
                ) : ( <Button variant="outline" size="sm" className="w-full mt-1 py-1 h-auto text-xs border-primary/40 text-primary/70 hover:bg-primary/10 hover:text-primary" onClick={handleEditCentralNode}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button> )}
              </CardContent>
            </Card>
            <AddRelationButton onClick={handleAddPartner} label="Añadir Pareja" title="Añadir Pareja" positionClass="top-1/2 -right-12 -translate-y-1/2 transform sm:top-1/2 sm:right-auto sm:-bottom-12 sm:left-1/2 sm:-translate-x-1/2 sm:transform sm:translate-y-0 md:top-1/2 md:-right-12 md:left-auto md:-translate-y-1/2 md:translate-x-0" icon={Heart} isVisible={isEditingCentralNode && !partnerData} />
            <AddRelationButton onClick={handleAddChildren} label="Añadir Hijos" title="Añadir Hijos" positionClass="-bottom-12 left-1/2 -translate-x-1/2 transform" icon={UserPlus} isVisible={isEditingCentralNode && !activeChildData}/>
          </div>

          {partnerData && (
            <>
              {!isEditingPartner && <div className="hidden sm:block absolute top-1/2 left-1/2 h-0.5 w-8 md:w-12 bg-foreground/30" style={{ transform: 'translate(calc(var(--card-width, 256px)/2 - var(--gap-width, 64px)/2 + 1rem), -50%)', zIndex: -1 }} aria-hidden="true"></div>}
              <div className="relative" style={{ margin: '40px 0' }}>
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
                              {PARTNER_RELATIONSHIP_TYPES.map(type => ( <SelectItem key={type.value} value={type.value} className="text-xs">{type.label}</SelectItem> ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label htmlFor="partnerName" className="text-xs text-muted-foreground block mb-1">Nombre Pareja:</Label><Input id="partnerName" type="text" value={editablePartnerName} onChange={(e) => setEditablePartnerName(e.target.value)} className="text-xs h-8" placeholder="Nombre" disabled={isSavingPartner} /></div>
                        <div><Label htmlFor="partnerImageUrl" className="text-xs text-muted-foreground block mb-1">Url de la imagen:</Label><Input id="partnerImageUrl" type="url" value={editablePartnerPhotoUrl} onChange={(e) => setEditablePartnerPhotoUrl(e.target.value)} className="text-xs h-8" placeholder="https://..." disabled={isSavingPartner} /></div>
                        <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleCancelPartnerEdit} disabled={isSavingPartner}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleSavePartner} disabled={isSavingPartner}>{isSavingPartner ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-md font-semibold text-center text-pink-500 truncate" title={partnerData.name || "Nombre Pareja"}>{partnerData.name || "Nombre Pareja"}</h3>
                        <p className="text-xs text-muted-foreground text-center">{partnerData.relationship}</p>
                        <Button variant="outline" size="sm" className="w-full mt-1 py-1 h-auto text-xs border-pink-500/40 text-pink-500/70 hover:bg-pink-500/10 hover:text-pink-500" onClick={handleEditPartner}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
        
        {/* Child Section (Interactive Slot) */}
        {activeChildData && (
            <>
            {!isEditingActiveChild && <div className="w-0.5 h-8 md:h-12 bg-foreground/30 mx-auto" aria-hidden="true"></div>}
            <div className="relative" style={{ margin: '20px 0' }}> {/* Reduced margin for child */}
                <Card className="w-60 md:w-64 shadow-xl border-2 border-green-500/30 relative overflow-visible bg-card">
                <CardHeader className="p-0">
                    <div className="relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b border-green-500/20">
                    {activeChildImageToDisplay && isValidHttpUrl(activeChildImageToDisplay) ? (
                        <Image src={activeChildImageToDisplay} alt={`Imagen de ${isEditingActiveChild ? editableChildName : activeChildData.name}`} fill className="object-cover" sizes="(max-width: 768px) 240px, 256px" key={activeChildImageToDisplay} data-ai-hint="child portrait" />
                    ) : ( <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder person"><ImageOff className="w-16 h-16" /></div> )}
                    </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2 text-sm">
                    {isEditingActiveChild ? (
                    <div className="space-y-3">
                        <div>
                        <Label htmlFor="childRelationship" className="text-xs text-muted-foreground block mb-1">Tipo de Relación:</Label>
                        <Select value={editableChildRelationship} onValueChange={setEditableChildRelationship} disabled={isSavingActiveChild}>
                            <SelectTrigger id="childRelationship" className="text-xs h-8">
                            <SelectValue placeholder="Selecciona relación" />
                            </SelectTrigger>
                            <SelectContent>
                            {CHILD_RELATIONSHIP_TYPES.map(type => ( <SelectItem key={type.value} value={type.value} className="text-xs">{type.label}</SelectItem> ))}
                            </SelectContent>
                        </Select>
                        </div>
                        <div><Label htmlFor="childName" className="text-xs text-muted-foreground block mb-1">Nombre del Hijo/a:</Label><Input id="childName" type="text" value={editableChildName} onChange={(e) => setEditableChildName(e.target.value)} className="text-xs h-8" placeholder="Nombre" disabled={isSavingActiveChild} /></div>
                        <div><Label htmlFor="childImageUrl" className="text-xs text-muted-foreground block mb-1">Url de la imagen: <span className="italic">(visible al editar)</span></Label><Input id="childImageUrl" type="url" value={editableChildPhotoUrl} onChange={(e) => setEditableChildPhotoUrl(e.target.value)} className="text-xs h-8" placeholder="https://..." disabled={isSavingActiveChild} /></div>
                        <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleCancelActiveChildEdit} disabled={isSavingActiveChild}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={handleSaveActiveChild} disabled={isSavingActiveChild}>{isSavingActiveChild ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
                    </div>
                    ) : (
                    <>
                        <h3 className="text-md font-semibold text-center text-green-500 truncate" title={activeChildData.name || "Nombre Hijo/a"}>{activeChildData.name || "Nombre Hijo/a"}</h3>
                        <p className="text-xs text-muted-foreground text-center">{activeChildData.relationship}</p>
                        <Button variant="outline" size="sm" className="w-full mt-1 py-1 h-auto text-xs border-green-500/40 text-green-500/70 hover:bg-green-500/10 hover:text-green-500" onClick={handleEditActiveChild}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button>
                    </>
                    )}
                </CardContent>
                </Card>
            </div>
            </>
        )}
        {/* Placeholder for multiple children display */}
        {/* figure.familyMembers?.filter(fm => CHILD_RELATIONSHIP_TYPES.some(rt => rt.value === fm.relationship)).map(child => ( ... render child card ... )) */}


      </div>

      <CardDescription className="text-center mt-10 text-xs px-4 max-w-md" style={{ '--card-width': '256px', '--gap-width': '64px'} as React.CSSProperties}>
        Haz clic en "EDITAR" en la tarjeta principal para mostrar opciones de añadir familiares.
        La información de familiares se guarda en Firestore.
      </CardDescription>
    </div>
  );
};

    