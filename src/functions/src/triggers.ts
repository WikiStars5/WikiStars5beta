
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import type { Figure, StarValue, StarValueAsString } from "./types";

const db = admin.firestore();

// This single, robust trigger handles creation, updates, and deletions in the 'reviews' collection.
export const updateCharacterRatings = onDocumentWritten("reviews/{reviewId}", async (event) => {
    const reviewId = event.params.reviewId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Determine the characterId from the new data or the old data (in case of deletion)
    const characterId = afterData?.characterId || beforeData?.characterId;
    
    if (!characterId) {
        console.log(`Review ${reviewId} has no characterId. Exiting function.`);
        return;
    }

    const characterRef = db.collection("figures").doc(characterId);

    // Use a transaction to ensure atomic updates to the character document.
    return db.runTransaction(async (transaction) => {
        // Get all reviews for the specific character.
        const reviewsSnapshot = await transaction.get(db.collection("reviews").where("characterId", "==", characterId));

        const reviewCount = reviewsSnapshot.size;
        
        let overallRating = 0;
        const ratingDistribution: Record<StarValueAsString, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        let totalRatingSum = 0;

        if (reviewCount > 0) {
            reviewsSnapshot.forEach(doc => {
                const review = doc.data();
                const rating = review.rating as StarValue;
                if (rating >= 1 && rating <= 5) {
                    ratingDistribution[rating.toString() as StarValueAsString]++;
                    totalRatingSum += rating;
                }
            });
            overallRating = totalRatingSum / reviewCount;
        }

        // Prepare the data to update on the character's document.
        const updateData: Partial<Figure> = {
            reviewCount,
            overallRating: parseFloat(overallRating.toFixed(2)), // Keep it to 2 decimal places
            ratingDistribution
        };
        
        // Update the character document within the transaction.
        transaction.update(characterRef, updateData);
        console.log(`Successfully updated ratings for character ${characterId}. Review count: ${reviewCount}, New average: ${overallRating}.`);
    }).catch(error => {
        console.error(`Transaction failed for character ${characterId}:`, error);
    });
});
