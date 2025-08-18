
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Review } from '@/lib/types';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getCurrentUser } from './userActions';

// The function now accepts an optional DecodedIdToken.
// When called from our secure API route, it will have the token.
// When called from other server components (if any), it will use the header-based method.
export async function deleteReview(
  reviewId: string, 
  figureId: string,
  decodedToken?: DecodedIdToken
): Promise<{ success: boolean; message: string }> {
  if (!reviewId) {
    return { success: false, message: 'ID de reseña no proporcionado.' };
  }

  const reviewRef = doc(db, 'reviews', reviewId);
  
  try {
    const currentUser = await getCurrentUser(decodedToken); // Pass the token here
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
