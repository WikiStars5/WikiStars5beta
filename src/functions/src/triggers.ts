
import { onDocumentWritten, onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import type { StarValueAsString } from "./types";

const db = admin.firestore();

// Trigger to update commentCount when a comment is created or deleted
export const onCommentCreated = onDocumentCreated("userComments/{commentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const figureId = data.figureId;
    const parentId = data.parentId;

    const figureRef = db.collection("figures").doc(figureId);
    await figureRef.update({ commentCount: admin.firestore.FieldValue.increment(1) });

    if (parentId) {
        const parentCommentRef = db.collection("userComments").doc(parentId);
        await parentCommentRef.update({ replyCount: admin.firestore.FieldValue.increment(1) });
    }
});

export const onCommentDeleted = onDocumentDeleted("userComments/{commentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const figureId = data.figureId;
    const parentId = data.parentId;
    const userId = data.userId;
    const starRatingGiven = data.starRatingGiven;

    const figureRef = db.collection("figures").doc(figureId);
    await figureRef.update({ commentCount: admin.firestore.FieldValue.increment(-1) });

    if (parentId) {
        const parentCommentRef = db.collection("userComments").doc(parentId);
        await parentCommentRef.update({ replyCount: admin.firestore.FieldValue.increment(-1) });
    }
    
    // If the deleted comment had a star rating, delete the corresponding rating document.
    // This will trigger onStarRatingWritten to decrement the count.
    if (starRatingGiven) {
        const ratingDocRef = db.collection("userStarRatings").doc(`${userId}_${figureId}`);
        await ratingDocRef.delete();
    }
});

// This new trigger will atomically update the star rating counters on a figure document.
// This is the robust, final version.
export const onStarRatingWritten = onDocumentWritten("userStarRatings/{ratingId}", async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    const figureId = (beforeData?.figureId || afterData?.figureId) as string;
    if (!figureId) {
        console.error("Figure ID missing in star rating document.");
        return;
    }
    
    const figureRef = db.collection("figures").doc(figureId);

    // Determine the change in star ratings
    const oldStar = beforeData?.starValue as number | undefined;
    const newStar = afterData?.starValue as number | undefined;

    // Do nothing if the star value hasn't changed.
    if (oldStar === newStar) {
        return;
    }

    try {
        await db.runTransaction(async (transaction) => {
            const figureDoc = await transaction.get(figureRef);
            if (!figureDoc.exists) {
                console.error(`Figure document ${figureId} not found.`);
                return;
            }

            // Securely initialize counts to avoid errors with undefined fields.
            const currentCounts = figureDoc.data()?.starRatingCounts || {};
            const updates: { [key: string]: admin.firestore.FieldValue } = {};

            // If a rating was removed (document deleted)
            if (oldStar && !newStar) {
                const oldStarKey: StarValueAsString = oldStar.toString() as StarValueAsString;
                updates[`starRatingCounts.${oldStarKey}`] = admin.firestore.FieldValue.increment(-1);
            } 
            // If a rating was added (document created)
            else if (!oldStar && newStar) {
                const newStarKey: StarValueAsString = newStar.toString() as StarValueAsString;
                updates[`starRatingCounts.${newStarKey}`] = admin.firestore.FieldValue.increment(1);
            }
            // If a rating was changed (document updated)
            else if (oldStar && newStar) {
                const oldStarKey: StarValueAsString = oldStar.toString() as StarValueAsString;
                const newStarKey: StarValueAsString = newStar.toString() as StarValueAsString;
                updates[`starRatingCounts.${oldStarKey}`] = admin.firestore.FieldValue.increment(-1);
                updates[`starRatingCounts.${newStarKey}`] = admin.firestore.FieldValue.increment(1);
            }
            
            // Only commit the transaction if there are updates to be made.
            if (Object.keys(updates).length > 0) {
                 // Before updating, ensure the count fields exist to avoid errors.
                const newFigureData = { starRatingCounts: { ...currentCounts } };
                if (oldStar) {
                    const oldStarKey = oldStar.toString() as StarValueAsString;
                    if (!newFigureData.starRatingCounts[oldStarKey]) newFigureData.starRatingCounts[oldStarKey] = 0;
                }
                if (newStar) {
                    const newStarKey = newStar.toString() as StarValueAsString;
                    if (!newFigureData.starRatingCounts[newStarKey]) newFigureData.starRatingCounts[newStarKey] = 0;
                }
                // First, ensure fields exist with a merge
                transaction.set(figureRef, newFigureData, { merge: true });
                // Then, apply the atomic increments
                transaction.update(figureRef, updates);
            }
        });
        console.log(`Successfully updated star counts for figure ${figureId}.`);
    } catch (e) {
        console.error(`Transaction to update star counts for figure ${figureId} failed:`, e);
    }
});
