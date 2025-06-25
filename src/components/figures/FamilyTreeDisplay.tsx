
"use client";

import type { Figure, FamilyMember } from "@/lib/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { 
  ImageOff, PlusCircle, Edit3, Save, X, Loader2, Users2, Heart, UserPlus, Trash2,
  ChevronDown, ChevronUp, Link as LinkIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateFigureInFirestore } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import { Combobox } from '@/components/shared/Combobox';

interface FamilyTreeDisplayProps {
  figure: Figure;
  allFigures: Figure[];
  canEdit: boolean;
}

const RELATIONSHIP_TYPES = [
  { value: "Esposo", label: "Esposo" }, { value: "Esposa", label: "Esposa" },
  { value: "Novio", label: "Novio" }, { value: "Novia", label: "Novia" },
  { value: "Padre", label: "Padre" }, { value: "Madre", label: "Madre" },
  { value: "Hijo/a", label: "Hijo/a" }, { value: "Hermano/a", label: "Hermano/a" },
  { value: "Abuelo Paterno", label: "Abuelo Paterno" }, { value: "Abuela Paterna", label: "Abuela Paterna" },
  { value: "Abuelo Materno", label: "Abuelo Materno" }, { value: "Abuela Materna", label: "Abuela Materna" },
  { value: "Tío (Paterno)", label: "Tío (Paterno)" }, { value: "Tía (Paterna)", label: "Tía (Paterna)" },
  { value: "Tío (Materno)", label: "Tío (Materno)" }, { value: "Tía (Materna)", label: "Tía (Materna)" },
];

