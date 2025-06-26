
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Figure } from '@/lib/types';
import { correctMalformedUrl } from '@/lib/utils';

const ADMIN_UID_FOR_MESSAGE = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

export async function toggleFigureFeaturedStatus(
  figureId: string
): Promise<{ success: boolean; newStatus?: boolean; message?: string }> {
  if (!figureId) {
    return { success: false, message: 'ID de figura no proporcionado.' };
  }

  const figureRef = doc(db, 'figures', figureId);

  try {
    const figureSnap = await getDoc(figureRef);
    if (!figureSnap.exists()) {
      return { success: false, message: 'Figura no encontrada.' };
    }

    const currentFigureData = figureSnap.data() as Figure;
    const newStatus = !(currentFigureData.isFeatured || false); // Ensure current is boolean

    await updateDoc(figureRef, {
      isFeatured: newStatus,
    });

    // Revalidate all relevant paths where featured figures might be displayed or listed
    revalidatePath('/admin/figures', 'page');
    revalidatePath('/home', 'page');
    revalidatePath('/figures', 'page');


    return { success: true, newStatus, message: `Figura ${newStatus ? 'marcada como destacada' : 'desmarcada como destacada'}.` };
  } catch (error: any) {
    console.error('Error toggling figure featured status:', error);
    let errorMessage = `Error al cambiar estado: ${error.message}`;
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes("permission"))) {
        errorMessage = `Error al cambiar estado: Permisos insuficientes. Verifica las Reglas de Seguridad de Firestore. Asegúrate de que el administrador (UID: ${ADMIN_UID_FOR_MESSAGE}) tenga permiso de 'write'.`;
    }
    return { success: false, message: errorMessage };
  }
}


export async function batchUpdateFigureImageUrls(): Promise<{ success: boolean; message: string; updatedCount?: number }> {
  try {
    const figuresCollectionRef = collection(db, 'figures');
    const querySnapshot = await getDocs(figuresCollectionRef);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No se encontraron figuras para procesar.', updatedCount: 0 };
    }

    const batch = writeBatch(db);
    let updatedCount = 0;

    querySnapshot.forEach(docSnap => {
      const figureData = docSnap.data() as Figure;
      const originalUrl = figureData.photoUrl;
      
      // Skip if URL is empty or null
      if (!originalUrl) {
          return;
      }

      const correctedUrl = correctMalformedUrl(originalUrl);

      if (originalUrl !== correctedUrl) {
        const figureRef = doc(db, 'figures', docSnap.id);
        batch.update(figureRef, { photoUrl: correctedUrl });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      // Revalidate paths where figures are listed
      revalidatePath('/admin/figures', 'page');
      revalidatePath('/figures', 'page');
      revalidatePath('/home', 'page');
      return { success: true, message: `Proceso completado. Se actualizaron ${updatedCount} URLs de imágenes.`, updatedCount };
    } else {
      return { success: true, message: 'No se encontraron URLs de imágenes mal formadas. ¡Todo está en orden!', updatedCount: 0 };
    }
  } catch (error: any) {
    console.error('Error during batch update of image URLs:', error);
    let errorMessage = `Error al procesar: ${error.message}`;
    if (error.code === 'permission-denied') {
      errorMessage = `Error de permisos. Asegúrate de que el administrador (UID: ${ADMIN_UID_FOR_MESSAGE}) tenga permisos de 'write' en la colección de figuras.`;
    }
    return { success: false, message: errorMessage };
  }
}
