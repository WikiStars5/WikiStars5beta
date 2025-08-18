
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

// This trigger is now simplified. Its main purpose of updating ratings has been removed
// as the feature was proving to be problematic. It can be repurposed later if needed.
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

    // The transaction logic for updating ratings has been removed.
    // We will now perform a simple update to delete the obsolete fields if they exist.
    try {
        const updateData: {[key: string]: any} = {
            // Remove obsolete fields if they exist on the document
            ratingDistribution: admin.firestore.FieldValue.delete(),
            overallRating: admin.firestore.FieldValue.delete(),
            reviewCount: admin.firestore.FieldValue.delete(),
            starRatingCounts: admin.firestore.FieldValue.delete()
        };

        // We only perform a write if there's actually a review being added/deleted.
        // This prevents the trigger from running unnecessarily on other potential field updates.
        if (beforeData || afterData) {
            await characterRef.update(updateData);
            console.log(`Review written for character ${characterId}. Obsolete rating fields cleaned up.`);
        }

    } catch (error) {
        // We log the error but don't re-throw, as failing to delete old fields shouldn't block the review process.
        console.error(`Error cleaning up old fields for character ${characterId}:`, error);
    }
});
