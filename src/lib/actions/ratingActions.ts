
'use server';

import { db } from '@/lib/firebase';
import type { UserRating, Figure, PerceptionKeys } from '@/lib/types';
import { doc, setDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

// Get a user's perception for a specific figure
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
    return null;
  }
}

// Submit or update a user's perception for a figure. This does NOT handle star ratings.
export async function submitUserPerception(
  userId: string,
  figureId: string,
  newPerception: PerceptionKeys
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId) {
    return { success: false, message: 'Figure ID is missing.' };
  }
  if (!newPerception) {
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

      // Create/Update user's perception document
      const newPerceptionData: Omit<UserRating, 'id' | 'timestamp'> & { timestamp: any } = {
        userId,
        figureId,
        perception: newPerception,
        timestamp: serverTimestamp(), // Use serverTimestamp for consistency
      };
      transaction.set(userRatingRef, newPerceptionData, { merge: true }); // Merge true to allow update if exists

      // Update perceptionCounts on the figure document
      const currentPerceptionCounts = { ...(figureData.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 }) };

      if (previousPerception && previousPerception !== newPerception) {
        currentPerceptionCounts[previousPerception] = Math.max(0, (currentPerceptionCounts[previousPerception] || 0) - 1);
      }
      
      // Increment new perception count only if it's different from previous or if there was no previous one.
      if (previousPerception !== newPerception) {
         currentPerceptionCounts[newPerception] = (currentPerceptionCounts[newPerception] || 0) + 1;
      }
      
      transaction.update(figureRef, {
        perceptionCounts: currentPerceptionCounts,
      });
    });

    return { success: true, message: 'Perception submitted and figure aggregates updated.' };
  } catch (error: any) {
    console.error('Error submitting perception or updating figure aggregates:', error.code, error.message, error);
    let message = 'Failed to submit perception. Please try again.';
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes('permission'))) {
        message = 'Failed to submit perception due to insufficient permissions. Please check your Firestore Security Rules.';
    } else if (error.message && String(error.message).toLowerCase().includes('not found')) {
        message = `Failed to submit perception: The figure could not be found. ${error.message}`;
    }
    return { success: false, message: message };
  }
}
