

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// This function will trigger every time a new document is created in the 'notifications' collection.
export const sendPushNotification = onDocumentCreated("notifications/{notificationId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  const notificationData = snapshot.data();

  const userId = notificationData.userId;
  const actorName = notificationData.actorName;
  const figureName = notificationData.figureName;
  const type = notificationData.type;

  if (!userId) {
    console.error("Notification is missing a userId.");
    return;
  }

  // 1. Get the user's profile to find their FCM token, using the standardized 'users' collection
  const userDocRef = admin.firestore().collection("users").doc(userId);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    console.log(`User document ${userId} does not exist. Cannot send notification.`);
    return;
  }

  const fcmToken = userDoc.data()?.fcmToken;

  if (!fcmToken) {
    console.log(`User ${userId} does not have an FCM token. Cannot send notification.`);
    return;
  }

  // 2. Construct the notification payload
  let notificationTitle = "Nueva Actividad";
  let notificationBody = "Alguien ha interactuado con tu contenido.";

  switch (type) {
    case "reply":
      notificationTitle = "Tienes una nueva respuesta";
      notificationBody = `${actorName} ha respondido a tu comentario sobre ${figureName}.`;
      break;
    case "like":
      notificationTitle = "¡A alguien le gustó tu comentario!";
      notificationBody = `${actorName} le ha dado "me gusta" a tu comentario sobre ${figureName}.`;
      break;
    case "dislike":
      notificationTitle = "Reacción a tu comentario";
      notificationBody = `${actorName} no está de acuerdo con tu comentario sobre ${figureName}.`;
      break;
    default:
      console.log(`Handling generic or unknown notification type: ${type}`);
      notificationBody = `${actorName} ha interactuado con tu contenido sobre ${figureName}.`
  }
  
  // This is the correct payload structure for Webpush notifications via FCM.
  const payload = {
    token: fcmToken,
    webpush: {
      notification: {
        title: notificationTitle,
        body: notificationBody,
        icon: "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194",
      },
      fcm_options: {
        link: `https://wikistars5-2yctr.web.app/figures/${notificationData.figureId}`,
      },
    },
     // You can also include a general notification for other platforms (like mobile)
    notification: {
      title: notificationTitle,
      body: notificationBody,
    },
  };

  // 3. Send the message
  try {
    console.log(`Sending notification to user ${userId} with token ${fcmToken}`);
    await admin.messaging().send(payload);
    console.log("Successfully sent message");
  } catch (error) {
    console.error("Error sending message:", error);
  }
});
