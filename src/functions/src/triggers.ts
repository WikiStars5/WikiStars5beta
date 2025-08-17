
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

// Triggers for vote counters are now removed as this logic is handled by callable functions.