export const FamilyTreeDisplay: React.FC<FamilyTreeDisplayProps> = ({ figure, allFigures, canEdit }) => {
  const { toast } = useToast();
  const router = useRouter();

  const [isTreeInEditMode, setIsTreeInEditMode] = useState(false);
  const [activeEditingMemberId, setActiveEditingMemberId] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(figure.familyMembers || []);

  const [editableName, setEditableName] = useState('');
  const [editablePhotoUrl, setEditablePhotoUrl] = useState('');
  const [editableRelationship, setEditableRelationship] = useState('');
  const [linkedFigureId, setLinkedFigureId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFamilyMembers(figure.familyMembers || []);
  }, [figure.familyMembers]);

  const allFiguresOptions = allFigures.map(f => ({ value: f.id, label: f.name }));

  const startEditing = (member: FamilyMember) => {
    setActiveEditingMemberId(member.id);
    setEditableName(member.name);
    setEditablePhotoUrl(member.photoUrl || '');
    setEditableRelationship(member.relationship);
    setLinkedFigureId(member.figureId || null);
  };

  const cancelEditing = () => {
    setActiveEditingMemberId(null);
  };
  
  const addNewMember = () => {
    const newMember: FamilyMember = {
      id: `fm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: "Nuevo Familiar",
      relationship: "Hermano/a",
      photoUrl: "",
      figureId: null
    };
    setFamilyMembers(prev => [...prev, newMember]);
    startEditing(newMember);
  };

  const handleSave = async (memberId: string) => {
    if (!editableName.trim()) {
        toast({ title: "Error", description: "El nombre no puede estar vacío.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    const updatedMembers = familyMembers.map(member => {
      if (member.id === memberId) {
        const linkedFigure = linkedFigureId ? allFigures.find(f => f.id === linkedFigureId) : null;
        return {
          ...member,
          name: linkedFigure ? linkedFigure.name : editableName,
          relationship: editableRelationship,
          photoUrl: linkedFigure ? linkedFigure.photoUrl : (editablePhotoUrl || null),
          figureId: linkedFigureId
        };
      }
      return member;
    });

    try {
        await updateFigureInFirestore({ id: figure.id, familyMembers: updatedMembers });
        toast({ title: "Familia Actualizada", description: "El árbol genealógico ha sido guardado." });
        setFamilyMembers(updatedMembers);
        cancelEditing();
        router.refresh();
    } catch (error: any) {
        toast({ title: "Error al Guardar", description: `No se pudo guardar la familia: ${error.message}`, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDelete = async (memberId: string) => {
      if (!window.confirm("¿Estás seguro de que quieres eliminar a este familiar?")) return;
      const updatedMembers = familyMembers.filter(m => m.id !== memberId);
      try {
          await updateFigureInFirestore({ id: figure.id, familyMembers: updatedMembers });
          toast({ title: "Familiar Eliminado", description: "El miembro ha sido eliminado del árbol." });
          setFamilyMembers(updatedMembers);
          cancelEditing();
          router.refresh();
      } catch (error: any) {
          toast({ title: "Error al Eliminar", description: `No se pudo eliminar: ${error.message}`, variant: "destructive" });
      }
  };
  
  const handleLinkedFigureChange = (figureId: string | null) => {
      setLinkedFigureId(figureId);
      const linkedFigure = figureId ? allFigures.find(f => f.id === figureId) : null;
      if(linkedFigure) {
        setEditableName(linkedFigure.name);
        setEditablePhotoUrl(linkedFigure.photoUrl || '');
      }
  };


  const renderMemberCard = (member: FamilyMember) => {
    const isEditingThisMember = activeEditingMemberId === member.id;
    
    return (
      <Card key={member.id} className="w-full max-w-sm shadow-md flex flex-col">
        <CardHeader className="p-0">
           <div className="relative w-full aspect-[4/3] bg-muted rounded-t-md overflow-hidden">
             {(member.photoUrl || (isEditingThisMember && editablePhotoUrl)) ? (
                <Image src={(isEditingThisMember ? editablePhotoUrl : member.photoUrl) || ''} alt={`Imagen de ${member.name}`} fill className="object-cover" sizes="384px" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageOff className="w-12 h-12" /></div>
             )}
           </div>
        </CardHeader>
        <CardContent className="p-3 space-y-2 flex-grow">
          {isEditingThisMember ? (
            <div className="space-y-3">
              <div>
                <Label>Relación</Label>
                <Select value={editableRelationship} onValueChange={setEditableRelationship} disabled={isSaving}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map(rt => <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4"/> Vincular a un Perfil Existente (Opcional)</Label>
                <Combobox options={allFiguresOptions} value={linkedFigureId || ''} onChange={handleLinkedFigureChange} placeholder="Buscar figura para vincular..." disabled={isSaving}/>
              </div>
              <hr/>
              <div>
                <Label>Nombre (si no está vinculado)</Label>
                <Input value={editableName} onChange={(e) => setEditableName(e.target.value)} disabled={isSaving || !!linkedFigureId}/>
              </div>
              <div>
                <Label>URL de Imagen (si no está vinculado)</Label>
                <Input value={editablePhotoUrl} onChange={(e) => setEditablePhotoUrl(e.target.value)} disabled={isSaving || !!linkedFigureId} />
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.relationship}</p>
            </div>
          )}
        </CardContent>
        {isTreeInEditMode && (
          <CardDescription className="p-3 pt-0 border-t mt-2">
            {isEditingThisMember ? (
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}><X className="h-4 w-4 mr-1"/>Cancelar</Button>
                <Button size="sm" onClick={() => handleSave(member.id)} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Save className="h-4 w-4 mr-1"/>}
                  Guardar
                </Button>
                 <Button variant="destructive" size="sm" onClick={() => handleDelete(member.id)} disabled={isSaving}><Trash2 className="h-4 w-4"/></Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={() => startEditing(member)}><Edit3 className="h-4 w-4 mr-1"/>Editar</Button>
            )}
          </CardDescription>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end items-center gap-4 p-2 border rounded-lg bg-muted/50">
          <Label htmlFor="edit-mode-toggle" className="text-sm font-medium">
            {isTreeInEditMode ? 'Desactivar Edición' : 'Activar Edición del Árbol'}
          </Label>
          <Button id="edit-mode-toggle" size="sm" variant={isTreeInEditMode ? "secondary" : "outline"} onClick={() => setIsTreeInEditMode(!isTreeInEditMode)}>
             {isTreeInEditMode ? <X className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
             {isTreeInEditMode ? "Salir de Edición" : "Editar Familia"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyMembers.map(member => renderMemberCard(member))}
        {isTreeInEditMode && (
          <Card className="w-full max-w-sm shadow-md flex items-center justify-center border-dashed min-h-[200px]">
            <Button variant="ghost" className="text-lg" onClick={addNewMember}>
              <PlusCircle className="mr-2 h-6 w-6"/>
              Añadir Familiar
            </Button>
          </Card>
        )}
      </div>

       {familyMembers.length === 0 && !isTreeInEditMode && (
        <p className="text-muted-foreground text-center py-8">No hay familiares registrados para esta figura.</p>
      )}
    </div>
  );
};
