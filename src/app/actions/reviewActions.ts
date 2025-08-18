
'use server';

import { db, auth as clientAuth } from '@/lib/firebase'; // Renamed auth to clientAuth to avoid conflict
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Review } from '@/lib/types';
import { getCurrentUser } from './userActions';
import { headers } from 'next/headers';
import { ADMIN_UID } from '@/config/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';

interface AddReviewResult {
  success: boolean;
  message: string;
}

// The function now accepts an optional authToken for client-side calls
export async function addReview(
  characterId: string,
  comment: string,
  idToken?: string // Accepting the token directly
): Promise<AddReviewResult> {
  
  let decodedToken: DecodedIdToken | null = null;
  if (idToken) {
    try {
      // We need to initialize admin auth here to verify the token
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Error verifying ID token in addReview:", error);
      return { success: false, message: 'Token de autenticación inválido.' };
    }
  }

  const user = await getCurrentUser(decodedToken ?? undefined);

  if (!user) {
    return { success: false, message: 'Debes estar autenticado para dejar una reseña.' };
  }

  if (!comment || comment.trim().length < 5) {
    return { success: false, message: 'El comentario debe tener al menos 5 caracteres.' };
  }
   if (comment.trim().length > 1000) {
    return { success: false, message: 'El comentario no puede exceder los 1000 caracteres.' };
  }

  try {
    await addDoc(collection(db, 'reviews'), {
      characterId: characterId,
      userId: user.uid,
      username: user.username,
      userPhotoUrl: user.photoURL || null,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
      likes: [],
      replyCount: 0,
    });

    revalidatePath(`/figures/${characterId}`);
    return { success: true, message: 'Tu reseña ha sido publicada.' };
  } catch (error: any) {
    console.error('Error adding review:', error);
    return { success: false, message: `No se pudo publicar tu reseña. ${error.message}` };
  }
}

interface DeleteReviewResult {
    success: boolean;
    message: string;
}

export async function deleteReview(reviewId: string, idToken?: string): Promise<DeleteReviewResult> {
    
    let decodedToken: DecodedIdToken | null = null;
    if (idToken) {
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Error verifying ID token in deleteReview:", error);
            return { success: false, message: 'Token de autenticación inválido.' };
        }
    }
    
    const user = await getCurrentUser(decodedToken ?? undefined);
    
    if (!user) {
        return { success: false, message: "No estás autenticado." };
    }

    try {
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewSnap = await getDoc(reviewRef);

        if (!reviewSnap.exists()) {
            return { success: false, message: "La reseña no existe." };
        }

        const reviewData = reviewSnap.data();

        // Check permissions: user must be the author or an admin.
        if (reviewData.userId !== user.uid && user.role !== 'admin') {
            return { success: false, message: "No tienes permiso para eliminar esta reseña." };
        }

        await deleteDoc(reviewRef);

        revalidatePath(`/figures/${reviewData.characterId}`);
        return { success: true, message: "Reseña eliminada correctamente." };

    } catch (error: any) {
        console.error("Error deleting review:", error);
        return { success: false, message: `Ocurrió un error al eliminar la reseña. ${error.message}` };
    }
}
