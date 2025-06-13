
'use server';

import { db } from '@/lib/firebase';
import type { UserRating, Figure, PerceptionKeys } from '@/lib/types';
import { doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';

// Get a user's perception for a specific figure
export async function getUserPerception(userId: string, figureId: string): Promise<UserRating | null> {
  if (!userId || !figureId) return null;
  try {
    const ratingDocId = `${userId}_${figureId}`;
    const ratingRef = doc(db, 'userRatings', ratingDocId);
    const ratingSnap = await getDoc(ratingRef);
    if (ratingSnap.exists()) {
      // Ensure we cast to UserRating, which no longer expects 'stars' from this collection
      return { id: ratingSnap.id, ...ratingSnap.data() } as Omit<UserRating, 'stars'> & { perception: PerceptionKeys, timestamp: string };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user perception:', error);
    return null;
  }
}

// Submit or update a user's perception for a figure
export async function submitUserPerception(
  userId: string,
  figureId: string,
  perception: PerceptionKeys
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId) {
    return { success: false, message: 'Figure ID is missing.' };
  }
  if (!perception) {
    return { success: false, message: 'Perception is required.'};
  }

  const userRatingRef = doc(db, 'userRatings', `${userId}_${figureId}`);
  const figureRef = doc(db, 'figures', figureId);

  try {
    await runTransaction(db, async (transaction) => {
      const figureDoc = await transaction.get(figureRef);
      if (!figureDoc.exists()) {
        throw new Error(`Figure with ID ${figureId} not found. Cannot submit perception.`);
      }
      const figureData = figureDoc.data() as Figure;

      const previousUserRatingDoc = await transaction.get(userRatingRef);
      const previousPerception = previousUserRatingDoc.exists() ? (previousUserRatingDoc.data() as UserRating).perception : null;

      const newPerceptionData: Omit<UserRating, 'id'> = { // id is doc name
        userId,
        figureId,
        perception,
        timestamp: new Date().toISOString(),
      };
      transaction.set(userRatingRef, newPerceptionData);

      const currentPerceptionCounts = { ...(figureData.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 }) };

      if (previousPerception && previousPerception !== perception) {
        currentPerceptionCounts[previousPerception] = Math.max(0, (currentPerceptionCounts[previousPerception] || 0) - 1);
      }
      
      if (previousPerception !== perception) {
         currentPerceptionCounts[perception] = (currentPerceptionCounts[perception] || 0) + 1;
      }
      
      // Only update perceptionCounts. averageRating and totalRatings are handled by comments with stars.
      transaction.update(figureRef, {
        perceptionCounts: currentPerceptionCounts,
      });
    });

    return { success: true, message: 'Perception submitted and aggregates updated.' };
  } catch (error: any) {
    console.error('Error submitting perception or updating aggregates:', error.code, error.message, error);
    let message = 'Failed to submit perception. Please try again.';
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
        message = 'Failed to submit perception due to insufficient permissions. Please check your Firestore Security Rules.';
    } else if (error.message && error.message.toLowerCase().includes('not found')) {
        message = `Failed to submit perception: The figure could not be found. ${error.message}`;
    }
    return { success: false, message: message };
  }
}
