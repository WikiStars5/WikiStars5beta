
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { GalleryImage } from '@/lib/types';
import { correctMalformedUrl } from '@/lib/utils'; // Import the helper function

// Nota: Debes obtener estos dominios de tu next.config.ts o mantener una lista sincronizada.
const ALLOWED_IMAGE_DOMAINS = [
  'placehold.co', 
  'firebasestorage.googleapis.com', 
  'wikimedia.org', // Permitir el dominio base para cubrir subdominios como upload, commons, etc.
  'static.wikia.nocookie.net', 
  'pinimg.com', // Base domain for i.pinimg.com, etc.
  'flagcdn.com'
];

function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:',].includes(parsedUrl.protocol)) {
      return false;
    }
    return ALLOWED_IMAGE_DOMAINS.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain));
  } catch (e) {
    return false; 
  }
}

export async function submitGalleryImageAction(
  figureId: string,
  imageUrl: string,
  userId: string,
  username?: string | null
): Promise<{ success: boolean; message: string }> {
  console.log('[submitGalleryImageAction] Received data:', { figureId, imageUrl, userId, username });

  // Correct the URL before validation and saving
  const correctedImageUrl = correctMalformedUrl(imageUrl);

  if (!figureId || !correctedImageUrl || !userId) {
    const missingFields = [];
    if (!figureId) missingFields.push('figureId');
    if (!correctedImageUrl) missingFields.push('imageUrl');
    if (!userId) missingFields.push('userId');
    const errorMessage = `Faltan datos necesarios: ${missingFields.join(', ')}.`;
    console.error('[submitGalleryImageAction] Validation Error:', errorMessage);
    return { success: false, message: errorMessage };
  }

  if (!isValidImageUrl(correctedImageUrl)) {
    const errorMessage = `La URL de la imagen no es válida o no pertenece a un dominio permitido. Dominios permitidos: ${ALLOWED_IMAGE_DOMAINS.join(', ')}. URL proporcionada: ${correctedImageUrl}`;
    console.error('[submitGalleryImageAction] URL Validation Error:', errorMessage);
    return { 
      success: false, 
      message: errorMessage
    };
  }

  try {
    const subCollectionPath = `figures/${figureId}/galleryImages`;
    console.log('[submitGalleryImageAction] Attempting to add document to subcollection:', subCollectionPath);
    const galleryImagesCollectionRef = collection(db, subCollectionPath);
    
    const newImageData: Omit<GalleryImage, 'id'> = {
      imageUrl: correctedImageUrl, // Save the corrected URL
      userId,
      username: username || 'Usuario Anónimo',
      createdAt: serverTimestamp() as any, 
    };

    console.log('[submitGalleryImageAction] Data to be added:', newImageData);
    await addDoc(galleryImagesCollectionRef, newImageData);
    console.log('[submitGalleryImageAction] Document added successfully to subcollection:', subCollectionPath);

    revalidatePath(`/figures/${figureId}`);
    return { success: true, message: 'Imagen añadida a la galería exitosamente.' };

  } catch (error: any) {
    console.error('[submitGalleryImageAction] Firestore Error:', error);
    console.error('[submitGalleryImageAction] Firestore Error Code:', error.code);
    console.error('[submitGalleryImageAction] Firestore Error Message:', error.message);
    return { success: false, message: `No se pudo añadir la imagen a la galería. Error de Firestore: ${error.message} (Código: ${error.code})` };
  }
}
