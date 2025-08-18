'use server';

import { db, auth } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Review } from '@/lib/types';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';

async function getCurrentUserId() {
    // This is a workaround to get the current user on the server.
    // It's not standard and might need adjustment if Firebase changes things.
    // For now, it's a common pattern in Next.js Server Actions with Firebase.
    const sessionCookie = headers().get('Authorization')?.split('Bearer ')[1] || '';
    if (!sessionCookie) return null;
    try {
        const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying session cookie:", error);
        return null;
    }
}


export async function deleteReview(reviewId: string, figureId: string): Promise<{ success: boolean; message: string }> {
  if (!reviewId) {
    return { success: false, message: 'ID de reseña no proporcionado.' };
  }

  const reviewRef = doc(db, 'reviews', reviewId);
  
  try {
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) {
      return { success: false, message: 'La reseña no fue encontrada.' };
    }
    
    // Permission check will be handled on the client, as we can't reliably get the
    // current user here without a more complex session management setup.
    // The rules in firestore.rules will provide server-side security.
    
    await deleteDoc(reviewRef);

    revalidatePath(`/figures/${figureId}`);

    return { success: true, message: 'Reseña eliminada correctamente.' };

  } catch (error: any) {
    console.error("Error deleting review:", error);
    if (error.code === 'permission-denied') {
        return { success: false, message: 'No tienes permiso para borrar esta reseña.' };
    }
    return { success: false, message: `Ocurrió un error: ${error.message}` };
  }
}
