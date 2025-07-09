/**
 * @fileoverview This file contains the Firebase Cloud Function that listens for
 * new notifications in Firestore and sends a push notification to the
 * corresponding user via Firebase Cloud Messaging (FCM).
 */

// Import necessary modules from the Firebase Functions SDK and Firebase Admin SDK.
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize the Firebase Admin SDK. This is required to interact with
// Firebase services from a trusted environment like a Cloud Function.
admin.initializeApp();

/**
 * Cloud Function that triggers when a new document is created in the
 * 'notifications' collection.
 */
export const sendPushNotification = onDocumentCreated(
  "notifications/{notificationId}",
  async (event) => {
    // Get the snapshot of the new notification document.
    const snapshot = event.data;
    if (!snapshot) {
      logger.log("No data associated with the event");
      return;
    }
    const notificationData = snapshot.data();

    const userId = notificationData.userId; // The user who should receive the notification.
    const actorName = notificationData.actorName; // The user who performed the action.
    const figureName = notificationData.figureName; // The figure being discussed.
    const type = notificationData.type; // 'like' or 'reply'.
    const figureId = notificationData.figureId; // ID of the figure.
    // Use the correct comment ID for the URL hash.
    const commentIdForUrl = type === "reply"
      ? notificationData.replyId
      : notificationData.commentId;

    if (!userId) {
      logger.error("Notification is missing a userId.");
      return;
    }

    // 1. Fetch the user's profile to get their FCM push token.
    const userDocRef = admin.firestore()
                           .collection("registered_users")
                           .doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      logger.warn(`User document for userId ${userId} does not exist.`);
      return;
    }

    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) {
      logger.log(`User ${userId} does not have an FCM token. Skipping push.`);
      return;
    }

    // 2. Construct the notification message payload.
    let title = "";
    let body = "";

    if (type === "reply") {
      title = "💬 Nueva Respuesta";
      body = `${actorName} ha respondido a tu comentario sobre ${figureName}.`;
    } else if (type === "like") {
      title = "❤️ Nuevo Me Gusta";
      body = `A ${actorName} le ha gustado tu comentario sobre ${figureName}.`;
    } else {
      logger.warn(`Unknown notification type: ${type}`);
      return; // Do not send notification for unknown types.
    }

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194",
        },
        fcmOptions: {
          // This link will be opened when the user clicks the notification.
          link: `/figures/${figureId}#comment-${commentIdForUrl}`,
        },
      },
    };

    // 3. Send the message using the Firebase Admin SDK.
    try {
      logger.log(`Attempting to send notification to user ${userId}...`);
      const response = await admin.messaging().send(message);
      logger.log("Successfully sent message:", response);
    } catch (error) {
      logger.error("Error sending message:", error);
      // Optional: Clean up invalid tokens.
      // If an error indicates the token is invalid, you might want to remove
      // it from the user's document so you don't try to send to it again.
      if (
        (error as any).code === "messaging/registration-token-not-registered"
      ) {
        await userDocRef.update({ fcmToken: admin.firestore.FieldValue.delete() });
        logger.log(`Removed invalid FCM token for user ${userId}`);
      }
    }
  },
);
