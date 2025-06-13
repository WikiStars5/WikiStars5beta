
'use server';

import { db } from '@/lib/firebase';
import type { UserRating, Figure, PerceptionKeys } from '@/lib/types';
import { doc, setDoc, getDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';

// Get a user's rating for a specific figure
export async function getUserRating(userId: string, figureId: string): Promise<UserRating | null> {
  if (!userId) return null;
  try {
    const ratingDocId = `${userId}_${figureId}`;
    const ratingRef = doc(db, 'userRatings', ratingDocId);
    const ratingSnap = await getDoc(ratingRef);
    if (ratingSnap.exists()) {
      return { id: ratingSnap.id, ...ratingSnap.data() } as UserRating;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user rating:', error);
    return null;
  }
}

// Submit or update a user's rating for a figure and update figure aggregates
export async function submitUserRating(
  userId: string,
  figureId: string,
  perception: PerceptionKeys, // Ensure this matches UserRating['perception']
  stars: number
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId) {
    return { success: false, message: 'Figure ID is missing.' };
  }
  if (!perception || stars < 1 || stars > 5) { // Assuming stars must be 1-5
    return { success: false, message: 'Perception and a valid star rating (1-5) are required.'}
  }

  const userRatingRef = doc(db, 'userRatings', `${userId}_${figureId}`);
  const figureRef = doc(db, 'figures', figureId);

  try {
    await runTransaction(db, async (transaction) => {
      const figureDoc = await transaction.get(figureRef);
      if (!figureDoc.exists()) {
        throw new Error(`Figure with ID ${figureId} not found. Cannot submit rating.`);
      }
      const figureData = figureDoc.data() as Figure;

      const previousUserRatingDoc = await transaction.get(userRatingRef);
      const previousRating = previousUserRatingDoc.exists() ? previousUserRatingDoc.data() as UserRating : null;

      // New rating data
      const newRatingData: UserRating = {
        userId,
        figureId,
        perception,
        stars,
        timestamp: new Date().toISOString(),
      };
      // Set the user's new rating (or overwrite existing)
      transaction.set(userRatingRef, newRatingData);

      // --- Recalculate Aggregates ---
      let currentSumOfStars = figureData.averageRating * figureData.totalRatings;
      let currentTotalRatings = figureData.totalRatings;
      const currentPerceptionCounts = { ...(figureData.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 }) };


      if (previousRating) {
        // User is updating a rating
        // Adjust sum of stars: subtract old, add new
        currentSumOfStars = currentSumOfStars - previousRating.stars + stars;
        // Adjust perception counts
        currentPerceptionCounts[previousRating.perception] = Math.max(0, (currentPerceptionCounts[previousRating.perception] || 0) - 1);
        currentPerceptionCounts[perception] = (currentPerceptionCounts[perception] || 0) + 1;
        // totalRatings does not change if it's an update of an existing rating
      } else {
        // User is submitting a brand new rating
        currentSumOfStars = currentSumOfStars + stars;
        currentTotalRatings = currentTotalRatings + 1;
        currentPerceptionCounts[perception] = (currentPerceptionCounts[perception] || 0) + 1;
      }

      const newAverageRating = currentTotalRatings > 0 ? currentSumOfStars / currentTotalRatings : 0;

      transaction.update(figureRef, {
        averageRating: newAverageRating,
        totalRatings: currentTotalRatings,
        perceptionCounts: currentPerceptionCounts,
      });
    });

    return { success: true, message: 'Rating submitted and aggregates updated.' };
  } catch (error: any) {
    console.error('Error submitting rating or updating aggregates:', error.code, error.message, error);
    let message = 'Failed to submit rating. Please try again.';
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
        message = 'Failed to submit rating due to insufficient permissions. Please check your Firestore Security Rules.';
    } else if (error.message && error.message.toLowerCase().includes('not found')) {
        message = `Failed to submit rating: The figure could not be found. ${error.message}`;
    }
    return { success: false, message: message };
  }
}
