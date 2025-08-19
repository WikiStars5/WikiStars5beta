
import { onDocumentWritten, FirestoreEvent } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import type { StarValue, StarValueAsString, Review, Figure } from "./types";
import type { DocumentSnapshot, Change } from "firebase-admin/firestore";

const db = admin.firestore();

// This single, robust trigger handles creation, updates, and deletions in the 'reviews' collection.
export const updateCharacterRatings = onDocumentWritten("reviews/{reviewId}", async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { reviewId: string; }>) => {
    const reviewId = event.params.reviewId;

    const afterData = event.data?.after.data() as Review | undefined;
    const beforeData = event.data?.before.data() as Review | undefined;

    const characterId = afterData?.characterId || beforeData?.characterId;
    
    if (!characterId) {
        console.log(`Review ${reviewId} has no characterId. Exiting function.`);
        return;
    }

    const characterRef = db.collection("figures").doc(characterId);

    return db.runTransaction(async (transaction) => {
        const reviewsSnapshot = await transaction.get(db.collection("reviews").where("characterId", "==", characterId));
        const characterDoc = await transaction.get(characterRef);

        // Robustness check: If the figure document doesn't exist, stop.
        if (!characterDoc.exists) {
            console.error(`Figure document with ID ${characterId} not found for review ${reviewId}.`);
            return;
        }

        const reviewCount = reviewsSnapshot.size;
        
        let overallRating = 0;
        const ratingDistribution: Record<StarValueAsString, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        let totalRatingSum = 0;

        if (reviewCount > 0) {
            reviewsSnapshot.forEach(doc => {
                const review = doc.data() as Review;
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

        const updateData = {
            reviewCount: reviewCount,
            overallRating: parseFloat(overallRating.toFixed(2)),
            ratingDistribution: ratingDistribution,
        };
        
        transaction.update(characterRef, updateData);
        console.log(`Successfully updated ratings for character ${characterId}. Review count: ${reviewCount}, New average: ${overallRating}.`);
    }).catch(error => {
        console.error(`Transaction failed for character ${characterId}:`, error);
        throw new Error(`Failed to update ratings for character ${characterId}`);
    });
});
