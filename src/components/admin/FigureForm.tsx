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
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; // Importa onAuthStateChanged
import { Figure } from '@/lib/types';

interface FigureFormProps {
  initialFigure?: Figure;
}

const FigureForm: React.FC<FigureFormProps> = ({ initialFigure }) => {
  const router = useRouter();
  const [name, setName] = useState(initialFigure?.name || '');
  const [description, setDescription] = useState(initialFigure?.description || '');
  const [photoUrl, setPhotoUrl] = useState(initialFigure?.photoUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);

  const [country, setCountry] = useState(initialFigure?.country || '');
  const [occupation, setOccupation] = useState(initialFigure?.occupation || '');
  const [gender, setGender] = useState(initialFigure?.gender || '');
  const [nationality, setNationality] = useState(initialFigure?.nationality || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAuthReady, setIsAuthReady] = useState(false); // Estado para saber si la autenticación está lista

  // Efecto para asegurar la autenticación al cargar el componente
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
      setIsAuthReady(true); // La autenticación ha sido chequeada/establecida
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, []); // Se ejecuta solo una vez al montar

  // Efecto para sincronizar el estado del formulario con initialFigure al cargar o cambiar.
  useEffect(() => {
    console.log("FigureForm useEffect [initialFigure] - Ejecutado.");
    console.log("FigureForm useEffect [initialFigure] - initialFigure al inicio:", initialFigure);
    console.log("FigureForm useEffect [initialFigure] - initialFigure.photoUrl al inicio:", initialFigure?.photoUrl);

    if (initialFigure) {
      setName(initialFigure.name);
      setDescription(initialFigure.description);
      setPhotoUrl(initialFigure.photoUrl || ''); 
      setCountry(initialFigure.country || '');
      setOccupation(initialFigure.occupation || '');
      setGender(initialFigure.gender || '');
      setNationality(initialFigure.nationality || '');

      setSelectedFile(null);
      setPreviewFileUrl(null);
    } else {
      setName('');
      setDescription('');
      setPhotoUrl('');
      setCountry('');
      setOccupation('');
      setGender('');
      setNationality('');

      setSelectedFile(null);
      setPreviewFileUrl(null);
    }
    console.log("FigureForm useEffect [initialFigure] - Estado photoUrl final:", photoUrl);
  }, [initialFigure]);

  // Manejador para la selección de archivo local
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setPreviewFileUrl(URL.createObjectURL(file));
      setPhotoUrl(''); // Borra la URL del campo de texto si se selecciona un archivo local
    } else {
      setSelectedFile(null);
      setPreviewFileUrl(null);
    }
  };

  /**
   * Función para subir un archivo a Firebase Storage.
   * @param {File} file - El archivo a subir.
   * @param {string} figureDocId - El ID del documento de la figura (para la ruta en Storage).
   * @returns {Promise<string>} La URL de descarga del archivo.
   */
  const uploadFileToFirebaseStorage = async (file: File, figureDocId: string): Promise<string> => {
    console.log("Iniciando subida de archivo a Storage...");
    const storageRef = ref(storage, `figures/${figureDocId}/${file.name}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      console.log("Archivo subido a Storage exitosamente. Snapshot:", snapshot);
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("URL de descarga obtenida:", downloadURL);
      return downloadURL;
    } catch (uploadError: any) {
      console.error("ERROR CRÍTICO en uploadFileToFirebaseStorage:", uploadError);
      throw uploadError; // Re-lanza el error para que sea capturado en handleSubmit
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Asegurarse de que la autenticación está lista antes de proceder
    if (!isAuthReady) {
      setError("La autenticación no está lista. Por favor, espera un momento o recarga la página.");
      setIsLoading(false);
      return;
    }

    try {
      if (!name.trim()) {
        throw new Error('El nombre de la figura es obligatorio.');
      }

      const figureDocId = initialFigure?.id || slugify(name.trim(), { lower: true, strict: true });
      let finalPhotoUrlToSave = photoUrl.trim();


      // Lógica de subida de archivo a Firebase Storage
      if (selectedFile) {
        console.log("Archivo local seleccionado. Intentando subir a Storage...");
        try {
          finalPhotoUrlToSave = await uploadFileToFirebaseStorage(selectedFile, figureDocId);
          console.log("URL final del archivo subido:", finalPhotoUrlToSave);
        } catch (uploadError: any) {
          // El error ya se logueó en uploadFileToFirebaseStorage
          setError(`Error al subir la imagen: ${uploadError.message}.`);
          setIsLoading(false);
          return;
        }
      } else if (!finalPhotoUrlToSave && initialFigure?.photoUrl) {
        finalPhotoUrlToSave = initialFigure.photoUrl;
      } else if (!finalPhotoUrlToSave && !initialFigure?.photoUrl) {
        // Si no hay URL final y no es edición, y no se subió un archivo, se puede poner un placeholder.
        // O dejar vacío, dependiendo de la lógica de tu app.
        // finalPhotoUrlToSave = 'https://placehold.co/400x400/eeeeee/cccccc?text=No+Image';
      }


      const figureData = {
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        description: description.trim(),
        photoUrl: finalPhotoUrlToSave,
        createdAt: initialFigure?.createdAt || serverTimestamp(),
        country: country.trim(),
        occupation: occupation.trim(),
        gender: gender.trim(),
        nationality: nationality.trim(),
        averageRating: initialFigure?.averageRating || 0,
        totalRatings: initialFigure?.totalRatings || 0,
      };

      const figureRef = doc(db, 'figures', figureDocId);

      await setDoc(figureRef, figureData, { merge: true });

      setSuccess(`Figura "${name}" guardada exitosamente.`);
      
      setTimeout(() => {
        router.push('/admin/figures');
      }, 1500);

    } catch (err: any) {
      console.error("ERROR en handleSubmit:", err);
      setError(err.message || 'Error al guardar la figura.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPreviewUrl = previewFileUrl || (photoUrl.trim() ? photoUrl.trim() : initialFigure?.photoUrl || null);
  const isWikimediaUrl = currentPreviewUrl && currentPreviewUrl.includes('wikimedia.org');

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
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

      {/* ... (resto del formulario sin cambios) */}

      {/* Campo Nombre de la Figura */}
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

      {/* Campo Descripción */}
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

      {/* Campo de URL de Imagen */}
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
        <p className="text-sm text-gray-500">
          Pega la URL de una imagen externa. Si también seleccionas un archivo, se priorizará el archivo subido. Si se deja vacío en la creación, se usará una imagen por defecto.
        </p>
        
        {currentPreviewUrl && (
          <div className="relative w-48 h-48 border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center mt-4">
            <Image
              src={currentPreviewUrl}
              alt="Previsualización de la imagen"
              fill
              className="object-contain"
              sizes="200px"
              priority
            />
            <p className="absolute bottom-1 left-1 right-1 text-xs text-red-500 bg-white/70 p-1 rounded-sm text-center break-all">
              URL: {currentPreviewUrl}
              {isWikimediaUrl && <span className="block text-green-700"> (Wikimedia)</span>}
            </p>
          </div>
        )}
        {!currentPreviewUrl && (
          <div className="relative w-48 h-48 border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center mt-4 text-gray-400 text-6xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image-off"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10 4V2H6C4.9 2 4 2.9 4 4V6H2"/><path d="M14 20v2h4c1.1 0 2-0.9 2-2v-2h2"/><path d="M8 10v.01"/><path d="M16 16v.01"/><path d="M10 14L4 8"/><path d="M12.5 6.5l4 4"/><path d="M22 14v-2c0-1.1-0.9-2-2-2h-2"/><path d="M16 22H6c-1.1 0-2-0.9-2-2v-6"/></svg>
          </div>
        )}
      </div>

      {/* Campo de Subida de Archivo (AHORA FUNCIONAL) */}
      <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-700">
        <Label htmlFor="fileInput">Subir Foto (Opcional)</Label>
        <Input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Sube una imagen para la figura. Esto tendrá prioridad sobre la URL de la imagen.
        </p>
      </div>

      {/* Nuevos Campos de Filtro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
        <div>
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Ej: Alemania, Estados Unidos"
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
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </form>
  );
};

export default FigureForm;
