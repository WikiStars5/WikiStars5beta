
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

  if (!figureId || !imageUrl || !userId) {
    const missingFields = [];
    if (!figureId) missingFields.push('figureId');
    if (!imageUrl) missingFields.push('imageUrl');
    if (!userId) missingFields.push('userId');
    const errorMessage = `Faltan datos necesarios: ${missingFields.join(', ')}.`;
    console.error('[submitGalleryImageAction] Validation Error:', errorMessage);
    return { success: false, message: errorMessage };
  }

  if (!isValidImageUrl(imageUrl)) {
    const errorMessage = `La URL de la imagen no es válida o no pertenece a un dominio permitido. Dominios permitidos: ${ALLOWED_IMAGE_DOMAINS.join(', ')}. URL proporcionada: ${imageUrl}`;
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
      imageUrl,
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

