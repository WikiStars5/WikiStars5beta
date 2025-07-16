
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    // Since we are in a Google Cloud environment, we don't need to provide a service account key.
    // The Functions runtime will automatically use the default service account credentials.
    // You might need to add specific databaseURL or storageBucket if you use those services.
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
