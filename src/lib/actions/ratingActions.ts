
'use server';

import { db } from '@/lib/firebase';
import type { UserRating, Figure, PerceptionKeys } from '@/lib/types';
import { doc, getDoc, runTransaction, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';

// Obtener la percepción actual de un usuario para una figura específica
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
      } as UserRating;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user perception:', error);
    // No lanzar error, simplemente devolver null para que la UI pueda manejarlo
    return null;
  }
}

// Enviar, actualizar o deseleccionar la percepción de un usuario para una figura.
// newPerception puede ser una PerceptionKeys o null (para deseleccionar).
export async function submitOrUpdateUserPerception(
  userId: string,
  figureId: string,
  newPerception: PerceptionKeys | null
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId) {
    return { success: false, message: 'Figure ID is missing.' };
  }
  // newPerception puede ser null, lo cual es válido para deseleccionar.

  const userRatingRef = doc(db, 'userRatings', `${userId}_${figureId}`);
  const figureRef = doc(db, 'figures', figureId);

  try {
    await runTransaction(db, async (transaction) => {
      const figureDocSnap = await transaction.get(figureRef);
      if (!figureDocSnap.exists()) {
        throw new Error(`Figure with ID ${figureId} not found. Cannot submit perception.`);
      }
      const figureData = figureDocSnap.data() as Figure;
      const currentPerceptionCounts = { ...(figureData.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 }) };

      const userRatingSnap = await transaction.get(userRatingRef);
      const oldPerception = userRatingSnap.exists() ? (userRatingSnap.data() as UserRating).perception : null;

      // Si la nueva percepción es la misma que la antigua (y no es null), no hacer nada.
      // Si el usuario hace clic en un botón ya activo, y la lógica es deseleccionar, newPerception será null.
      if (newPerception === oldPerception && newPerception !== null) {
        // No hay cambios reales en la percepción, pero actualizamos el timestamp.
        transaction.update(userRatingRef, { timestamp: serverTimestamp() });
        return; // No es necesario actualizar contadores si la percepción no cambia.
      }
      
      // Decrementar el contador de la percepción anterior si existía
      if (oldPerception) {
        currentPerceptionCounts[oldPerception] = Math.max(0, (currentPerceptionCounts[oldPerception] || 0) - 1);
      }

      if (newPerception === null) { // Deseleccionando
        if (userRatingSnap.exists()) {
          transaction.delete(userRatingRef);
        }
      } else { // Seleccionando una nueva percepción (o cambiando una existente)
        currentPerceptionCounts[newPerception] = (currentPerceptionCounts[newPerception] || 0) + 1;
        const newPerceptionData: Omit<UserRating, 'id' | 'timestamp'> & { timestamp: any } = {
          userId,
          figureId,
          perception: newPerception,
          timestamp: serverTimestamp(),
        };
        // Usar set sin merge para asegurar que solo los campos definidos se guarden (elimina 'stars' si existía)
        transaction.set(userRatingRef, newPerceptionData);
      }
      
      transaction.update(figureRef, { perceptionCounts: currentPerceptionCounts });
    });

    return { success: true, message: newPerception ? 'Perception submitted.' : 'Perception removed.' };
  } catch (error: any) {
    console.error('Error submitting perception or updating figure aggregates:', error);
    let message = 'Failed to submit perception.';
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes('permission'))) {
      message = 'Failed to submit perception due to insufficient permissions.';
    } else if (error.message && String(error.message).toLowerCase().includes('not found')) {
      message = `Failed to submit perception: The figure could not be found.`;
    }
    return { success: false, message: message };
  }
}
