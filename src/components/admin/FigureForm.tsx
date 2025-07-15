
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Sparkles, Loader2 } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure, EmotionKey, AttitudeKey, StarValueAsString } from '@/lib/types';
import slugify from 'slugify'; 
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_OPTIONS } from '@/config/categories';
import { GENDER_OPTIONS } from '@/config/genderOptions';

interface FigureFormProps {
  initialData?: Figure;
}

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

const defaultStarRatingCounts: Record<StarValueAsString, number> = {
  "1": 0, "2": 0, "3": 0, "4": 0, "5": 0,
};

const FigureForm: React.FC<FigureFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || '');
  
  // Basic info
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [nationality, setNationality] = useState(initialData?.nationality || '');
  const [category, setCategory] = useState(initialData?.category || '');

  // New detailed fields
  const [alias, setAlias] = useState(initialData?.alias || '');
  const [species, setSpecies] = useState(initialData?.species || '');
  const [firstAppearance, setFirstAppearance] = useState(initialData?.firstAppearance || '');
  const [birthDateOrAge, setBirthDateOrAge] = useState(initialData?.birthDateOrAge || '');
  const [birthPlace, setBirthPlace] = useState(initialData?.birthPlace || '');
  const [statusLiveOrDead, setStatusLiveOrDead] = useState(initialData?.statusLiveOrDead || '');
  const [maritalStatus, setMaritalStatus] = useState(initialData?.maritalStatus || '');
  const [height, setHeight] = useState(initialData?.height || '');
  const [weight, setWeight] = useState(initialData?.weight || '');
  const [hairColor, setHairColor] = useState(initialData?.hairColor || '');
  const [eyeColor, setEyeColor] = useState(initialData?.eyeColor || '');
  const [distinctiveFeatures, setDistinctiveFeatures] = useState(initialData?.distinctiveFeatures || '');
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);


  const [perceptionCounts, setPerceptionCounts] = useState(initialData?.perceptionCounts || { ...defaultPerceptionCounts });
  const [attitudeCounts, setAttitudeCounts] = useState(initialData?.attitudeCounts || { ...defaultAttitudeCounts });
  const [starRatingCounts, setStarRatingCounts] = useState(initialData?.starRatingCounts || { ...defaultStarRatingCounts });
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || ''); 
      setPhotoUrl(initialData.photoUrl || '');
      setOccupation(initialData.occupation || '');
      setGender(initialData.gender || '');
      setNationality(initialData.nationality || '');
      setCategory(initialData.category || '');
      
      setAlias(initialData.alias || '');
      setSpecies(initialData.species || '');
      setFirstAppearance(initialData.firstAppearance || '');
      setBirthDateOrAge(initialData.birthDateOrAge || '');
      setBirthPlace(initialData.birthPlace || '');
      setStatusLiveOrDead(initialData.statusLiveOrDead || '');
      setMaritalStatus(initialData.maritalStatus || '');
      setHeight(initialData.height || '');
      setWeight(initialData.weight || '');
      setHairColor(initialData.hairColor || '');
      setEyeColor(initialData.eyeColor || '');
      setDistinctiveFeatures(initialData.distinctiveFeatures || '');
      setIsFeatured(initialData.isFeatured || false);

      setPerceptionCounts(initialData.perceptionCounts || { ...defaultPerceptionCounts });
      setAttitudeCounts(initialData.attitudeCounts || { ...defaultAttitudeCounts });
      setStarRatingCounts(initialData.starRatingCounts || { ...defaultStarRatingCounts });
      
    } else {
      // Reset all fields for new figure form
      setName('');
      setDescription('');
      setPhotoUrl('');
      setOccupation('');
      setGender('');
      setNationality('');
      setCategory('');
      setAlias('');
      setSpecies('');
      setFirstAppearance('');
      setBirthDateOrAge('');
      setBirthPlace('');
      setStatusLiveOrDead('');
      setMaritalStatus('');
      setHeight('');
      setWeight('');
      setHairColor('');
      setEyeColor('');
      setDistinctiveFeatures('');
      setIsFeatured(false);
      setPerceptionCounts({ ...defaultPerceptionCounts });
      setAttitudeCounts({ ...defaultAttitudeCounts });
      setStarRatingCounts({ ...defaultStarRatingCounts });
    }
  }, [initialData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    let figureDocId = initialData?.id || slugify(name.trim(), { lower: true, strict: true });
    
    if (!figureDocId && name.trim()) { 
      figureDocId = slugify(name.trim(), { lower: true, strict: true });
    }
    if (!figureDocId) {
      setError('No se pudo generar un ID para la figura. Asegúrate de que el nombre no esté vacío.');
      setIsSaving(false);
      return;
    }

    try {
      if (!name.trim()) {
        throw new Error('El nombre de la figura es obligatorio.');
      }
      
      const finalPhotoUrlToSave = photoUrl.trim() || 'https://placehold.co/400x600.png';

      const figureData: Omit<Figure, 'id' | 'createdAt'> & { createdAt?: any } = { 
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        description: description.trim() || initialData?.description || "", 
        photoUrl: finalPhotoUrlToSave,
        nationality: nationality.trim(),
        occupation: occupation.trim(),
        gender: gender.trim(),
        category: category.trim(),
        alias: alias.trim(),
        species: species.trim(),
        firstAppearance: firstAppearance.trim(),
        birthDateOrAge: birthDateOrAge.trim(),
        birthPlace: birthPlace.trim(),
        statusLiveOrDead: statusLiveOrDead.trim(),
        maritalStatus: maritalStatus.trim(),
        height: height.trim(),
        weight: weight.trim(),
        hairColor: hairColor.trim(),
        eyeColor: eyeColor.trim(),
        distinctiveFeatures: distinctiveFeatures.trim(),
        isFeatured: isFeatured,
        perceptionCounts: perceptionCounts || { ...defaultPerceptionCounts },
        attitudeCounts: attitudeCounts || { ...defaultAttitudeCounts },
        starRatingCounts: starRatingCounts || { ...defaultStarRatingCounts },
        status: initialData?.status || 'approved',
      };

      if (!initialData?.id) { 
        figureData.createdAt = serverTimestamp();
      }

      const figureRef = doc(db, 'figures', figureDocId);
      await setDoc(figureRef, figureData, { merge: true });

      setSuccess(`Figura "${name}" guardada exitosamente.`);
      
      setTimeout(() => {
        if (!initialData?.id) { 
          router.push(`/admin/figures/${figureDocId}/edit`); 
        } else { 
          router.push('/admin/figures');
        }
        router.refresh(); 
      }, 1500);

    } catch (err: any) {
      console.error("[FigureForm handleSubmit] ERROR en handleSubmit:", err);
      setError(err.message || 'Error al guardar la figura. Revisa la consola del navegador para más detalles.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card rounded-lg shadow-md">
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Nombre de la Figura</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Albert Einstein"
          required
        />
      </div>

      <div>
        <Label htmlFor="photoUrl">URL de la Imagen de Perfil</Label>
        <Input
          id="photoUrl"
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://ejemplo.com/imagen.png"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Si se deja en blanco, se usará una imagen de marcador de posición.
        </p>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Escribe una breve descripción."
          rows={4}
        />
      </div>
      
      <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Información Detallada</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select onValueChange={setCategory} value={category}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="occupation">Ocupación/Profesión</Label><Input id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ej: Científico, Futbolista" /></div>
        <div><Label htmlFor="nationality">Nacionalidad</Label><Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Ej: Estadounidense, Peruano" /></div>
        <div>
          <Label htmlFor="gender">Género</Label>
          <Select onValueChange={setGender} value={gender}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Selecciona un género" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                (option.value === 'male' || option.value === 'female') && (
                  <SelectItem key={option.value} value={option.label}>
                    {option.label}
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
        </div>
        <div><Label htmlFor="alias">Alias / Apodos</Label><Input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej: El Sabio, Princesa de Fuego" /></div>
        <div><Label htmlFor="species">Especie / Raza</Label><Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Ej: Demonio, Humano" /></div>
        <div><Label htmlFor="firstAppearance">Primera Aparición</Label><Input id="firstAppearance" value={firstAppearance} onChange={(e) => setFirstAppearance(e.target.value)} placeholder="Ej: High School DxD, Novela Ligera, 2008" /></div>
        <div><Label htmlFor="birthDateOrAge">Fecha de Nacimiento / Edad</Label><Input id="birthDateOrAge" value={birthDateOrAge} onChange={(e) => setBirthDateOrAge(e.target.value)} placeholder="Ej: Desconocida / Apariencia de 18 años" /></div>
        <div><Label htmlFor="birthPlace">Lugar de Nacimiento</Label><Input id="birthPlace" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Ej: Inframundo, Japón" /></div>
        <div><Label htmlFor="statusLiveOrDead">Estado (Vivo/Muerto)</Label><Input id="statusLiveOrDead" value={statusLiveOrDead} onChange={(e) => setStatusLiveOrDead(e.target.value)} placeholder="Ej: Vivo, Fallecido, Inmortal" /></div>
        <div><Label htmlFor="maritalStatus">Estado Civil</Label><Input id="maritalStatus" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} placeholder="Ej: Soltero/a, Casado/a" /></div>
      </div>

      <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Apariencia y Rasgos Físicos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor="height">Altura</Label><Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ej: 1.68 cm" /></div>
        <div><Label htmlFor="weight">Peso</Label><Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej: 56 kg (Opcional)" /></div>
        <div><Label htmlFor="hairColor">Color de Cabello</Label><Input id="hairColor" value={hairColor} onChange={(e) => setHairColor(e.target.value)} placeholder="Ej: Negro" /></div>
        <div><Label htmlFor="eyeColor">Color de Ojos</Label><Input id="eyeColor" value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} placeholder="Ej: Violeta, Azules" /></div>
        <div className="md:col-span-2"><Label htmlFor="distinctiveFeatures">Rasgos Distintivos</Label><Textarea id="distinctiveFeatures" value={distinctiveFeatures} onChange={(e) => setDistinctiveFeatures(e.target.value)} placeholder="Ej: Cicatriz en el ojo, Alas de demonio" rows={2}/></div>
      </div>
      
      <div className="mt-6 border-t pt-4 border-border">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFeatured"
            checked={isFeatured}
            onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
            disabled={isSaving}
          />
          <Label htmlFor="isFeatured" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Marcar como Figura Destacada
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          Las figuras destacadas aparecerán en la sección principal de la página de inicio.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        <Button type="submit" className="flex-grow" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? 'Guardando...' : initialData ? 'Actualizar Figura' : 'Crear Figura'}
        </Button>
      </div>
    </form>
  );
};

export default FigureForm;
