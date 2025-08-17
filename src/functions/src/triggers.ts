
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
export const onStarRatingWritten = onDocumentWritten("userStarRatings/{ratingId}", async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData && !afterData) {
        console.log("No data found in event, exiting.");
        return;
    }

    const figureId = (beforeData?.figureId || afterData?.figureId) as string;
    if (!figureId) {
        console.error("Figure ID missing in star rating document.");
        return;
    }
    
    const figureRef = db.collection("figures").doc(figureId);

    try {
        await db.runTransaction(async (transaction) => {
            const figureDoc = await transaction.get(figureRef);
            if (!figureDoc.exists) {
                console.error(`Figure document ${figureId} not found.`);
                return;
            }

            const currentCounts = figureDoc.data()?.starRatingCounts || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
            const newCounts = { ...currentCounts };

            // Rating was removed
            if (beforeData && !afterData) {
                const oldStar = beforeData.starValue.toString() as StarValueAsString;
                newCounts[oldStar] = Math.max(0, (newCounts[oldStar] || 0) - 1);
            } 
            // Rating was added
            else if (!beforeData && afterData) {
                const newStar = afterData.starValue.toString() as StarValueAsString;
                newCounts[newStar] = (newCounts[newStar] || 0) + 1;
            }
            // Rating was changed
            else if (beforeData && afterData && beforeData.starValue !== afterData.starValue) {
                const oldStar = beforeData.starValue.toString() as StarValueAsString;
                const newStar = afterData.starValue.toString() as StarValueAsString;
                newCounts[oldStar] = Math.max(0, (newCounts[oldStar] || 0) - 1);
                newCounts[newStar] = (newCounts[newStar] || 0) + 1;
            } else {
                // No change in value, no need to update.
                return;
            }
            
            transaction.update(figureRef, { starRatingCounts: newCounts });
        });
        console.log(`Successfully updated star counts for figure ${figureId}.`);
    } catch (e) {
        console.error(`Transaction to update star counts for figure ${figureId} failed:`, e);
    }
});
