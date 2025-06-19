
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { GalleryImage } from '@/lib/types';

// Nota: Debes obtener estos dominios de tu next.config.ts o mantener una lista sincronizada.
const ALLOWED_IMAGE_DOMAINS = [
  'placehold.co', 
  'firebasestorage.googleapis.com', 
  'upload.wikimedia.org', 
  'static.wikia.nocookie.net', 
  'i.pinimg.com',
  'encrypted-tbn0.gstatic.com',
  'm.media-amazon.com'
  // Añade aquí otros dominios si los tienes en next.config.ts
];

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:',].includes(parsedUrl.protocol)) {
      return false;
    }
    // Verifica si el hostname termina con alguno de los dominios permitidos.
    // Esto maneja subdominios (e.g., a.b.example.com es permitido si example.com está en la lista)
    return ALLOWED_IMAGE_DOMAINS.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain));
  } catch (e) {
    return false; // URL inválida si no se puede parsear
  }
}

export async function submitGalleryImageAction(
  figureId: string,
  imageUrl: string,
  userId: string,
  username?: string | null
): Promise<{ success: boolean; message: string }> {
  if (!figureId || !imageUrl || !userId) {
    return { success: false, message: 'Faltan datos necesarios (ID de figura, URL de imagen o ID de usuario).' };
  }

  if (!isValidImageUrl(imageUrl)) {
    return { 
      success: false, 
      message: `La URL de la imagen no es válida o no pertenece a un dominio permitido. Dominios permitidos: ${ALLOWED_IMAGE_DOMAINS.join(', ')}`
    };
  }

  try {
    const galleryImagesCollectionRef = collection(db, `figures/${figureId}/galleryImages`);
    
    const newImageData: Omit<GalleryImage, 'id'> = {
      imageUrl,
      userId,
      username: username || 'Usuario Anónimo',
      createdAt: serverTimestamp() as any, // Cast to any because serverTimestamp() is a sentinel
    };

    await addDoc(galleryImagesCollectionRef, newImageData);

    revalidatePath(`/figures/${figureId}`);
    return { success: true, message: 'Imagen añadida a la galería exitosamente.' };

  } catch (error: any) {
    console.error('Error al añadir imagen a la galería:', error);
    return { success: false, message: `No se pudo añadir la imagen. ${error.message}` };
  }
}
