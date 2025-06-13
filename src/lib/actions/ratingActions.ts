'use server';

import { db } from '@/lib/firebase';
import type { UserRating, Figure } from '@/lib/types';
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
    // Depending on policy, might throw or return null
    return null;
  }
}

// Submit or update a user's rating for a figure and update figure aggregates
export async function submitUserRating(
  userId: string,
  figureId: string,
  perception: UserRating['perception'],
  stars: number
): Promise<{ success: boolean; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId) {
    return { success: false, message: 'Figure ID is missing.' };
  }
  if (!perception || stars === 0) {
    return { success: false, message: 'Perception and star rating are required.'}
  }

  const ratingDocId = `${userId}_${figureId}`;
  const userRatingRef = doc(db, 'userRatings', ratingDocId);
  const figureRef = doc(db, 'figures', figureId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get the figure document (we need its current name for the rating, if we denormalize)
      // For this operation, we don't strictly need the figure doc before writing the rating,
      // but it's good practice to ensure it exists if we were to validate against it.

      // 2. Set/Update the user's rating
      const newRatingData: UserRating = {
        userId,
        figureId,
        perception,
        stars,
        timestamp: new Date().toISOString(),
      };
      transaction.set(userRatingRef, newRatingData);

      // 3. Recalculate and update figure's averageRating and totalRatings
      // Get all ratings for this figure
      const ratingsQuery = query(collection(db, 'userRatings'), where('figureId', '==', figureId));
      // Execute query within transaction if Firestore supports it, otherwise outside if it's too broad.
      // For simplicity here, we'll assume the number of ratings per figure isn't astronomically large
      // to make this transaction too slow. A better approach for very high traffic would be Cloud Functions.
      
      // Since a transaction needs all reads before writes, and we already wrote to userRatingRef,
      // we need to be careful. Ideally, the query for all ratings for aggregation
      // should happen outside or before this specific transaction if it's too complex.
      // However, for this use case, we can try to fetch all ratings.
      // A more robust way (if not using Cloud Functions) would be to fetch after this transaction, then run a new one.
      // Or, maintain aggregate updates in a separate, dedicated transaction/function.

      // For this implementation, we will perform the aggregation based on existing data
      // and the new rating.

      const allRatingsSnap = await getDocs(ratingsQuery); // This read should ideally be part of the transaction
                                                         // but Firestore transactions have limits on reads before writes.
                                                         // We will read all ratings then update the figure.

      let totalStarValue = 0;
      let validRatingsCount = 0;
      
      allRatingsSnap.forEach(docSnap => {
        const rating = docSnap.data() as UserRating;
        if (rating.stars > 0) { // Only count ratings that have stars
            // If the current doc is the one we are about to update/set, use the new stars value
            if (docSnap.id === ratingDocId) {
                totalStarValue += stars;
            } else {
                totalStarValue += rating.stars;
            }
            validRatingsCount++;
        }
      });
      
      // If the current rating wasn't in the snapshot (i.e., it's a new rating not yet committed in this transaction's view)
      // and we haven't already counted it.
      const existingRatingSnap = allRatingsSnap.docs.find(d => d.id === ratingDocId);
      if (!existingRatingSnap && stars > 0) {
        // This is a new rating. If it has stars, add it to calculation.
        // This part is tricky with transactions. The getDocs above might not see the `transaction.set` immediately.
        // A common pattern is to fetch the current state, calculate new state, then write.
        // Let's adjust: fetch all *other* ratings, then add the current one.
        
        totalStarValue = 0;
        validRatingsCount = 0;
        let ratingAlreadyCounted = false;

        allRatingsSnap.forEach(docSnap => {
            const rating = docSnap.data() as UserRating;
            if (docSnap.id === ratingDocId) { // This is the rating being submitted
                if (stars > 0) {
                    totalStarValue += stars;
                    validRatingsCount++;
                }
                ratingAlreadyCounted = true;
            } else { // Other ratings
                if (rating.stars > 0) {
                    totalStarValue += rating.stars;
                    validRatingsCount++;
                }
            }
        });

        // If it's a brand new rating (not an update of an existing one found in the snapshot)
        if (!ratingAlreadyCounted && stars > 0) {
            totalStarValue += stars;
            validRatingsCount++;
        }
      }


      const newAverageRating = validRatingsCount > 0 ? totalStarValue / validRatingsCount : 0;
      const newTotalRatings = validRatingsCount;

      transaction.update(figureRef, {
        averageRating: newAverageRating,
        totalRatings: newTotalRatings,
      });
    });

    return { success: true, message: 'Rating submitted and aggregates updated.' };
  } catch (error) {
    console.error('Error submitting rating or updating aggregates:', error);
    return { success: false, message: 'Failed to submit rating.' };
  }
}
