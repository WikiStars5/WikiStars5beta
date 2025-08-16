
"use client";

import * as React from 'react';
import type { Figure } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateFigureInFirestore } from "@/lib/placeholder-data";
import { correctMalformedUrl, cn } from "@/lib/utils";
import type { User } from 'firebase/auth';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_OPTIONS } from "@/config/categories";
import { GENDER_OPTIONS } from "@/config/genderOptions";
import { 
  Info, Edit, Save, X, Loader2, LogIn, ImageOff, Archive, Bike, Briefcase, NotepadText, FamilyIcon, Zap, BookOpen, Cake, MapPin, Globe, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan
} from "lucide-react";
import Image from "next/image";

interface FigureInfoProps {
    figure: Figure;
    currentUser: User | null;
}

export function FigureInfo({ figure, currentUser }: FigureInfoProps) {
    const { toast } = useToast();
    const router = useRouter();

    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const [editedDescription, setEditedDescription] = React.useState("");
    const [editedNationality, setEditedNationality] = React.useState("");
    const [editedOccupation, setEditedOccupation] = React.useState("");
    const [editedGender, setEditedGender] = React.useState("");
    const [editedCategory, setEditedCategory] = React.useState("");
    const [editedSportSubcategory, setEditedSportSubcategory] = React.useState("");
    const [editedPhotoUrl, setEditedPhotoUrl] = React.useState("");
    const [editedAlias, setEditedAlias] = React.useState("");
    const [editedSpecies, setEditedSpecies] = React.useState("");
    const [editedFirstAppearance, setEditedFirstAppearance] = React.useState("");
    const [editedBirthDateOrAge, setEditedBirthDateOrAge] = React.useState("");
    const [editedBirthPlace, setEditedBirthPlace] = React.useState("");
    const [editedStatusLiveOrDead, setEditedStatusLiveOrDead] = React.useState("");
    const [editedMaritalStatus, setEditedMaritalStatus] = React.useState("");
    const [editedHeight, setEditedHeight] = React.useState("");
    const [editedWeight, setEditedWeight] = React.useState("");
    const [editedHairColor, setEditedHairColor] = React.useState("");
    const [editedEyeColor, setEditedEyeColor] = React.useState("");
    const [editedDistinctiveFeatures, setEditedDistinctiveFeatures] = React.useState("");

    const canEditFigure = !!currentUser && !currentUser.isAnonymous;

    const allowedImageDomains = React.useMemo(() => {
        return [
          'placehold.co', 'firebasestorage.googleapis.com', 'wikimedia.org', 
          'static.wikia.nocookie.net', 'pinimg.com', 'flagcdn.com'
        ];
    }, []);

    const resetEditFields = React.useCallback((currentFigure: Figure | null) => {
        if (currentFigure) {
          setEditedDescription(currentFigure.description || "");
          setEditedNationality(currentFigure.nationality || "");
          setEditedOccupation(currentFigure.occupation || "");
          setEditedGender(currentFigure.gender || "");
          setEditedCategory(currentFigure.category || "");
          setEditedSportSubcategory(currentFigure.sportSubcategory || "");
          setEditedPhotoUrl(currentFigure.photoUrl || "");
          setEditedAlias(currentFigure.alias || "");
          setEditedSpecies(currentFigure.species || "");
          setEditedFirstAppearance(currentFigure.firstAppearance || "");
          setEditedBirthDateOrAge(currentFigure.birthDateOrAge || "");
          setEditedBirthPlace(currentFigure.birthPlace || "");
          setEditedStatusLiveOrDead(currentFigure.statusLiveOrDead || "");
          setEditedMaritalStatus(currentFigure.maritalStatus || "");
          setEditedHeight(currentFigure.height || "");
          setEditedWeight(currentFigure.weight || "");
          setEditedHairColor(currentFigure.hairColor || "");
          setEditedEyeColor(currentFigure.eyeColor || "");
          setEditedDistinctiveFeatures(currentFigure.distinctiveFeatures || "");
        }
    }, []);

    React.useEffect(() => {
        if (figure && isEditing) {
          resetEditFields(figure);
        }
    }, [figure, isEditing, resetEditFields]);
      
    React.useEffect(() => {
        if (isEditing) {
          if (editedCategory !== 'Deportista') {
            setEditedSportSubcategory('');
          }
        }
    }, [isEditing, editedCategory]);

    const handleEditToggle = () => {
        if (isEditing) {
          resetEditFields(figure);
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        if (!figure || !canEditFigure) {
        toast({ title: "Error", description: "No tienes permiso para guardar.", variant: "destructive" });
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
            category: editedCategory,
            sportSubcategory: editedCategory === 'Deportista' ? editedSportSubcategory : '',
            photoUrl: correctMalformedUrl(editedPhotoUrl.trim() || 'https://placehold.co/400x600.png'),
            alias: editedAlias,
            species: editedSpecies,
            firstAppearance: editedFirstAppearance,
            birthDateOrAge: editedBirthDateOrAge,
            birthPlace: editedBirthPlace,
            statusLiveOrDead: editedStatusLiveOrDead,
            maritalStatus: editedMaritalStatus,
            height: editedHeight,
            weight: editedWeight,
            hairColor: editedHairColor,
            eyeColor: editedEyeColor,
            distinctiveFeatures: editedDistinctiveFeatures,
        };
        await updateFigureInFirestore(updatedFigureData);
        toast({ title: "Éxito", description: "Información actualizada correctamente." });
        setIsEditing(false);
        router.refresh(); 
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

    const renderDetailItem = (icon: React.ElementType, label: string, value?: string) => {
        const IconComponent = icon;
        return (
          <div className="flex items-start">
            <IconComponent className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
            <div><p className="font-semibold text-foreground/90">{label}</p><p className="text-sm text-muted-foreground">{value || "No disponible"}</p></div>
          </div>
        );
    };
      
    const renderEditInput = (idField: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string) => (
        <div><Label htmlFor={idField} className="font-semibold text-foreground/90">{label}</Label><Input id={idField} value={value} onChange={onChange} placeholder={placeholder || `Ej: ${label}`} className="mt-1" /></div>
    );

    const renderEditTextarea = (idField: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string, rows?: number) => (
        <div><Label htmlFor={idField} className="font-semibold text-foreground/90">{label}</Label><Textarea id={idField} value={value} onChange={onChange} placeholder={placeholder || `Añade ${label.toLowerCase()}...`} rows={rows || 3} className="mt-1" /></div>
    );

    const renderEditSelect = (idField: string, label: string, value: string, onChange: (value: string) => void, options: readonly {value: string; label: string}[], placeholder: string) => (
        <div>
            <Label htmlFor={idField} className="font-semibold text-foreground/90">{label}</Label>
            <Select onValueChange={onChange} value={value}>
                <SelectTrigger id={idField} className="mt-1">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
    
    const isValidUrl = (url: string, domains: string[]): boolean => {
        if (!url) return false;
        try {
          const parsedUrl = new URL(url);
          return domains.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain));
        } catch (e) {
          return false;
        }
    };
    const isValidEditedPhotoUrl = isValidUrl(correctMalformedUrl(editedPhotoUrl), allowedImageDomains);

    return (
        <Card className="border border-white/20 bg-black">
            <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center"><Info className="mr-2 h-6 w-6 text-primary" /><CardTitle className="text-2xl font-headline">Sobre {figure.name}</CardTitle></div>
            {canEditFigure && !isEditing && (<Button variant="outline" size="sm" onClick={handleEditToggle}><Edit className="mr-2 h-4 w-4" />Editar</Button>)}
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
            {!canEditFigure && !isEditing && (
                <Alert variant="default" className="mb-4">
                    <LogIn className="h-4 w-4" />
                    <AlertTitle>Edición Restringida</AlertTitle>
                    <AlertDescription>
                        La edición de esta sección solo está disponible para administradores.
                    </AlertDescription>
                </Alert>
            )}
            {isEditing && canEditFigure ? (
                <div className="space-y-4">
                {renderEditInput("photoUrl", "URL de Imagen de Perfil", editedPhotoUrl, (e) => setEditedPhotoUrl(e.target.value), "Ej: https://...")}
                <p className="text-xs text-muted-foreground mt-1">Dominios permitidos: {allowedImageDomains.join(', ')}.</p>
                {editedPhotoUrl ? (isValidEditedPhotoUrl ? <div className="mt-2 relative w-32 h-40 border rounded-md overflow-hidden bg-muted flex items-center justify-center"><Image src={correctMalformedUrl(editedPhotoUrl)} alt="Preview" layout="fill" objectFit="contain" /></div> : <p className="mt-1 text-xs text-destructive">URL no válida/permitida.</p>) : <div className="mt-2 w-32 h-40 border rounded-md bg-muted flex items-center justify-center text-muted-foreground"><ImageOff className="h-10 w-10" /></div>}
                {renderEditTextarea("description", "Descripción", editedDescription, (e) => setEditedDescription(e.target.value), "Añade una descripción...", 5)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                    {renderEditSelect("category", "Categoría", editedCategory, setEditedCategory, CATEGORY_OPTIONS.map(c => ({value: c.label, label: c.label})), "Selecciona una categoría")}
                    </div>
                    {editedCategory === 'Deportista' && (
                    <div>
                        {renderEditInput("sportSubcategory", "Subcategoría de Deporte", editedSportSubcategory, (e) => setEditedSportSubcategory(e.target.value), "Ej: Fútbol, Tenis")}
                    </div>
                    )}
                    {renderEditInput("occupation", "Ocupación", editedOccupation, (e) => setEditedOccupation(e.target.value))}
                    {renderEditInput("alias", "Alias", editedAlias, (e) => setEditedAlias(e.target.value))}
                    {renderEditInput("species", "Especie", editedSpecies, (e) => setEditedSpecies(e.target.value))}
                    {renderEditInput("firstAppearance", "Primera Aparición", editedFirstAppearance, (e) => setEditedFirstAppearance(e.target.value))}
                    {renderEditInput("birthDateOrAge", "Nacimiento/Edad", editedBirthDateOrAge, (e) => setEditedBirthDateOrAge(e.target.value))}
                    {renderEditInput("birthPlace", "Lugar Nacimiento", editedBirthPlace, (e) => setEditedBirthPlace(e.target.value))}
                    {renderEditInput("nationality", "Nacionalidad", editedNationality, (e) => setEditedNationality(e.target.value))}
                    {renderEditSelect("gender", "Género", editedGender, setEditedGender, GENDER_OPTIONS.filter(g => g.value === 'male' || g.value === 'female').map(g => ({value: g.label, label: g.label})), "Selecciona un género")}
                    {renderEditInput("statusLiveOrDead", "Estado (Vivo/Muerto)", editedStatusLiveOrDead, (e) => setEditedStatusLiveOrDead(e.target.value))}
                    {renderEditInput("maritalStatus", "Estado Civil", editedMaritalStatus, (e) => setEditedMaritalStatus(e.target.value))}
                    {renderEditInput("height", "Altura", editedHeight, (e) => setEditedHeight(e.target.value))}
                    {renderEditInput("weight", "Peso", editedWeight, (e) => setEditedWeight(e.target.value))}
                    {renderEditInput("hairColor", "Color Cabello", editedHairColor, (e) => setEditedHairColor(e.target.value))}
                    {renderEditInput("eyeColor", "Color Ojos", editedEyeColor, (e) => setEditedEyeColor(e.target.value))}
                    {renderEditTextarea("distinctiveFeatures", "Rasgos Distintivos", editedDistinctiveFeatures, (e) => setEditedDistinctiveFeatures(e.target.value), "Ej: Cicatriz...", 3)}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}><X className="mr-2 h-4 w-4" />Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSaving ? "Actualizando..." : "Actualizar Figura"}</Button>
                </div>
                </div>
            ) : (
                <>
                {figure.description && <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{figure.description}</p>}
                <div className="space-y-3 pt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {figure.category && renderDetailItem(Archive, "Categoría", figure.category)}
                    {figure.category === 'Deportista' && figure.sportSubcategory && renderDetailItem(Bike, "Deporte", figure.sportSubcategory)}
                    {figure.occupation && renderDetailItem(Briefcase, "Ocupación", figure.occupation)}
                    {figure.alias && renderDetailItem(NotepadText, "Alias", figure.alias)}
                    {figure.gender && renderDetailItem(FamilyIcon, "Género", figure.gender)}
                    {figure.species && renderDetailItem(Zap, "Especie", figure.species)}
                    {figure.firstAppearance && renderDetailItem(BookOpen, "Primera Aparición", figure.firstAppearance)}
                    {figure.birthDateOrAge && renderDetailItem(Cake, "Nacimiento/Edad", figure.birthDateOrAge)}
                    {figure.birthPlace && renderDetailItem(MapPin, "Lugar de Nacimiento", figure.birthPlace)}
                    {figure.nationality && renderDetailItem(Globe, "Nacionalidad", figure.nationality)}
                    {figure.statusLiveOrDead && renderDetailItem(Activity, "Estado (Vivo/Muerto)", figure.statusLiveOrDead)}
                    {figure.maritalStatus && renderDetailItem(HeartHandshake, "Estado Civil", figure.maritalStatus)}
                    {figure.height && renderDetailItem(StretchVertical, "Altura", figure.height)}
                    {figure.weight && renderDetailItem(Scale, "Peso", figure.weight)}
                    {figure.hairColor && renderDetailItem(Palette, "Color de Cabello", figure.hairColor)}
                    {figure.eyeColor && renderDetailItem(Eye, "Color de Ojos", figure.eyeColor)}
                    {figure.distinctiveFeatures && renderDetailItem(Scan, "Rasgos Distintivos", figure.distinctiveFeatures)}
                </div>
                </>
            )}
            </CardContent>
        </Card>
    );
}
