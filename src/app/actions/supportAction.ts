
'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
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
      // Primero, obtenemos el documento de la figura para leer el contador actual.
      const figureDoc = await transaction.get(figureRef);
      if (!figureDoc.exists()) {
        throw new Error("La figura no existe.");
      }
      const currentSupportCount = figureDoc.data().supportCount || 0;
      
      const supportDoc = await transaction.get(supportRef);
      
      if (supportDoc.exists()) {
        // El usuario está quitando su apoyo
        transaction.delete(supportRef);
        // Calculamos manualmente el nuevo contador y lo actualizamos.
        transaction.update(figureRef, { supportCount: Math.max(0, currentSupportCount - 1) });
        newStatus = false;
      } else {
        // El usuario está dando su apoyo
        transaction.set(supportRef, { userId, figureId, timestamp: serverTimestamp() });
        // Calculamos manualmente el nuevo contador y lo actualizamos.
        transaction.update(figureRef, { supportCount: currentSupportCount + 1 });
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
