
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, serverTimestamp, getDocs, query, where, runTransaction } from 'firebase/firestore';
import type { FigureComment, FigureUserRating } from '@/lib/types';
import { revalidatePath } from 'next/cache';

interface SubmitCommentAndRatingArgs {
  figureId: string;
  userId: string;
  username: string;
  userPhotoURL: string | null;
  ratingGiven: number; // Rating from 1 to 5
  commentText: string;
}

export async function submitCommentAndRating(
  args: SubmitCommentAndRatingArgs
): Promise<{ success: boolean; message?: string; commentId?: string }> {
  const { figureId, userId, username, userPhotoURL, ratingGiven, commentText } = args;

  if (!figureId || !userId || !username) {
    return { success: false, message: "Figure ID, User ID, and Username are required." };
  }
  if (ratingGiven < 1 || ratingGiven > 5) {
    return { success: false, message: "Rating must be between 1 and 5." };
  }
  if (commentText.trim().length === 0) {
    return { success: false, message: "Comment text cannot be empty." };
  }

  const figureDocRef = doc(db, 'figures', figureId);
  const commentDocRef = doc(collection(db, 'figureComments')); // New comment
  const userRatingDocRef = doc(db, 'figureUserRatings', `${userId}_${figureId}`); // User's specific rating for this figure

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get the current figure document
      const figureSnap = await transaction.get(figureDocRef);
      if (!figureSnap.exists()) {
        throw new Error("Figure not found.");
      }
      const figureData = figureSnap.data();

      // 2. Get the user's previous rating for this figure, if any
      const previousUserRatingSnap = await transaction.get(userRatingDocRef);
      const previousRatingValue = previousUserRatingSnap.exists() ? previousUserRatingSnap.data().rating : 0;

      // 3. Prepare the new comment
      const newComment: Omit<FigureComment, 'id' | 'createdAt'> = {
        figureId,
        userId,
        username,
        userPhotoURL,
        commentText,
        ratingGiven,
        timestamp: serverTimestamp(),
      };
      transaction.set(commentDocRef, newComment);

      // 4. Prepare the new user rating
      const newUserRating: FigureUserRating = {
        userId,
        figureId,
        rating: ratingGiven,
        timestamp: serverTimestamp(),
      };
      transaction.set(userRatingDocRef, newUserRating);

      // 5. Update figure's average rating and total ratings
      let currentTotalRatings = figureData.totalRatings || 0;
      let currentSumOfRatings = (figureData.averageRating || 0) * currentTotalRatings;

      if (previousUserRatingSnap.exists()) {
        // User is changing their rating
        currentSumOfRatings = currentSumOfRatings - previousRatingValue + ratingGiven;
        // totalRatings does not change if user is just updating their rating
      } else {
        // User is rating for the first time
        currentSumOfRatings = currentSumOfRatings + ratingGiven;
        currentTotalRatings += 1;
      }

      const newAverageRating = currentTotalRatings > 0 ? currentSumOfRatings / currentTotalRatings : 0;

      transaction.update(figureDocRef, {
        averageRating: newAverageRating,
        totalRatings: currentTotalRatings,
      });
    });

    revalidatePath(`/figures/${figureId}`);
    revalidatePath(`/figures`); // Also revalidate browse page if average ratings are shown there

    return { success: true, commentId: commentDocRef.id };

  } catch (error: any) {
    console.error("Error submitting comment and rating:", error);
    return { success: false, message: error.message || "Failed to submit comment and rating." };
  }
}
