
'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function toggleFigureSupport(
  figureId: string,
  userId: string,
): Promise<{ success: boolean; message: string; newStatus?: boolean; }> {
  if (!figureId || !userId) {
    return { success: false, message: 'Información incompleta.' };
  }

  const figureRef = doc(db, 'figures', figureId);
  const supportRef = doc(db, 'userSupports', `${userId}_${figureId}`);

  try {
    let newStatus = false;
    await runTransaction(db, async (transaction) => {
      const supportDoc = await transaction.get(supportRef);
      
      if (supportDoc.exists()) {
        // User is un-supporting
        transaction.delete(supportRef);
        transaction.update(figureRef, { supportCount: increment(-1) });
        newStatus = false;
      } else {
        // User is supporting
        transaction.set(supportRef, { userId, figureId, timestamp: serverTimestamp() });
        transaction.update(figureRef, { supportCount: increment(1) });
        newStatus = true;
      }
    });

    revalidatePath(`/figures/${figureId}`);
    
    return { success: true, message: 'Apoyo actualizado.', newStatus };
  } catch (error: any) {
    console.error('Error toggling figure support:', error);
    return { success: false, message: `Error al actualizar apoyo: ${error.message}` };
  }
}
