
// === src/components/admin/FigureForm.tsx ===
// Este componente ha sido modificado para incluir la lógica de subida de archivos a Firebase Storage
// y con depuración adicional para el proceso de subida.

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ImageOff, Users2 } from 'lucide-react'; // Added Users2 for family tree icon
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; 
import type { Figure, EmotionKey, AttitudeKey, StarValueAsString, FamilyMember } from '@/lib/types';
import slugify from 'slugify'; 

interface FigureFormProps {
  initialData?: Figure;
}

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0,
  envidia: 0,
  tristeza: 0,
  miedo: 0,
  desagrado: 0,
  furia: 0,
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  // Basic info
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [nationality, setNationality] = useState(initialData?.nationality || '');

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


  const [perceptionCounts, setPerceptionCounts] = useState(initialData?.perceptionCounts || { ...defaultPerceptionCounts });
  const [attitudeCounts, setAttitudeCounts] = useState(initialData?.attitudeCounts || { ...defaultAttitudeCounts });
  const [starRatingCounts, setStarRatingCounts] = useState(initialData?.starRatingCounts || { ...defaultStarRatingCounts });
  
  const [familyMembersJson, setFamilyMembersJson] = useState(
    initialData?.familyMembers ? JSON.stringify(initialData.familyMembers, null, 2) : '[]'
  );


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAuthReady, setIsAuthReady] = useState(false); 

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("No hay usuario autenticado. Intentando autenticación anónima...");
        try {
          await signInAnonymously(auth);
          console.log("Autenticación anónima exitosa.");
        } catch (authError: any) {
          console.error("Error durante la autenticación anónima:", authError.message);
          setError(`Error de autenticación: ${authError.message}. Asegúrate de que la autenticación anónima esté habilitada en Firebase.`);
        }
      } else {
        console.log("Usuario autenticado:", user.uid);
      }
      setIsAuthReady(true); 
    });

    return () => unsubscribe(); 
  }, []); 

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || ''); 
      setPhotoUrl(initialData.photoUrl || ''); 
      setOccupation(initialData.occupation || '');
      setGender(initialData.gender || '');
      setNationality(initialData.nationality || '');
      
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

      setPerceptionCounts(initialData.perceptionCounts || { ...defaultPerceptionCounts });
      setAttitudeCounts(initialData.attitudeCounts || { ...defaultAttitudeCounts });
      setStarRatingCounts(initialData.starRatingCounts || { ...defaultStarRatingCounts });
      setFamilyMembersJson(initialData.familyMembers ? JSON.stringify(initialData.familyMembers, null, 2) : '[]');
      setSelectedFile(null);
      setPreviewFileUrl(null);
    } else {
      // Reset all fields for new figure form
      setName('');
      setDescription('');
      setPhotoUrl('');
      setOccupation('');
      setGender('');
      setNationality('');
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
      setPerceptionCounts({ ...defaultPerceptionCounts });
      setAttitudeCounts({ ...defaultAttitudeCounts });
      setStarRatingCounts({ ...defaultStarRatingCounts });
      setFamilyMembersJson('[]');
      setSelectedFile(null);
      setPreviewFileUrl(null);
    }
  }, [initialData]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewFileUrl(URL.createObjectURL(file));
      setPhotoUrl(''); 
    } else {
      setSelectedFile(null);
      setPreviewFileUrl(null);
    }
  };

  const uploadFileToFirebaseStorage = async (file: File, figureDocId: string): Promise<string> => {
    const storageRef = ref(storage, `figures/${figureDocId}/${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (uploadError: any) {
      throw uploadError; 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!isAuthReady) {
      setError("La autenticación no está lista. Por favor, espera un momento o recarga la página.");
      setIsLoading(false);
      return;
    }

    let figureDocId = initialData?.id || slugify(name.trim(), { lower: true, strict: true });

    try {
      if (!name.trim()) {
        throw new Error('El nombre de la figura es obligatorio.');
      }
      if (!figureDocId) { 
         figureDocId = slugify(name.trim(), { lower: true, strict: true });
         if(!figureDocId) throw new Error('No se pudo generar un ID para la figura.');
      }
      
      let finalPhotoUrlToSave = photoUrl.trim();
      

      if (selectedFile) {
        try {
          finalPhotoUrlToSave = await uploadFileToFirebaseStorage(selectedFile, figureDocId);
        } catch (uploadError: any) {
          setError(`Error al subir la imagen: ${uploadError.message}.`);
          setIsLoading(false);
          return;
        }
      } else if (!finalPhotoUrlToSave && initialData?.photoUrl) {
        finalPhotoUrlToSave = initialData.photoUrl;
      } else if (!finalPhotoUrlToSave && !initialData?.photoUrl && !selectedFile) {
        finalPhotoUrlToSave = 'https://placehold.co/400x600.png';
      }

      let parsedFamilyMembers: FamilyMember[] = [];
      try {
        parsedFamilyMembers = JSON.parse(familyMembersJson);
        if (!Array.isArray(parsedFamilyMembers)) {
          throw new Error("El JSON de miembros de la familia debe ser un array.");
        }
        // Aquí podrías añadir validación más detallada para cada objeto FamilyMember si es necesario.
      } catch (jsonError: any) {
        setError(`Error en el formato JSON de Miembros de la Familia: ${jsonError.message}`);
        setIsLoading(false);
        return;
      }


      const figureData: Omit<Figure, 'id' | 'createdAt'> & { createdAt?: any; familyMembers?: FamilyMember[] } = { 
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        description: description.trim() || initialData?.description || "", 
        photoUrl: finalPhotoUrlToSave,
        nationality: nationality.trim(),
        occupation: occupation.trim(),
        gender: gender.trim(),
        
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

        perceptionCounts: perceptionCounts || { ...defaultPerceptionCounts },
        attitudeCounts: attitudeCounts || { ...defaultAttitudeCounts },
        starRatingCounts: starRatingCounts || { ...defaultStarRatingCounts },
        familyMembers: parsedFamilyMembers,
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
          router.push(`/figures/${figureDocId}`);
        } else { 
          router.push('/admin/figures');
        }
        router.refresh(); 
      }, 1500);

    } catch (err: any) {
      console.error("ERROR en handleSubmit:", err);
      setError(err.message || 'Error al guardar la figura.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPreviewUrl = previewFileUrl || (photoUrl.trim() ? photoUrl.trim() : initialData?.photoUrl || null);

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
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Escribe una breve descripción de la figura."
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="photoUrl">URL de la Imagen (Opcional)</Label>
        <Input
          id="photoUrl"
          type="url"
          value={photoUrl} 
          onChange={(e) => {
            setPhotoUrl(e.target.value);
            setSelectedFile(null);
            setPreviewFileUrl(null);
          }}
          placeholder="Ej: https://upload.wikimedia.org/..."
          className="mb-2"
        />
        <p className="text-sm text-muted-foreground">
          Pega la URL de una imagen externa. Dominios permitidos: Wikimedia, Wikia, Placehold.co, Firebase Storage, Pinterest, etc. Si también seleccionas un archivo, se priorizará el archivo subido.
        </p>
        
        {currentPreviewUrl ? (
          <div className="relative w-40 h-60 border rounded-md overflow-hidden bg-muted flex items-center justify-center mt-2" data-ai-hint="image preview">
            <Image
              src={currentPreviewUrl}
              alt="Previsualización de la imagen"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        ) : (
           <div className="relative w-40 h-60 border rounded-md overflow-hidden bg-muted flex items-center justify-center mt-2 text-muted-foreground" data-ai-hint="placeholder abstract">
             <ImageOff className="h-16 w-16" />
             <span>Sin Imagen</span>
           </div>
        )}
      </div>

      <div className="mt-4 border-t pt-4 border-border">
        <Label htmlFor="fileInput">Subir Nueva Foto (Opcional)</Label>
        <Input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Sube una imagen para la figura. Esto tendrá prioridad sobre la URL de la imagen.
        </p>
      </div>

      <h3 className="text-lg font-semibold mt-6 border-t pt-4 border-border">Información Detallada</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor="alias">Alias / Apodos</Label><Input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej: El Sabio, Princesa de Fuego" /></div>
        <div><Label htmlFor="species">Especie / Raza</Label><Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Ej: Demonio, Humano" /></div>
        <div><Label htmlFor="firstAppearance">Primera Aparición</Label><Input id="firstAppearance" value={firstAppearance} onChange={(e) => setFirstAppearance(e.target.value)} placeholder="Ej: High School DxD, Novela Ligera, 2008" /></div>
        <div><Label htmlFor="birthDateOrAge">Fecha de Nacimiento / Edad</Label><Input id="birthDateOrAge" value={birthDateOrAge} onChange={(e) => setBirthDateOrAge(e.target.value)} placeholder="Ej: Desconocida / Apariencia de 18 años" /></div>
        <div><Label htmlFor="birthPlace">Lugar de Nacimiento</Label><Input id="birthPlace" value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="Ej: Inframundo, Japón" /></div>
        <div><Label htmlFor="nationality">Nacionalidad</Label><Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Ej: Estadounidense, Peruano" /></div>
        <div><Label htmlFor="occupation">Ocupación/Profesión</Label><Input id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ej: Científico, Futbolista" /></div>
        <div><Label htmlFor="gender">Género</Label><Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Ej: Masculino, Femenino" /></div>
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
        <Label htmlFor="familyMembersJson" className="flex items-center gap-2 text-lg font-semibold">
          <Users2 className="h-5 w-5" /> Miembros de la Familia (JSON)
        </Label>
        <Textarea
          id="familyMembersJson"
          value={familyMembersJson}
          onChange={(e) => setFamilyMembersJson(e.target.value)}
          placeholder='Ej: [{"id": "fm1", "name": "Nombre Padre", "relationship": "Padre", "figureId": "id-del-padre-si-existe"}]'
          rows={8}
          className="mt-1 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ingresa un array de objetos JSON. Cada objeto debe tener: `id` (string, único), `name` (string), `relationship` (string), `figureId` (opcional, string), `photoUrl` (opcional, string).
        </p>
         <p className="text-xs text-muted-foreground mt-1">
          Ejemplo de relación: "Padre", "Madre", "Abuelo paterno", "Abuela paterna", "Abuelo materno", "Abuela materna", "Hijo/a", "Hermano/a", "Tío (Paterno)", "Tía (Paterna)", "Tío (Materno)", "Tía (Materna)".
        </p>
      </div>

      <Button type="submit" className="w-full mt-6" disabled={isLoading || !isAuthReady}>
        {isLoading ? 'Guardando...' : (initialData?.id ? 'Actualizar Figura' : 'Crear Figura')}
      </Button>
    </form>
  );
};

export default FigureForm;
