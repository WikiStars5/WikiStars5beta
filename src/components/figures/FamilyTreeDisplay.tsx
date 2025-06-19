
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

export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  const { toast } = useToast();
  const router = useRouter();

  const [isEditingCentralNode, setIsEditingCentralNode] = useState(false);
  const [editableCentralPhotoUrl, setEditableCentralPhotoUrl] = useState(figure.photoUrl || '');
  const [isSavingCentralNode, setIsSavingCentralNode] = useState(false);

  // Partner States
  const [partnerData, setPartnerData] = useState<FamilyMember | null>(null);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [editablePartnerName, setEditablePartnerName] = useState('');
  const [editablePartnerPhotoUrl, setEditablePartnerPhotoUrl] = useState('');
  const [editablePartnerRelationship, setEditablePartnerRelationship] = useState(PARTNER_RELATIONSHIP_TYPES[0].value); 
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  
  // Child States
  const [activeChildData, setActiveChildData] = useState<FamilyMember | null>(null);
  const [isEditingActiveChild, setIsEditingActiveChild] = useState(false);
  const [editableChildName, setEditableChildName] = useState('');
  const [editableChildPhotoUrl, setEditableChildPhotoUrl] = useState('');
  const [editableChildRelationship, setEditableChildRelationship] = useState("Hijo/a"); // Default, not user-selectable
  const [isSavingActiveChild, setIsSavingActiveChild] = useState(false);

  // Parent States
  const [fatherData, setFatherData] = useState<FamilyMember | null>(null);
  const [isEditingFather, setIsEditingFather] = useState(false);
  const [editableFatherName, setEditableFatherName] = useState('');
  const [editableFatherPhotoUrl, setEditableFatherPhotoUrl] = useState('');
  const [isSavingFather, setIsSavingFather] = useState(false);

  const [motherData, setMotherData] = useState<FamilyMember | null>(null);
  const [isEditingMother, setIsEditingMother] = useState(false);
  const [editableMotherName, setEditableMotherName] = useState('');
  const [editableMotherPhotoUrl, setEditableMotherPhotoUrl] = useState('');
  const [isSavingMother, setIsSavingMother] = useState(false);


  useEffect(() => {
    const firstPartner = figure.familyMembers?.find(fm => 
      PARTNER_RELATIONSHIP_TYPES.some(rt => rt.value.toLowerCase() === fm.relationship.toLowerCase())
    );
    setPartnerData(firstPartner || null);

    const firstFather = figure.familyMembers?.find(fm => fm.relationship.toLowerCase() === "padre");
    setFatherData(firstFather || null);
    
    const firstMother = figure.familyMembers?.find(fm => fm.relationship.toLowerCase() === "madre");
    setMotherData(firstMother || null);

    // For active child, we usually handle one slot for "add new" or "edit first".
    // If you want to display all children from figure.familyMembers, that logic is separate.
    const firstChild = figure.familyMembers?.find(fm =>
      fm.relationship.toLowerCase() === "hijo/a" || 
      fm.relationship.toLowerCase() === "hijo" || 
      fm.relationship.toLowerCase() === "hija"
    );
    setActiveChildData(firstChild || null);
    setIsEditingActiveChild(false); 
    setIsEditingPartner(false);
    setIsEditingFather(false);
    setIsEditingMother(false);

  }, [figure.familyMembers]);


  const handleAddParents = () => {
    if (!fatherData) {
        const newFather: FamilyMember = { id: `new-father-${Date.now()}`, name: "", relationship: "Padre", photoUrl: "", figureId: null };
        setFatherData(newFather);
        setEditableFatherName("");
        setEditableFatherPhotoUrl("");
        setIsEditingFather(true);
    } else if (!isEditingFather) {
        setEditableFatherName(fatherData.name);
        setEditableFatherPhotoUrl(fatherData.photoUrl || "");
        setIsEditingFather(true);
    }

    if (!motherData) {
        const newMother: FamilyMember = { id: `new-mother-${Date.now()}`, name: "", relationship: "Madre", photoUrl: "", figureId: null };
        setMotherData(newMother);
        setEditableMotherName("");
        setEditableMotherPhotoUrl("");
        setIsEditingMother(true);
    } else if (!isEditingMother) {
        setEditableMotherName(motherData.name);
        setEditableMotherPhotoUrl(motherData.photoUrl || "");
        setIsEditingMother(true);
    }
  };

  const handleAddPartner = () => {
    if (partnerData && isEditingPartner) return;

    if (partnerData && !isEditingPartner) {
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
        setEditablePartnerPhotoUrl(""); 
        setEditablePartnerRelationship(newPartner.relationship);
        setIsEditingPartner(true); 
    }
  };
  
  const handleAddChildren = () => {
    const newChild: FamilyMember = {
      id: `new-child-${Date.now()}`,
      name: "",
      relationship: "Hijo/a", 
      photoUrl: "",
      figureId: null,
    };
    setActiveChildData(newChild);
    setEditableChildName(newChild.name);
    setEditableChildPhotoUrl(""); 
    setEditableChildRelationship("Hijo/a"); // Default relationship
    setIsEditingActiveChild(true);
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

  // Partner Edit/Save/Cancel Logic
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
        const originalPartner = figure.familyMembers?.find(fm => 
          PARTNER_RELATIONSHIP_TYPES.some(rt => rt.value.toLowerCase() === fm.relationship.toLowerCase()) && fm.id !== partnerData.id
        );
        setPartnerData(originalPartner || null);
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

  // Child Edit/Save/Cancel Logic
  const handleEditActiveChild = (childToEdit: FamilyMember) => {
    setActiveChildData(childToEdit);
    setEditableChildName(childToEdit.name);
    setEditableChildPhotoUrl(childToEdit.photoUrl || '');
    setEditableChildRelationship(childToEdit.relationship); 
    setIsEditingActiveChild(true);
  };

  const handleCancelActiveChildEdit = () => {
    if (activeChildData && activeChildData.id.startsWith('new-child-')) {
      setActiveChildData(null); // Remove the "new child" slot if cancelled
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

    setIsSavingActiveChild(true);
    
    const finalChildData: FamilyMember = {
      ...activeChildData,
      id: activeChildData.id.startsWith('new-child-') ? `fm-child-${Date.now()}` : activeChildData.id,
      name: editableChildName.trim(),
      photoUrl: editableChildPhotoUrl.trim() || null,
      relationship: editableChildRelationship, 
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
      
      // Instead of setting activeChildData, we should probably nullify it after saving a new child
      // or re-fetch/filter to show the list. For now, let's nullify to clear the "add new" slot.
      setActiveChildData(null); 
      toast({ title: "Hijo/a Guardado", description: `Datos de ${finalChildData.name} actualizados.` });
      setIsEditingActiveChild(false);
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
    
  // Father Save/Cancel Logic
  const handleSaveFather = async () => {
    if (!fatherData || !figure) return;
    if (!editableFatherName.trim()) {
        toast({ title: "Error", description: "El nombre del padre no puede estar vacío.", variant: "destructive"});
        return;
    }
    if (editableFatherPhotoUrl.trim() && !isValidHttpUrl(editableFatherPhotoUrl)) {
        toast({ title: "URL Inválida", description: "La URL de la imagen para el padre no es válida.", variant: "destructive"});
        return;
    }
    setIsSavingFather(true);
    const finalFatherData: FamilyMember = {
      ...fatherData,
      id: fatherData.id.startsWith('new-father-') ? `fm-father-${Date.now()}` : fatherData.id,
      name: editableFatherName.trim(),
      photoUrl: editableFatherPhotoUrl.trim() || null,
      relationship: "Padre",
    };
    const currentFamilyMembers = figure.familyMembers || [];
    const existingIndex = currentFamilyMembers.findIndex(fm => fm.id === finalFatherData.id);
    let updatedFamilyMembers;
    if (existingIndex > -1) {
        updatedFamilyMembers = [...currentFamilyMembers];
        updatedFamilyMembers[existingIndex] = finalFatherData;
    } else {
        updatedFamilyMembers = [...currentFamilyMembers, finalFatherData];
    }
    try {
        await updateFigureInFirestore({ id: figure.id, familyMembers: updatedFamilyMembers });
        setFatherData(finalFatherData);
        toast({ title: "Padre Guardado", description: `Datos de ${finalFatherData.name} actualizados.` });
        setIsEditingFather(false);
        router.refresh();
    } catch (error: any) {
        toast({ title: "Error al Guardar Padre", description: `No se pudo guardar: ${error.message}`, variant: "destructive" });
    } finally {
        setIsSavingFather(false);
    }
  };
  const handleCancelFatherEdit = () => {
    if (fatherData && fatherData.id.startsWith('new-father-')) setFatherData(null);
    setIsEditingFather(false);
  };
  const fatherImageToDisplay = isEditingFather ? editableFatherPhotoUrl : (fatherData?.photoUrl || "");

  // Mother Save/Cancel Logic
  const handleSaveMother = async () => {
    if (!motherData || !figure) return;
    if (!editableMotherName.trim()) {
        toast({ title: "Error", description: "El nombre de la madre no puede estar vacío.", variant: "destructive"});
        return;
    }
    if (editableMotherPhotoUrl.trim() && !isValidHttpUrl(editableMotherPhotoUrl)) {
        toast({ title: "URL Inválida", description: "La URL de la imagen para la madre no es válida.", variant: "destructive"});
        return;
    }
    setIsSavingMother(true);
    const finalMotherData: FamilyMember = {
      ...motherData,
      id: motherData.id.startsWith('new-mother-') ? `fm-mother-${Date.now()}` : motherData.id,
      name: editableMotherName.trim(),
      photoUrl: editableMotherPhotoUrl.trim() || null,
      relationship: "Madre",
    };
    const currentFamilyMembers = figure.familyMembers || [];
    const existingIndex = currentFamilyMembers.findIndex(fm => fm.id === finalMotherData.id);
    let updatedFamilyMembers;
    if (existingIndex > -1) {
        updatedFamilyMembers = [...currentFamilyMembers];
        updatedFamilyMembers[existingIndex] = finalMotherData;
    } else {
        updatedFamilyMembers = [...currentFamilyMembers, finalMotherData];
    }
    try {
        await updateFigureInFirestore({ id: figure.id, familyMembers: updatedFamilyMembers });
        setMotherData(finalMotherData);
        toast({ title: "Madre Guardada", description: `Datos de ${finalMotherData.name} actualizados.` });
        setIsEditingMother(false);
        router.refresh();
    } catch (error: any) {
        toast({ title: "Error al Guardar Madre", description: `No se pudo guardar: ${error.message}`, variant: "destructive" });
    } finally {
        setIsSavingMother(false);
    }
  };
  const handleCancelMotherEdit = () => {
    if (motherData && motherData.id.startsWith('new-mother-')) setMotherData(null);
    setIsEditingMother(false);
  };
  const motherImageToDisplay = isEditingMother ? editableMotherPhotoUrl : (motherData?.photoUrl || "");

  const renderFamilyMemberCard = (
    member: FamilyMember | null,
    isEditing: boolean,
    setIsEditing: (isEditing: boolean) => void,
    editableName: string,
    setEditableName: (name: string) => void,
    editablePhotoUrl: string,
    setEditablePhotoUrl: (url: string) => void,
    editableRelationship: string | null, // Null if relationship is fixed (e.g. Padre/Madre)
    setEditableRelationship: ((rel: string) => void) | null, // Null if fixed
    relationshipTypes: { value: string, label: string }[] | null, // Null if fixed
    fixedRelationshipLabel: string, // e.g. "Padre", "Principal", "Hijo/a"
    onSave: () => Promise<void>,
    onCancel: () => void,
    isSaving: boolean,
    cardColorClass: string = "border-primary/30",
    textColorClass: string = "text-primary"
  ) => {
    if (!member && !isEditing) return null; // If no member and not in a state to add one (e.g. add parent clicked)

    const displayImageUrl = isEditing ? editablePhotoUrl : (member?.photoUrl || '');
    const displayName = isEditing ? editableName : (member?.name || `Nombre ${fixedRelationshipLabel}`);
    const displayRelationship = member?.relationship || fixedRelationshipLabel;

    return (
      <Card className={`w-60 md:w-64 shadow-xl ${cardColorClass} relative overflow-visible bg-card`}>
        <CardHeader className="p-0">
          <div className={`relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b ${cardColorClass.replace('border-', 'border-b-')}`}>
            {displayImageUrl && isValidHttpUrl(displayImageUrl) ? (
              <Image src={displayImageUrl} alt={`Imagen de ${displayName}`} fill className="object-cover" sizes="(max-width: 768px) 240px, 256px" key={displayImageUrl} data-ai-hint={`${fixedRelationshipLabel.toLowerCase()} portrait`} />
            ) : ( <div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder person"><ImageOff className="w-16 h-16" /></div> )}
          </div>
        </CardHeader>
        <CardContent className="p-3 space-y-2 text-sm">
          {isEditing ? (
            <div className="space-y-3">
              {editableRelationship !== null && setEditableRelationship && relationshipTypes && (
                <div>
                  <Label htmlFor={`relationship-${member?.id || 'new'}`} className="text-xs text-muted-foreground block mb-1">Tipo de Relación:</Label>
                  <Select value={editableRelationship} onValueChange={setEditableRelationship} disabled={isSaving}>
                    <SelectTrigger id={`relationship-${member?.id || 'new'}`} className="text-xs h-8">
                      <SelectValue placeholder="Selecciona relación" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipTypes.map(type => ( <SelectItem key={type.value} value={type.value} className="text-xs">{type.label}</SelectItem> ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div><Label htmlFor={`name-${member?.id || 'new'}`} className="text-xs text-muted-foreground block mb-1">Nombre {fixedRelationshipLabel}:</Label><Input id={`name-${member?.id || 'new'}`} type="text" value={editableName} onChange={(e) => setEditableName(e.target.value)} className="text-xs h-8" placeholder="Nombre" disabled={isSaving} /></div>
              <div><Label htmlFor={`imageUrl-${member?.id || 'new'}`} className="text-xs text-muted-foreground block mb-1">Url de la imagen:</Label><Input id={`imageUrl-${member?.id || 'new'}`} type="url" value={editablePhotoUrl} onChange={(e) => setEditablePhotoUrl(e.target.value)} className="text-xs h-8" placeholder="https://..." disabled={isSaving} /></div>
              <div className="flex justify-between gap-2 mt-2"><Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={onCancel} disabled={isSaving}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button><Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={onSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button></div>
            </div>
          ) : (
            <>
              <h3 className={`text-md font-semibold text-center ${textColorClass} truncate`} title={displayName}>{displayName}</h3>
              {displayRelationship !== "Principal" && <p className="text-xs text-muted-foreground text-center">{displayRelationship}</p>}
              <Button variant="outline" size="sm" className={`w-full mt-1 py-1 h-auto text-xs ${cardColorClass.replace('border-primary', 'border-inherit').replace('border-', 'border-')}/40 ${textColorClass}/70 hover:bg-primary/10 hover:text-primary`} onClick={() => setIsEditing(true)}><Edit3 className="mr-1.5 h-3.5 w-3.5" />EDITAR</Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const allChildren = figure.familyMembers?.filter(fm => 
    fm.relationship.toLowerCase() === "hijo/a" || 
    fm.relationship.toLowerCase() === "hijo" || 
    fm.relationship.toLowerCase() === "hija"
  ) || [];

  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-[500px] w-full">
      <div className="flex flex-col items-center space-y-8 md:space-y-12 w-full">
        
        {/* Parents Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 relative w-full mb-4">
          { (fatherData || isEditingFather) && renderFamilyMemberCard(fatherData, isEditingFather, setIsEditingFather, editableFatherName, setEditableFatherName, editableFatherPhotoUrl, setEditableFatherPhotoUrl, null, null, null, "Padre", handleSaveFather, handleCancelFatherEdit, isSavingFather, "border-blue-500/30", "text-blue-500")}
          { (fatherData || motherData || (isEditingFather && isEditingMother) ) && 
             (!isEditingFather && !isEditingMother && fatherData && motherData) &&
            <div className="hidden sm:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-0.5 w-4 md:w-8 bg-foreground/30" style={{zIndex: -1}}></div>
          }
          { (motherData || isEditingMother) && renderFamilyMemberCard(motherData, isEditingMother, setIsEditingMother, editableMotherName, setEditableMotherName, editableMotherPhotoUrl, setEditableMotherPhotoUrl, null, null, null, "Madre", handleSaveMother, handleCancelMotherEdit, isSavingMother, "border-purple-500/30", "text-purple-500")}
        </div>
        { (fatherData || motherData) && 
          <div className="w-0.5 h-8 md:h-12 bg-foreground/30 mx-auto" aria-hidden="true"></div>
        }


        {/* Central Figure and Partner Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 md:gap-16 relative w-full">
          <div className="relative">
             <AddRelationButton onClick={handleAddParents} label="Añadir Padres" title="Añadir Padre o Madre" positionClass="-top-12 left-1/2 -translate-x-1/2 transform" icon={Users2} isVisible={isEditingCentralNode && (!fatherData || !motherData)} />
            {renderFamilyMemberCard(
              { id: figure.id, name: figure.name, photoUrl: displayCentralImageUrl, relationship: "Principal" },
              isEditingCentralNode, setIsEditingCentralNode,
              () => {}, () => {}, // Name is not editable here
              editableCentralPhotoUrl, setEditableCentralPhotoUrl,
              null, null, null, "Principal", // Relationship not editable
              handleSaveCentralNodeImage, handleCancelCentralNodeEdit, isSavingCentralNode,
              "border-primary/30", "text-primary"
            )}
            <AddRelationButton onClick={handleAddPartner} label="Añadir Pareja" title="Añadir Pareja" positionClass="top-1/2 -right-12 -translate-y-1/2 transform sm:top-1/2 sm:right-auto sm:-bottom-12 sm:left-1/2 sm:-translate-x-1/2 sm:transform sm:translate-y-0 md:top-1/2 md:-right-12 md:left-auto md:-translate-y-1/2 md:translate-x-0" icon={Heart} isVisible={isEditingCentralNode && !partnerData} />
            <AddRelationButton onClick={handleAddChildren} label="Añadir Hijos" title="Añadir Hijos" positionClass="-bottom-12 left-1/2 -translate-x-1/2 transform" icon={UserPlus} isVisible={isEditingCentralNode}/>
          </div>

          { (partnerData || isEditingPartner) && (
            <>
              {(!isEditingPartner && partnerData) && <div className="hidden sm:block absolute top-1/2 left-1/2 h-0.5 w-8 md:w-12 bg-foreground/30" style={{ transform: 'translate(calc(var(--card-width, 256px)/2 - var(--gap-width, 64px)/2 + 1rem), -50%)', zIndex: -1, '--card-width': '256px', '--gap-width': '64px'} as React.CSSProperties} aria-hidden="true"></div>}
              {renderFamilyMemberCard(partnerData, isEditingPartner, setIsEditingPartner, editablePartnerName, setEditablePartnerName, editablePartnerPhotoUrl, setEditablePartnerPhotoUrl, editablePartnerRelationship, setEditablePartnerRelationship, PARTNER_RELATIONSHIP_TYPES, partnerData?.relationship || "Pareja", handleSavePartner, handleCancelPartnerEdit, isSavingPartner, "border-pink-500/30", "text-pink-500")}
            </>
          )}
        </div>
        
        {/* Children Section */}
        { (allChildren.length > 0 || (isEditingActiveChild && activeChildData) ) && 
          <div className="w-0.5 h-8 md:h-12 bg-foreground/30 mx-auto" aria-hidden="true"></div>
        }
        <div className="flex flex-wrap items-start justify-center gap-4 md:gap-8 relative w-full mt-4">
          {allChildren.map(child => (
            <div key={child.id} className="relative">
              {renderFamilyMemberCard(child, false, () => handleEditActiveChild(child), "", () => {}, "", () => {}, null, null, null, child.relationship, async () => {}, () => {}, false, "border-green-500/30", "text-green-500")}
            </div>
          ))}
          {isEditingActiveChild && activeChildData && (
             renderFamilyMemberCard(activeChildData, true, setIsEditingActiveChild, editableChildName, setEditableChildName, editableChildPhotoUrl, setEditableChildPhotoUrl, null, null, null, "Hijo/a", handleSaveActiveChild, handleCancelActiveChildEdit, isSavingActiveChild, "border-green-500/30", "text-green-500")
          )}
        </div>
      </div>

      <CardDescription className="text-center mt-10 text-xs px-4 max-w-md" style={{ '--card-width': '256px', '--gap-width': '64px'} as React.CSSProperties}>
        Haz clic en "EDITAR" en la tarjeta principal para mostrar opciones de añadir familiares.
        La información de familiares se guarda en Firestore.
      </CardDescription>
    </div>
  );
};
    

    