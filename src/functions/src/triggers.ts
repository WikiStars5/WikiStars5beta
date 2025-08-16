
import { onDocumentWritten, onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
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

    const figureRef = db.collection("figures").doc(figureId);
    await figureRef.update({ commentCount: admin.firestore.FieldValue.increment(-1) });

    if (parentId) {
        const parentCommentRef = db.collection("userComments").doc(parentId);
        await parentCommentRef.update({ replyCount: admin.firestore.FieldValue.increment(-1) });
    }
});

// The following triggers are no longer needed as the logic has been moved to client-side transactions for atomicity.
// They are kept here but commented out to avoid deployment and execution.

// Generic handler for attitude/emotion/rating changes
// const handleVoteChange = async (
//     change: any, // The before/after snapshot from the trigger
//     figureId: string,
//     collectionName: 'attitudeCounts' | 'perceptionCounts' | 'starRatingCounts',
//     voteKey: string
// ) => {
//     const figureRef = db.collection("figures").doc(figureId);
//     const increment = admin.firestore.FieldValue.increment;

//     const beforeData = change.before.data();
//     const afterData = change.after.data();

//     const updates: { [key: string]: any } = {};

//     // If a document is created
//     if (!change.before.exists && change.after.exists) {
//         updates[`${collectionName}.${afterData[voteKey]}`] = increment(1);
//     }
//     // If a document is deleted
//     else if (change.before.exists && !change.after.exists) {
//         updates[`${collectionName}.${beforeData[voteKey]}`] = increment(-1);
//     }
//     // If a document is updated (vote changed)
//     else if (change.before.exists && change.after.exists && beforeData[voteKey] !== afterData[voteKey]) {
//         updates[`${collectionName}.${beforeData[voteKey]}`] = increment(-1);
        
//         updates[`${collectionName}.${afterData[voteKey]}`] = increment(1);
//     }
//     // No relevant change
//     else {
//         return;
//     }
    
//     // Atomically update the figure document
//     try {
//         await figureRef.update(updates);
//     } catch(error) {
//         console.error(`Failed to update ${collectionName} for figure ${figureId}`, error);
//     }
// };

// // Trigger for attitude votes
// export const onAttitudeChange = onDocumentWritten("userAttitudes/{voteId}", async (event) => {
//     const data = event.data?.after.data() || event.data?.before.data();
//     if (!data) return;
//     await handleVoteChange(event.data, data.figureId, 'attitudeCounts', 'attitude');
// });

// // Trigger for emotion votes
// export const onEmotionChange = onDocumentWritten("userEmotions/{voteId}", async (event) => {
//     const data = event.data?.after.data() || event.data?.before.data();
//     if (!data) return;
//     await handleVoteChange(event.data, data.figureId, 'perceptionCounts', 'emotion');
// });

// // Trigger for star ratings
// export const onRatingChange = onDocumentWritten("userStarRatings/{ratingId}", async (event) => {
//     const data = event.data?.after.data() || event.data?.before.data();
//     if (!data) return;
//     await handleVoteChange(event.data, data.figureId, 'starRatingCounts', 'starValue');
// });
