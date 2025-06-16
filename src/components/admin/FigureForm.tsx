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
import { Terminal } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; 
import type { Figure, EmotionKey, AttitudeKey } from '@/lib/types';
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
  neutral: 0,
  fan: 0,
  simp: 0,
  hater: 0,
};

const FigureForm: React.FC<FigureFormProps> = ({ initialData }) => {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [nationality, setNationality] = useState(initialData?.nationality || '');
  const [perceptionCounts, setPerceptionCounts] = useState(initialData?.perceptionCounts || { ...defaultPerceptionCounts });
  const [attitudeCounts, setAttitudeCounts] = useState(initialData?.attitudeCounts || { ...defaultAttitudeCounts });


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
      setPerceptionCounts(initialData.perceptionCounts || { ...defaultPerceptionCounts });
      setAttitudeCounts(initialData.attitudeCounts || { ...defaultAttitudeCounts });
      setSelectedFile(null);
      setPreviewFileUrl(null);
    } else {
      setName('');
      setDescription('');
      setPhotoUrl('');
      setOccupation('');
      setGender('');
      setNationality('');
      setPerceptionCounts({ ...defaultPerceptionCounts });
      setAttitudeCounts({ ...defaultAttitudeCounts });
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
      if (!figureDocId) { // Ensure figureDocId is generated if it was an empty name initially
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


      const figureData: Omit<Figure, 'id' | 'createdAt'> & { createdAt?: any } = { 
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        description: description.trim() || initialData?.description || "", 
        photoUrl: finalPhotoUrlToSave,
        occupation: occupation.trim(),
        gender: gender.trim(),
        nationality: nationality.trim(),
        perceptionCounts: perceptionCounts || { ...defaultPerceptionCounts },
        attitudeCounts: attitudeCounts || { ...defaultAttitudeCounts },
      };

      if (!initialData?.id) { 
        figureData.createdAt = serverTimestamp();
      }


      const figureRef = doc(db, 'figures', figureDocId);

      await setDoc(figureRef, figureData, { merge: true });

      setSuccess(`Figura "${name}" guardada exitosamente.`);
      
      setTimeout(() => {
        if (initialData?.id) { // If updating, go to admin figures list
          router.push('/admin/figures');
        } else { // If creating new, go to the public figure page
          router.push(`/figures/${figureDocId}`);
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
          placeholder="Ej: https://upload.wikimedia.org/wikipedia/commons/..."
          className="mb-2"
        />
        <p className="text-sm text-muted-foreground">
          Pega la URL de una imagen externa. Si también seleccionas un archivo, se priorizará el archivo subido.
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
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-3-4-5.4-4-1.2 0-2.3.5-3.2 1.2M4.8 9A5.5 5.5 0 0 0 10 14.5c0 1.2-.3 2.3-.8 3.2M14.5 19c-1.2.8-2.5 1-3.9.7-2.4-.6-4-3-4-5.4 0-1.2.5-2.3 1.2-3.2M9 4.5c.8-.7 1.9-1.2 3.2-1.2 2.4.6 4 3 4 5.4 0 1.2-.5 2.3-1.2 3.2M2 22l20-20"/></svg>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t pt-4 border-border">
        <div>
          <Label htmlFor="nationality">Nacionalidad</Label>
          <Input
            id="nationality"
            type="text"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Ej: Estadounidense, Peruano"
          />
        </div>
        <div>
          <Label htmlFor="occupation">Ocupación/Profesión</Label>
          <Input
            id="occupation"
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Ej: Científico, Futbolista"
          />
        </div>
        <div>
          <Label htmlFor="gender">Género</Label>
          <Input
            id="gender"
            type="text"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder="Ej: Masculino, Femenino"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !isAuthReady}>
        {isLoading ? 'Guardando...' : (initialData?.id ? 'Actualizar Figura' : 'Crear Figura')}
      </Button>
    </form>
  );
};

export default FigureForm;
