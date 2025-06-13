// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // MAKE SURE THIS IS SET IN YOUR ACTUAL FILE
  authDomain: "YOUR_AUTH_DOMAIN", // MAKE SURE THIS IS SET IN YOUR ACTUAL FILE
  projectId: "YOUR_PROJECT_ID", // MAKE SURE THIS IS SET IN YOUR ACTUAL FILE
  storageBucket: "YOUR_STORAGE_BUCKET", // MAKE SURE THIS IS SET IN YOUR ACTUAL FILE
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // MAKE SURE THIS IS SET IN YOUR ACTUAL FILE
  appId: "YOUR_APP_ID" // MAKE SURE THIS IS SET IN YOUR ACTUAL FILE
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const storage: FirebaseStorage = getStorage(app);
const db: Firestore = getFirestore(app);

export { app, storage, db };
