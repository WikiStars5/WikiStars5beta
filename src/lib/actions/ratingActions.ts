
'use server';

import { db } from '@/lib/firebase';
import type { UserRating, Figure, PerceptionKeys } from '@/lib/types';
import { doc, getDoc, runTransaction, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';

export async function getUserPerception(userId: string, figureId: string): Promise<UserRating | null> {
  if (!userId || !figureId) return null;
  try {
    const ratingDocId = `${userId}_${figureId}`;
    const ratingRef = doc(db, 'userRatings', ratingDocId);
    const ratingSnap = await getDoc(ratingRef);
    if (ratingSnap.exists()) {
      const data = ratingSnap.data();
      return {
        id: ratingSnap.id,
        userId: data.userId,
        figureId: data.figureId,
        perception: data.perception,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString(),
      } as UserRating; // No 'stars' field here
    }
    return null;
  } catch (error) {
    console.error('Error fetching user perception:', error);
    return null;
  }
}

export async function submitOrUpdateUserPerception(
  userId: string,
  figureId: string,
  newPerception: PerceptionKeys | null,
  oldPerceptionUserHad: PerceptionKeys | null 
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'Usuario no autenticado.' };
  }
  if (!figureId) {
    return { success: false, message: 'Falta el ID de la figura.' };
  }

  const userRatingRef = doc(db, 'userRatings', `${userId}_${figureId}`);
  const figureRef = doc(db, 'figures', figureId);

  try {
    await runTransaction(db, async (transaction) => {
      const figureDocSnap = await transaction.get(figureRef);
      if (!figureDocSnap.exists()) {
        throw new Error(`Figura con ID ${figureId} no encontrada. No se puede enviar la percepción.`);
      }
      const figureData = figureDocSnap.data() as Figure;
      const currentPerceptionCounts = { ...(figureData.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 }) };
      
      // La percepción anterior del usuario ya se pasa como argumento (oldPerceptionUserHad)
      // esto simplifica, ya que no necesitamos leer userRatingSnap dentro de la transacción para esto.

      // Decrementar el contador de la percepción anterior si existía y es diferente de la nueva
      if (oldPerceptionUserHad && oldPerceptionUserHad !== newPerception) {
        currentPerceptionCounts[oldPerceptionUserHad] = Math.max(0, (currentPerceptionCounts[oldPerceptionUserHad] || 0) - 1);
      }

      if (newPerception === null) { // Deseleccionando (el usuario hizo clic en la percepción ya activa)
        // Ya se decrementó arriba si oldPerceptionUserHad no era null.
        // Ahora borramos el documento de userRatings.
        transaction.delete(userRatingRef);
      } else { // Seleccionando una nueva percepción o cambiando una existente
        // Incrementar el contador de la nueva percepción si es diferente de la anterior
        if (newPerception !== oldPerceptionUserHad) {
           currentPerceptionCounts[newPerception] = (currentPerceptionCounts[newPerception] || 0) + 1;
        }
       
        const newPerceptionData: Omit<UserRating, 'id' | 'timestamp'> & { timestamp: any } = {
          userId,
          figureId,
          perception: newPerception,
          timestamp: serverTimestamp(),
        };
        transaction.set(userRatingRef, newPerceptionData); // Esto crea o sobrescribe el documento
      }
      
      transaction.update(figureRef, { perceptionCounts: currentPerceptionCounts });
    });

    let successMessage = 'Percepción enviada.';
    if (newPerception === null) {
        successMessage = 'Percepción eliminada.';
    } else if (oldPerceptionUserHad && newPerception !== oldPerceptionUserHad) {
        successMessage = 'Percepción actualizada.';
    }

    return { success: true, message: successMessage };

  } catch (error: any) {
    console.error('Error submitting perception or updating figure aggregates:', error);
    let message = 'Error al enviar la percepción.';
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes('permission'))) {
      message = 'Error al enviar la percepción debido a permisos insuficientes.';
    } else if (error.message && String(error.message).toLowerCase().includes('not found')) {
      message = `Error al enviar la percepción: No se pudo encontrar la figura.`;
    }
    return { success: false, message: message };
  }
}
