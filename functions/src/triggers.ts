
import { onDocumentWritten, FirestoreEvent } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import type { StarValue, StarValueAsString, Review } from "./types";
import type { DocumentSnapshot, Change } from "firebase-admin/firestore";

const db = admin.firestore();

// This single, robust trigger handles creation, updates, and deletions in the 'reviews' collection.
export const updateCharacterRatings = onDocumentWritten("reviews/{reviewId}", (event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { reviewId: string; }>) => {
    const reviewId = event.params.reviewId;

    // Securely get before and after data
    const beforeData = event.data?.before.data() as Review | undefined;
    const afterData = event.data?.after.data() as Review | undefined;

    // Determine the characterId from the new data or the old data (in case of deletion)
    const characterId = afterData?.characterId || beforeData?.characterId;
    
    if (!characterId) {
        console.log(`Review ${reviewId} has no characterId. Exiting function.`);
        return;
    }

    const characterRef = db.collection("figures").doc(characterId);

    // Use a transaction to ensure atomic updates to the character document.
    return db.runTransaction(async (transaction) => {
        // First, get all reviews for the specific character.
        const reviewsSnapshot = await transaction.get(db.collection("reviews").where("characterId", "==", characterId));

        const reviewCount = reviewsSnapshot.size;
        
        let overallRating = 0;
        const ratingDistribution: Record<StarValueAsString, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        let totalRatingSum = 0;

        if (reviewCount > 0) {
            reviewsSnapshot.forEach(doc => {
                const review = doc.data() as Review;
                // Ensure rating is a number before using it
                if (typeof review.rating === 'number') {
                    const rating = review.rating as StarValue;
                    if (rating >= 1 && rating <= 5) {
                        ratingDistribution[rating.toString() as StarValueAsString]++;
                        totalRatingSum += rating;
                    }
                }
            });
            overallRating = totalRatingSum / reviewCount;
        }

        // Prepare the data to update on the character's document.
        const updateData = {
            reviewCount,
            overallRating: parseFloat(overallRating.toFixed(2)), // Keep it to 2 decimal places
            ratingDistribution,
        };
        
        transaction.update(characterRef, updateData);
        console.log(`Successfully updated ratings for character ${characterId}. Review count: ${reviewCount}, New average: ${overallRating}.`);
    }).catch(error => {
        console.error(`Transaction failed for character ${characterId}:`, error);
        // It's important to re-throw the error to signal a function failure.
        throw new Error(`Failed to update ratings for character ${characterId}`);
    });
});
