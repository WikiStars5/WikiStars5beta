

import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

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
    // This will trigger the onCall function if the client is designed to call it on delete,
    // or you could add logic here to directly decrement the count.
    // For now, we assume client will handle re-rating or the count will be recalculated.
    if (starRatingGiven) {
        const ratingDocRef = db.collection("userStarRatings").doc(`${userId}_${figureId}`);
        await ratingDocRef.delete().catch(err => {
            console.error(`Failed to delete star rating for user ${userId} on figure ${figureId}:`, err);
        });
    }
});

// The onStarRatingWritten trigger has been removed. 
// Its logic is now handled by an onCall function `updateStarRating` in index.ts for better reliability.
