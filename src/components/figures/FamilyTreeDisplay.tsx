
"use client";

import type { Figure, FamilyMember } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { 
  ImageOff, PlusCircle, Edit3, Save, X, Loader2, Users2, Heart, UserPlus, Trash2,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateFigureInFirestore } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";

interface FamilyTreeDisplayProps {
  figure: Figure;
  allFigures: Figure[];
}

const PARTNER_RELATIONSHIP_TYPES = [
  { value: "Esposo", label: "Esposo" },
  { value: "Esposa", label: "Esposa" },
  { value: "Novio", label: "Novio" },
  { value: "Novia", label: "Novia" },
];

export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures }) => {
  const { toast } = useToast();
  const router = useRouter();

  // Central Node (Main Figure)
  const [isEditingCentralNode, setIsEditingCentralNode] = useState(false);
  const [editableCentralPhotoUrl, setEditableCentralPhotoUrl] = useState(figure.photoUrl || '');
  const [isSavingCentralNode, setIsSavingCentralNode] = useState(false);

  // Section Visibility States
  const [showParentsSection, setShowParentsSection] = useState(false);
  const [showPartnerSection, setShowPartnerSection] = useState(false);
  const [showChildrenSection, setShowChildrenSection] = useState(false);

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
    
    // Reset edit states when figure changes
    setIsEditingCentralNode(false);
    setIsEditingPartner(false);
    setIsEditingActiveChild(false);
    setIsEditingFather(false);
    setIsEditingMother(false);
    setActiveChildData(null);

  }, [figure.familyMembers, figure.id, figure.photoUrl]);
  
  useEffect(() => {
    setEditableCentralPhotoUrl(figure.photoUrl || '');
  }, [figure.photoUrl]);


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

  const AddNodeButton = ({ onClick, label, icon: IconComponent, className, isVisible = true, title }: { onClick: () => void; label: string, icon: React.ElementType, className?: string, isVisible?: boolean, title?: string }) => {
    if (!isVisible) return null;
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5 text-xs py-1 h-auto bg-card hover:bg-primary/10 border-primary text-primary shadow-md", className)}
        onClick={onClick}
        aria-label={label}
        title={title || label}
      >
        <IconComponent className="h-4 w-4" />
        {label}
      </Button>
    );
  };
  
  const ToggleSectionButton = ({ onClick, label, isExpanded, icon }: { onClick: () => void; label: string, isExpanded: boolean, icon: React.ElementType}) => {
    const IconComponent = icon;
    return (
      <Button variant="ghost" onClick={onClick} className="text-sm text-muted-foreground hover:text-primary w-full justify-start px-2 py-1.5 h-auto">
        <IconComponent className="mr-2 h-4 w-4" />
        {label}
        {isExpanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
      </Button>
    );
  };


  // --- CENTRAL NODE ---
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
      toast({ title: "URL Inválida", description: "La URL de la imagen para la figura principal no es válida.", variant: "destructive" });
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

  // --- GENERIC FAMILY MEMBER LOGIC ---
  const saveFamilyMember = async (
    memberDataToSave: FamilyMember,
    setSavingState: (isSaving: boolean) => void,
    setLocalMemberState: (member: FamilyMember | null) => void,
    setEditingState: (isEditing: boolean) => void,
    relationshipTypeLabel: string // e.g. "Pareja", "Padre", "Madre", "Hijo/a"
  ) => {
    if (!figure) return;
    if (!memberDataToSave.name.trim()) {
      toast({ title: "Error", description: `El nombre para ${relationshipTypeLabel.toLowerCase()} no puede estar vacío.`, variant: "destructive" });
      return;
    }
    if (memberDataToSave.photoUrl && memberDataToSave.photoUrl.trim() && !isValidHttpUrl(memberDataToSave.photoUrl)) {
      toast({ title: "URL Inválida", description: `La URL de la imagen para ${relationshipTypeLabel.toLowerCase()} no es válida.`, variant: "destructive" });
      return;
    }
    setSavingState(true);

    const finalMemberData: FamilyMember = {
      ...memberDataToSave,
      id: memberDataToSave.id.startsWith('new-') ? `fm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}` : memberDataToSave.id,
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
      toast({ title: `${relationshipTypeLabel} Guardado/a`, description: `Datos de ${finalMemberData.name} actualizados.` });
      setEditingState(false);
      if (relationshipTypeLabel === "Hijo/a") setActiveChildData(null);
      router.refresh();
    } catch (error: any) {
      toast({ title: `Error al Guardar ${relationshipTypeLabel}`, description: `No se pudo guardar: ${error.message}`, variant: "destructive" });
    } finally {
      setSavingState(false);
    }
  };

  const deleteFamilyMember = async (
    memberId: string,
    setLocalMemberState: (member: FamilyMember | null) => void,
    setEditingState: (isEditing: boolean) => void,
    relationshipTypeLabel: string,
    isChildSlot?: boolean
  ) => {
    if (!figure || !memberId) return;
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a este ${relationshipTypeLabel.toLowerCase()} (${memberId.startsWith('new-') ? 'aún no guardado' : 'guardado'})?`)) return;
    
    if (memberId.startsWith('new-')) { // If it's a new, unsaved member
      setLocalMemberState(null);
      setEditingState(false);
      if (isChildSlot) setActiveChildData(null);
      toast({ title: `${relationshipTypeLabel} Eliminado/a`, description: "El familiar no guardado ha sido descartado." });
      return;
    }

    const currentFamilyMembers = figure.familyMembers || [];
    const updatedFamilyMembers = currentFamilyMembers.filter(fm => fm.id !== memberId);

    try {
      await updateFigureInFirestore({ id: figure.id, familyMembers: updatedFamilyMembers });
      toast({ title: `${relationshipTypeLabel} Eliminado/a`, description: "El familiar ha sido eliminado." });
      setLocalMemberState(null);
      setEditingState(false);
      if (isChildSlot && activeChildData?.id === memberId) setActiveChildData(null);
      router.refresh();
    } catch (error: any) {
      toast({ title: `Error al Eliminar ${relationshipTypeLabel}`, description: `No se pudo eliminar: ${error.message}`, variant: "destructive" });
    }
  };

  // --- PARENTS LOGIC ---
  const handleAddOrEditFather = () => {
    if (!fatherData) {
      const newFather: FamilyMember = { id: `new-father-${Date.now()}`, name: "", relationship: "Padre", photoUrl: "", figureId: null };
      setFatherData(newFather);
      setEditableFatherName("");
      setEditableFatherPhotoUrl("");
    } else {
      setEditableFatherName(fatherData.name);
      setEditableFatherPhotoUrl(fatherData.photoUrl || "");
    }
    setIsEditingFather(true);
    setShowParentsSection(true);
  };
  const handleSaveFather = () => { if (fatherData) saveFamilyMember({ ...fatherData, name: editableFatherName, photoUrl: editableFatherPhotoUrl, relationship: "Padre" }, setIsSavingFather, setFatherData, setIsEditingFather, "Padre"); };
  const handleCancelFatherEdit = () => { if (fatherData && fatherData.id.startsWith('new-')) setFatherData(null); setIsEditingFather(false); };
  const handleDeleteFather = () => { if (fatherData) deleteFamilyMember(fatherData.id, setFatherData, setIsEditingFather, "Padre"); };
  const fatherImageToDisplay = isEditingFather ? editableFatherPhotoUrl : (fatherData?.photoUrl || "");

  const handleAddOrEditMother = () => {
    if (!motherData) {
      const newMother: FamilyMember = { id: `new-mother-${Date.now()}`, name: "", relationship: "Madre", photoUrl: "", figureId: null };
      setMotherData(newMother);
      setEditableMotherName("");
      setEditableMotherPhotoUrl("");
    } else {
      setEditableMotherName(motherData.name);
      setEditableMotherPhotoUrl(motherData.photoUrl || "");
    }
    setIsEditingMother(true);
    setShowParentsSection(true);
  };
  const handleSaveMother = () => { if (motherData) saveFamilyMember({ ...motherData, name: editableMotherName, photoUrl: editableMotherPhotoUrl, relationship: "Madre" }, setIsSavingMother, setMotherData, setIsEditingMother, "Madre"); };
  const handleCancelMotherEdit = () => { if (motherData && motherData.id.startsWith('new-')) setMotherData(null); setIsEditingMother(false); };
  const handleDeleteMother = () => { if (motherData) deleteFamilyMember(motherData.id, setMotherData, setIsEditingMother, "Madre"); };
  const motherImageToDisplay = isEditingMother ? editableMotherPhotoUrl : (motherData?.photoUrl || "");

  // --- PARTNER LOGIC ---
  const handleAddOrEditPartner = () => {
    if (!partnerData) {
      const newPartner: FamilyMember = { id: `new-partner-${Date.now()}`, name: "", relationship: PARTNER_RELATIONSHIP_TYPES[0].value, photoUrl: "", figureId: null };
      setPartnerData(newPartner);
      setEditablePartnerName(newPartner.name);
      setEditablePartnerPhotoUrl("");
      setEditablePartnerRelationship(newPartner.relationship);
    } else {
      setEditablePartnerName(partnerData.name);
      setEditablePartnerPhotoUrl(partnerData.photoUrl || '');
      setEditablePartnerRelationship(partnerData.relationship);
    }
    setIsEditingPartner(true);
    setShowPartnerSection(true);
  };
  const handleSavePartner = () => { if (partnerData) saveFamilyMember({ ...partnerData, name: editablePartnerName, photoUrl: editablePartnerPhotoUrl, relationship: editablePartnerRelationship }, setIsSavingPartner, setPartnerData, setIsEditingPartner, "Pareja"); };
  const handleCancelPartnerEdit = () => { if (partnerData && partnerData.id.startsWith('new-')) setPartnerData(null); setIsEditingPartner(false); };
  const handleDeletePartner = () => { if (partnerData) deleteFamilyMember(partnerData.id, setPartnerData, setIsEditingPartner, "Pareja"); };
  const partnerImageToDisplay = isEditingPartner ? (editablePartnerPhotoUrl || "") : (partnerData?.photoUrl || "");

  // --- CHILDREN LOGIC ---
  const handleAddNewChild = () => {
    const newChild: FamilyMember = { id: `new-child-${Date.now()}`, name: "", relationship: "Hijo/a", photoUrl: "", figureId: null };
    setActiveChildData(newChild);
    setEditableChildName(newChild.name);
    setEditableChildPhotoUrl("");
    setEditableChildRelationship("Hijo/a");
    setIsEditingActiveChild(true);
    setShowChildrenSection(true);
  };
  const handleEditExistingChild = (childToEdit: FamilyMember) => {
    setActiveChildData(childToEdit);
    setEditableChildName(childToEdit.name);
    setEditableChildPhotoUrl(childToEdit.photoUrl || '');
    setEditableChildRelationship(childToEdit.relationship);
    setIsEditingActiveChild(true);
    setShowChildrenSection(true);
  };
  const handleSaveActiveChild = () => { if (activeChildData) saveFamilyMember({ ...activeChildData, name: editableChildName, photoUrl: editableChildPhotoUrl, relationship: editableChildRelationship }, setIsSavingActiveChild, (savedChild) => { setActiveChildData(null); }, setIsEditingActiveChild, "Hijo/a");};
  const handleCancelActiveChildEdit = () => { if (activeChildData && activeChildData.id.startsWith('new-')) setActiveChildData(null); setIsEditingActiveChild(false); };
  const handleDeleteActiveChild = () => { if (activeChildData) deleteFamilyMember(activeChildData.id, setActiveChildData, setIsEditingActiveChild, "Hijo/a", true); };
  const activeChildImageToDisplay = isEditingActiveChild ? (editableChildPhotoUrl || "") : (activeChildData?.photoUrl || "");
  const allChildren = figure.familyMembers?.filter(fm => fm.relationship.toLowerCase() === "hijo/a") || [];


  const renderFamilyMemberCard = (
    member: FamilyMember | null,
    isEditing: boolean,
    setIsEditing: (isEditing: boolean) => void,
    editableName: string,
    setEditableName: (name: string) => void,
    editablePhotoUrl: string,
    setEditablePhotoUrl: (url: string) => void,
    editableRelationshipValue: string | null,
    setEditableRelationshipValue: ((rel: string) => void) | null,
    relationshipTypesList: { value: string, label: string }[] | null,
    defaultRelationshipLabel: string,
    onSaveHandler: () => Promise<void>,
    onCancelHandler: () => void,
    onDeleteHandler: (() => void) | null,
    isSavingState: boolean,
    cardColorClass: string = "border-primary/30",
    textColorClass: string = "text-primary",
    isMainNode: boolean = false
  ) => {
    if (!member && !isEditing && !isMainNode) return null;

    const displayImageUrl = isEditing ? editablePhotoUrl : (member?.photoUrl || (isMainNode ? figure.photoUrl : ''));
    const displayName = isEditing ? editableName : (member?.name || (isMainNode ? figure.name : `Añadir ${defaultRelationshipLabel}`));
    const displayRelationship = member?.relationship || defaultRelationshipLabel;

    return (
      <Card className={cn("w-48 md:w-56 shadow-lg relative bg-card flex flex-col", cardColorClass)}>
        <CardHeader className="p-0">
          <div className={cn(
            "relative w-full aspect-[3/4] bg-muted rounded-t-md overflow-hidden mx-auto border-b",
            cardColorClass.replace('border-', 'border-b-')
          )}>
            {displayImageUrl && isValidHttpUrl(displayImageUrl) ? (
              <Image src={displayImageUrl} alt={`Imagen de ${displayName}`} fill className="object-cover" sizes="(max-width: 768px) 192px, 224px" key={displayImageUrl} data-ai-hint={`${defaultRelationshipLabel.toLowerCase()} portrait`} />
            ) : (<div className="w-full h-full flex items-center justify-center text-muted-foreground" data-ai-hint="placeholder person"><ImageOff className="w-12 h-12" /></div>)}
          </div>
        </CardHeader>
        <CardContent className="p-2.5 space-y-1.5 text-xs flex-grow flex flex-col justify-between">
          {isEditing ? (
            <div className="space-y-2 flex-grow">
              {editableRelationshipValue !== null && setEditableRelationshipValue && relationshipTypesList && (
                <div><Label htmlFor={`relationship-${member?.id || 'new'}`} className="text-2xs text-muted-foreground block mb-0.5">Relación:</Label>
                  <Select value={editableRelationshipValue} onValueChange={setEditableRelationshipValue} disabled={isSavingState}>
                    <SelectTrigger id={`relationship-${member?.id || 'new'}`} className="text-2xs h-7"><SelectValue placeholder="Relación" /></SelectTrigger>
                    <SelectContent>{relationshipTypesList.map(type => (<SelectItem key={type.value} value={type.value} className="text-2xs">{type.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              )}
              <div><Label htmlFor={`name-${member?.id || 'new'}`} className="text-2xs text-muted-foreground block mb-0.5">Nombre:</Label><Input id={`name-${member?.id || 'new'}`} type="text" value={editableName} onChange={(e) => setEditableName(e.target.value)} className="text-2xs h-7" placeholder="Nombre" disabled={isSavingState} /></div>
              <div><Label htmlFor={`imageUrl-${member?.id || 'new'}`} className="text-2xs text-muted-foreground block mb-0.5">URL Imagen:</Label><Input id={`imageUrl-${member?.id || 'new'}`} type="url" value={editablePhotoUrl} onChange={(e) => setEditablePhotoUrl(e.target.value)} className="text-2xs h-7" placeholder="https://..." disabled={isSavingState} /></div>
            </div>
          ) : (
            <div className="text-center flex-grow flex flex-col justify-center">
              <h3 className={cn("text-sm font-semibold truncate", textColorClass)} title={displayName}>{displayName}</h3>
              {displayRelationship !== "Principal" && <p className="text-2xs text-muted-foreground">{displayRelationship}</p>}
            </div>
          )}
          <div className="flex flex-col gap-1.5 mt-1.5">
            {isEditing ? (
              <>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="flex-1 py-1 h-auto text-2xs" onClick={onCancelHandler} disabled={isSavingState}><X className="mr-1 h-3 w-3" /> Cancelar</Button>
                  <Button size="sm" className="flex-1 py-1 h-auto text-2xs" onClick={onSaveHandler} disabled={isSavingState}>{isSavingState ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}Guardar</Button>
                </div>
                {onDeleteHandler && (member || isMainNode) && (!member?.id?.startsWith('new-') || isMainNode) && ( // Show delete only for existing saved members or when editing a new one
                  <Button variant="destructive" size="sm" className="w-full mt-1 py-1 h-auto text-2xs" onClick={onDeleteHandler} disabled={isSavingState}><Trash2 className="mr-1 h-3 w-3" />Eliminar</Button>
                )}
              </>
            ) : (
              <Button variant="outline" size="sm" className={cn("w-full py-1 h-auto text-2xs", cardColorClass.replace('border-primary', 'border-inherit').replace('border-', 'border-b-'), textColorClass + "/70", "hover:bg-primary/10 hover:text-primary")} onClick={() => setIsEditing(true)}><Edit3 className="mr-1 h-3 w-3" />EDITAR</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="flex flex-col items-center p-2 md:p-4 min-h-[calc(100vh-250px)] w-full space-y-4 overflow-auto">
      {/* Central Node Controls */}
      <div className="mb-4 p-3 border rounded-lg bg-card/50 shadow w-full max-w-md sticky top-0 z-10">
         <h3 className="text-sm font-medium text-center mb-2 text-primary">Panel de Control del Árbol</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <ToggleSectionButton onClick={() => setShowParentsSection(!showParentsSection)} label={showParentsSection ? "Ocultar Padres" : "Mostrar Padres"} isExpanded={showParentsSection} icon={Users2} />
          <ToggleSectionButton onClick={() => setShowPartnerSection(!showPartnerSection)} label={showPartnerSection ? "Ocultar Pareja" : "Mostrar Pareja"} isExpanded={showPartnerSection} icon={Heart} />
          <ToggleSectionButton onClick={() => setShowChildrenSection(!showChildrenSection)} label={showChildrenSection ? "Ocultar Hijos" : "Mostrar Hijos"} isExpanded={showChildrenSection} icon={UserPlus} />
        </div>
      </div>

      {/* Parents Section */}
      {showParentsSection && (
        <div className="w-full flex flex-col items-center space-y-3 mb-6">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Padres</h4>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6">
            {isEditingFather || fatherData ? renderFamilyMemberCard(fatherData, isEditingFather, setIsEditingFather, editableFatherName, setEditableFatherName, fatherImageToDisplay, setEditableFatherPhotoUrl, null, null, null, "Padre", handleSaveFather, handleCancelFatherEdit, handleDeleteFather, isSavingFather, "border-blue-500/30", "text-blue-500") : null }
            {isEditingMother || motherData ? renderFamilyMemberCard(motherData, isEditingMother, setIsEditingMother, editableMotherName, setEditableMotherName, motherImageToDisplay, setEditableMotherPhotoUrl, null, null, null, "Madre", handleSaveMother, handleCancelMotherEdit, handleDeleteMother, isSavingMother, "border-purple-500/30", "text-purple-500") : null}
          </div>
           {(isEditingCentralNode && (!fatherData || !motherData)) && (
            <div className="flex gap-2 mt-2">
              {!fatherData && <AddNodeButton onClick={handleAddOrEditFather} label="Añadir Padre" icon={PlusCircle} title="Añadir Padre" />}
              {!motherData && <AddNodeButton onClick={handleAddOrEditMother} label="Añadir Madre" icon={PlusCircle} title="Añadir Madre" />}
            </div>
          )}
        </div>
      )}

      {/* Main Figure and Partner Section */}
      <div className="w-full flex flex-col items-center space-y-3 md:space-y-0 md:flex-row md:items-start md:justify-center md:gap-6 mb-6 relative">
        {/* Main Figure Node */}
        <div className="relative">
          {renderFamilyMemberCard(
            { id: figure.id, name: figure.name, photoUrl: displayCentralImageUrl, relationship: "Principal" },
            isEditingCentralNode, setIsEditingCentralNode,
            "", () => {}, 
            editableCentralPhotoUrl, setEditableCentralPhotoUrl,
            null, null, null, "Principal",
            handleSaveCentralNodeImage, handleCancelCentralNodeEdit,
            null, 
            isSavingCentralNode,
            "border-primary", "text-primary font-bold", true
          )}
        </div>

        {/* Partner Node */}
        {showPartnerSection && (isEditingPartner || partnerData) && (
          <div className="relative mt-3 md:mt-0">
            {renderFamilyMemberCard(partnerData, isEditingPartner, setIsEditingPartner, editablePartnerName, setEditablePartnerName, partnerImageToDisplay, setEditablePartnerPhotoUrl, editablePartnerRelationship, setEditablePartnerRelationship, PARTNER_RELATIONSHIP_TYPES, partnerData?.relationship || "Pareja", handleSavePartner, handleCancelPartnerEdit, handleDeletePartner, isSavingPartner, "border-pink-500/30", "text-pink-500")}
          </div>
        )}
         {(isEditingCentralNode && !partnerData && showPartnerSection )&& (
             <AddNodeButton onClick={handleAddOrEditPartner} label="Añadir Pareja" icon={Heart} className="md:absolute md:top-1/2 md:-right-28 md:-translate-y-1/2 mt-2 md:mt-0" title="Añadir Pareja"/>
        )}
      </div>
      
      {/* Children Section */}
      {showChildrenSection && (
        <div className="w-full flex flex-col items-center space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Hijos/as</h4>
          <div className="flex flex-wrap items-start justify-center gap-3 md:gap-6">
            {allChildren.map(child => (
              <div key={child.id} className="relative">
                {renderFamilyMemberCard(child, activeChildData?.id === child.id && isEditingActiveChild, 
                  (editing) => { if(editing) handleEditExistingChild(child); else { setActiveChildData(null); setIsEditingActiveChild(false);} }, 
                  editableChildName, setEditableChildName, editableChildPhotoUrl, setEditableChildPhotoUrl, 
                  null, null, null, 
                  child.relationship, handleSaveActiveChild, handleCancelActiveChildEdit, 
                  () => deleteFamilyMember(child.id, (deletedChild) => { setActiveChildData(null); }, setIsEditingActiveChild, "Hijo/a"), 
                  isSavingActiveChild && activeChildData?.id === child.id, "border-green-500/30", "text-green-500"
                )}
              </div>
            ))}
            {isEditingActiveChild && activeChildData && activeChildData.id.startsWith('new-child-') && (
               renderFamilyMemberCard(activeChildData, true, setIsEditingActiveChild, editableChildName, setEditableChildName, activeChildImageToDisplay, setEditableChildPhotoUrl, null, null, null, "Hijo/a", handleSaveActiveChild, handleCancelActiveChildEdit, handleDeleteActiveChild, isSavingActiveChild, "border-green-500/30", "text-green-500")
            )}
          </div>
          {isEditingCentralNode && (
            <AddNodeButton onClick={handleAddNewChild} label="Añadir Hijo/a" icon={UserPlus} className="mt-2" title="Añadir Nuevo Hijo/a"/>
          )}
        </div>
      )}

      <CardDescription className="text-center mt-6 text-xs px-2 max-w-sm mx-auto">
        Usa los botones de mostrar/ocultar para navegar el árbol. Para añadir o editar familiares directos, primero haz clic en "EDITAR" en la tarjeta principal de {figure.name}.
      </CardDescription>
    </div>
  );
};
    
