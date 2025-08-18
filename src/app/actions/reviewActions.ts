
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Review } from '@/lib/types';
import { getCurrentUser } from '@/app/actions/userActions';


export async function deleteReview(reviewId: string, figureId: string): Promise<{ success: boolean; message: string }> {
  if (!reviewId) {
    return { success: false, message: 'ID de reseña no proporcionado.' };
  }

  const reviewRef = doc(db, 'reviews', reviewId);
  
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'No estás autenticado.' };
    }

    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) {
      return { success: false, message: 'La reseña no fue encontrada.' };
    }
    
    const reviewData = reviewSnap.data() as Review;
    
    const isOwner = reviewData.userId === currentUser.uid;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
        return { success: false, message: 'No tienes permiso para borrar esta reseña.' };
    }
    
    await deleteDoc(reviewRef);

    // This revalidation is now crucial because the trigger will update the figure doc
    revalidatePath(`/figures/${figureId}`);

    return { success: true, message: 'Reseña eliminada correctamente.' };

  } catch (error: any) {
    console.error("Error deleting review:", error);
    if (error.code === 'permission-denied') {
        return { success: false, message: 'Error de permisos de Firestore. Verifica tus reglas de seguridad.' };
    }
    return { success: false, message: `Ocurrió un error: ${error.message}` };
  }
}
