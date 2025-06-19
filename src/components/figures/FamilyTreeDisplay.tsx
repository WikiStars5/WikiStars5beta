
"use client";

import type { Figure, FamilyMember } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ImageOff, PlusCircle, Edit3, Save, X, Loader2, Users2, Heart, UserPlus, Trash2 } from "lucide-react";
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
  const [activeChildData, setActiveChildData] = useState<FamilyMember | null>(null); // For the "add new" or currently edited child slot
  const [isEditingActiveChild, setIsEditingActiveChild] = useState(false);
  const [editableChildName, setEditableChildName] = useState('');
  const [editableChildPhotoUrl, setEditableChildPhotoUrl] = useState('');
  const [editableChildRelationship, setEditableChildRelationship] = useState("Hijo/a");
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
    const family = figure.familyMembers || [];
    const firstPartner = family.find(fm => PARTNER_RELATIONSHIP_TYPES.some(rt => rt.value.toLowerCase() === fm.relationship.toLowerCase()));
    setPartnerData(firstPartner || null);

    const firstFather = family.find(fm => fm.relationship.toLowerCase() === "padre");
    setFatherData(firstFather || null);
    
    const firstMother = family.find(fm => fm.relationship.toLowerCase() === "madre");
    setMotherData(firstMother || null);

    // Note: Displaying all children is handled by iterating figure.familyMembers directly in render.
    // activeChildData is only for the "add new" or "edit specific one" slot.
    setActiveChildData(null); // Reset "add new" slot on figure change
    setIsEditingActiveChild(false); 
    setIsEditingPartner(false);
    setIsEditingFather(false);
    setIsEditingMother(false);
  }, [figure.familyMembers, figure.id]);


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
  };
  
  const handleAddChildren = () => {
    const newChild: FamilyMember = {
      id: `new-child-${Date.now()}`,
      name: "",
      relationship: "Hijo/a", 
      photoUrl: "",
      figureId: null,
    };
    setActiveChildData(newChild); // Set as the active child being added/edited
    setEditableChildName(newChild.name);
    setEditableChildPhotoUrl(""); 
    setEditableChildRelationship("Hijo/a");
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

  const saveFamilyMember = async (
    memberDataToSave: FamilyMember,
    setSavingState: (isSaving: boolean) => void,
    setLocalMemberState: (member: FamilyMember | null) => void,
    setEditingState: (isEditing: boolean) => void,
    relationshipType: string // e.g. "Partner", "Father", "Mother", "Child"
  ) => {
    if (!figure) return;
    if (!memberDataToSave.name.trim()) {
      toast({ title: "Error", description: `El nombre para ${relationshipType} no puede estar vacío.`, variant: "destructive"});
      return;
    }
    if (memberDataToSave.photoUrl && memberDataToSave.photoUrl.trim() && !isValidHttpUrl(memberDataToSave.photoUrl)) {
        toast({ title: "URL Inválida", description: `La URL de la imagen para ${relationshipType} no es válida.`, variant: "destructive"});
        return;
    }
    setSavingState(true);
    
    const finalMemberData: FamilyMember = {
      ...memberDataToSave,
      id: memberDataToSave.id.startsWith('new-') ? `fm-${Date.now()}-${Math.random().toString(36).substring(2,7)}` : memberDataToSave.id,
      name: memberDataToSave.name.trim(),
      photoUrl: memberDataToSave.photoUrl?.trim() || null,
    };

    const currentFamilyMembers = figure.familyMembers || [];
    let updatedFamilyMembers;
    const existingMemberIndex = currentFamilyMembers.findIndex(fm => fm.id === finalMemberData.id);

    if (existingMemberIndex > -1) {
      updatedFamilyMembers = [...currentFamilyMembers];
      updatedFamilyMembers[existingMemberIndex] = finalMemberData;
    } else {
      updatedFamilyMembers = [...currentFamilyMembers, finalMemberData];
    }
    
    try {
      await updateFigureInFirestore({ id: figure.id, familyMembers: updatedFamilyMembers });
      
      setLocalMemberState(finalMemberData); 
      toast({ title: `${relationshipType} Guardado/a`, description: `Datos de ${finalMemberData.name} actualizados.` });
      setEditingState(false);
      if (relationshipType === "Child") setActiveChildData(null); // Clear active child slot after save
      router.refresh(); 
    } catch (error: any) {
      toast({ title: `Error al Guardar ${relationshipType}`, description: `No se pudo guardar: ${error.message}`, variant: "destructive" });
    } finally {
      setSavingState(false);
    }
  };
  
  const deleteFamilyMember = async (
    memberId: string,
    setLocalMemberState: (member: FamilyMember | null) => void,
    setEditingState: (isEditing: boolean) => void,
    relationshipType: string
  ) => {
    if (!figure || !memberId) return;
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a este ${relationshipType.toLowerCase()}? Esta acción no se puede deshacer.`)) return;

    const currentFamilyMembers = figure.familyMembers || [];
    const updatedFamilyMembers = currentFamilyMembers.filter(fm => fm.id !== memberId);

    try {
      await updateFigureInFirestore({ id: figure.id, familyMembers: updatedFamilyMembers });
      toast({ title: `${relationshipType} Eliminado/a`, description: "El familiar ha sido eliminado." });
      setLocalMemberState(null);
      setEditingState(false);
      if (relationshipType === "Child" && activeChildData?.id === memberId) setActiveChildData(null);
      router.refresh();
    } catch (error: any) {
      toast({ title: `Error al Eliminar ${relationshipType}`, description: `No se pudo eliminar: ${error.message}`, variant: "destructive" });
    }
  };


  // Partner Logic
  const handleEditPartner = () => {
    if (partnerData) {
      setEditablePartnerName(partnerData.name);
      setEditablePartnerPhotoUrl(partnerData.photoUrl || '');
      setEditablePartnerRelationship(partnerData.relationship);
      setIsEditingPartner(true);
    }
  };
  const handleCancelPartnerEdit = () => {
    if (partnerData && partnerData.id.startsWith('new-partner-')) setPartnerData(null);
    setIsEditingPartner(false);
  };
  const handleSavePartner = () => {
    if (!partnerData) return;
    saveFamilyMember({ ...partnerData, name: editablePartnerName, photoUrl: editablePartnerPhotoUrl, relationship: editablePartnerRelationship }, setIsSavingPartner, setPartnerData, setIsEditingPartner, "Pareja");
  };
  const handleDeletePartner = () => {
    if (partnerData) deleteFamilyMember(partnerData.id, setPartnerData, setIsEditingPartner, "Pareja");
  }
  const partnerImageToDisplay = isEditingPartner ? (editablePartnerPhotoUrl || "") : (partnerData?.photoUrl || "");

  // Child Logic
  const handleEditActiveChild = (childToEdit: FamilyMember) => {
    setActiveChildData(childToEdit);
    setEditableChildName(childToEdit.name);
    setEditableChildPhotoUrl(childToEdit.photoUrl || '');
    setEditableChildRelationship(childToEdit.relationship); 
    setIsEditingActiveChild(true);
  };
  const handleCancelActiveChildEdit = () => {
    if (activeChildData && activeChildData.id.startsWith('new-child-')) setActiveChildData(null);
    setIsEditingActiveChild(false);
  };
  const handleSaveActiveChild = () => {
    if (!activeChildData) return;
    saveFamilyMember({ ...activeChildData, name: editableChildName, photoUrl: editableChildPhotoUrl, relationship: editableChildRelationship }, setIsSavingActiveChild, (savedChild) => {
      // After saving a child, we don't set it back to activeChildData if it was new,
      // because it will be rendered by the map over figure.familyMembers.
      // We just need to clear the "new child" slot.
      if (activeChildData.id.startsWith('new-child-')) {
        setActiveChildData(null);
      } else {
        // If an existing child was edited, its card will update via refresh.
        // We can clear the activeChildData slot as well.
        setActiveChildData(null);
      }
    }, setIsEditingActiveChild, "Hijo/a");
  };
  const handleDeleteActiveChild = () => {
     if (activeChildData) deleteFamilyMember(activeChildData.id, (deletedChild) => {
        setActiveChildData(null); // Clear the edit slot
     }, setIsEditingActiveChild, "Hijo/a");
  }
  const activeChildImageToDisplay = isEditingActiveChild ? (editableChildPhotoUrl || "") : (activeChildData?.photoUrl || "");
    
  // Father Logic
  const handleEditFather = () => {
    if (fatherData) {
      setEditableFatherName(fatherData.name);
      setEditableFatherPhotoUrl(fatherData.photoUrl || '');
      setIsEditingFather(true);
    }
  };
  const handleSaveFather = () => {
    if (!fatherData) return;
    saveFamilyMember({ ...fatherData, name: editableFatherName, photoUrl: editableFatherPhotoUrl, relationship: "Padre" }, setIsSavingFather, setFatherData, setIsEditingFather, "Padre");
  };
  const handleCancelFatherEdit = () => {
    if (fatherData && fatherData.id.startsWith('new-father-')) setFatherData(null);
    setIsEditingFather(false);
  };
  const handleDeleteFather = () => {
    if (fatherData) deleteFamilyMember(fatherData.id, setFatherData, setIsEditingFather, "Padre");
  }
  const fatherImageToDisplay = isEditingFather ? editableFatherPhotoUrl : (fatherData?.photoUrl || "");

  // Mother Logic
  const handleEditMother = () => {
    if (motherData) {
      setEditableMotherName(motherData.name);
      setEditableMotherPhotoUrl(motherData.photoUrl || '');
      setIsEditingMother(true);
    }
  };
  const handleSaveMother = () => {
    if (!motherData) return;
    saveFamilyMember({ ...motherData, name: editableMotherName, photoUrl: editableMotherPhotoUrl, relationship: "Madre" }, setIsSavingMother, setMotherData, setIsEditingMother, "Madre");
  };
  const handleCancelMotherEdit = () => {
    if (motherData && motherData.id.startsWith('new-mother-')) setMotherData(null);
    setIsEditingMother(false);
  };
  const handleDeleteMother = () => {
    if (motherData) deleteFamilyMember(motherData.id, setMotherData, setIsEditingMother, "Madre");
  }
  const motherImageToDisplay = isEditingMother ? editableMotherPhotoUrl : (motherData?.photoUrl || "");

  const renderFamilyMemberCard = (
    member: FamilyMember | null,
    isEditing: boolean,
    setIsEditing: (isEditing: boolean) => void,
    editableName: string,
    setEditableName: (name: string) => void,
    editablePhotoUrl: string,
    setEditablePhotoUrl: (url: string) => void,
    editableRelationship: string | null, // Null if relationship is fixed (e.g. Padre/Madre/Hijo/a)
    setEditableRelationship: ((rel: string) => void) | null, // Null if fixed
    relationshipTypes: { value: string, label: string }[] | null, // Null if fixed
    fixedRelationshipLabel: string, // e.g. "Padre", "Principal", "Hijo/a"
    onSave: () => Promise<void>,
    onCancel: () => void,
    onDelete: (() => void) | null, // Null for central node
    isSaving: boolean,
    cardColorClass: string = "border-primary/30",
    textColorClass: string = "text-primary"
  ) => {
    if (!member && !isEditing) return null;

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
              <div><Label htmlFor={`name-${member?.id || 'new'}`} className="text-xs text-muted-foreground block mb-1">Nombre {displayRelationship !== "Principal" ? displayRelationship : fixedRelationshipLabel}:</Label><Input id={`name-${member?.id || 'new'}`} type="text" value={editableName} onChange={(e) => setEditableName(e.target.value)} className="text-xs h-8" placeholder="Nombre" disabled={isSaving} /></div>
              <div><Label htmlFor={`imageUrl-${member?.id || 'new'}`} className="text-xs text-muted-foreground block mb-1">Url de la imagen:</Label><Input id={`imageUrl-${member?.id || 'new'}`} type="url" value={editablePhotoUrl} onChange={(e) => setEditablePhotoUrl(e.target.value)} className="text-xs h-8" placeholder="https://..." disabled={isSaving} /></div>
              <div className="flex justify-between gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-xs" onClick={onCancel} disabled={isSaving}><X className="mr-1.5 h-3.5 w-3.5" /> Cancelar</Button>
                <Button size="sm" className="flex-1 py-1 h-auto text-xs" onClick={onSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}Guardar</Button>
              </div>
              {onDelete && member && !member.id.startsWith('new-') && ( // Show delete only for existing saved members
                <Button variant="destructive" size="sm" className="w-full mt-1 py-1 h-auto text-xs" onClick={onDelete} disabled={isSaving}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Eliminar</Button>
              )}
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
    fm.relationship.toLowerCase() === "hijo/a"
  ) || [];

  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-[500px] w-full">
      <div className="flex flex-col items-center space-y-8 md:space-y-12 w-full">
        
        {/* Parents Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 relative w-full mb-4">
          { (fatherData || isEditingFather) && renderFamilyMemberCard(fatherData, isEditingFather, setIsEditingFather, editableFatherName, setEditableFatherName, editableFatherPhotoUrl, setEditableFatherPhotoUrl, null, null, null, "Padre", handleSaveFather, handleCancelFatherEdit, handleDeleteFather, isSavingFather, "border-blue-500/30", "text-blue-500")}
          { (motherData || isEditingMother) && renderFamilyMemberCard(motherData, isEditingMother, setIsEditingMother, editableMotherName, setEditableMotherName, editableMotherPhotoUrl, setEditableMotherPhotoUrl, null, null, null, "Madre", handleSaveMother, handleCancelMotherEdit, handleDeleteMother, isSavingMother, "border-purple-500/30", "text-purple-500")}
        </div>
        
        {/* Central Figure and Partner Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-8 md:gap-16 relative w-full">
          <div className="relative">
             <AddRelationButton onClick={handleAddParents} label="Añadir Padres" title="Añadir Padre o Madre" positionClass="-top-12 left-1/2 -translate-x-1/2 transform" icon={Users2} isVisible={isEditingCentralNode && (!fatherData || !motherData)} />
            {renderFamilyMemberCard(
              { id: figure.id, name: figure.name, photoUrl: displayCentralImageUrl, relationship: "Principal" },
              isEditingCentralNode, setIsEditingCentralNode,
              "", () => {}, // Name is not editable here
              editableCentralPhotoUrl, setEditableCentralPhotoUrl,
              null, null, null, "Principal", // Relationship not editable
              handleSaveCentralNodeImage, handleCancelCentralNodeEdit,
              null, // No delete for central node
              isSavingCentralNode,
              "border-primary/30", "text-primary"
            )}
            <AddRelationButton onClick={handleAddPartner} label="Añadir Pareja" title="Añadir Pareja" positionClass="top-1/2 -right-12 -translate-y-1/2 transform sm:top-1/2 sm:right-auto sm:-bottom-12 sm:left-1/2 sm:-translate-x-1/2 sm:transform sm:translate-y-0 md:top-1/2 md:-right-12 md:left-auto md:-translate-y-1/2 md:translate-x-0" icon={Heart} isVisible={isEditingCentralNode && !partnerData} />
            <AddRelationButton onClick={handleAddChildren} label="Añadir Hijos" title="Añadir Hijos" positionClass="-bottom-12 left-1/2 -translate-x-1/2 transform" icon={UserPlus} isVisible={isEditingCentralNode}/>
          </div>

          { (partnerData || isEditingPartner) && renderFamilyMemberCard(partnerData, isEditingPartner, setIsEditingPartner, editablePartnerName, setEditablePartnerName, editablePartnerPhotoUrl, setEditablePartnerPhotoUrl, editablePartnerRelationship, setEditablePartnerRelationship, PARTNER_RELATIONSHIP_TYPES, partnerData?.relationship || "Pareja", handleSavePartner, handleCancelPartnerEdit, handleDeletePartner, isSavingPartner, "border-pink-500/30", "text-pink-500")}
        </div>
        
        {/* Children Section */}
        <div className="flex flex-wrap items-start justify-center gap-4 md:gap-8 relative w-full mt-4">
          {allChildren.map(child => (
            <div key={child.id} className="relative">
              {renderFamilyMemberCard(child, activeChildData?.id === child.id && isEditingActiveChild, (editing) => { if(editing) handleEditActiveChild(child); else { setActiveChildData(null); setIsEditingActiveChild(false);} }, editableChildName, setEditableChildName, editableChildPhotoUrl, setEditableChildPhotoUrl, null, null, null, child.relationship, handleSaveActiveChild, handleCancelActiveChildEdit, () => deleteFamilyMember(child.id, setActiveChildData, setIsEditingActiveChild, "Hijo/a"), isSavingActiveChild && activeChildData?.id === child.id, "border-green-500/30", "text-green-500")}
            </div>
          ))}
          {isEditingActiveChild && activeChildData && activeChildData.id.startsWith('new-child-') && ( // Only render the "new child" slot if it's active
             renderFamilyMemberCard(activeChildData, true, setIsEditingActiveChild, editableChildName, setEditableChildName, editableChildPhotoUrl, setEditableChildPhotoUrl, null, null, null, "Hijo/a", handleSaveActiveChild, handleCancelActiveChildEdit, handleDeleteActiveChild, isSavingActiveChild, "border-green-500/30", "text-green-500")
          )}
        </div>
      </div>

      <CardDescription className="text-center mt-10 text-xs px-4 max-w-md">
        Haz clic en "EDITAR" en la tarjeta principal para mostrar opciones de añadir familiares.
        La información de familiares se guarda en Firestore.
      </CardDescription>
    </div>
  );
};
    
