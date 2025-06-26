// === src/lib/firebase.ts ===
// Configuración y servicios de Firebase para tu aplicación.
// Incluye Firestore, Authentication y Storage.

import { initializeApp, getApp, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0",
  authDomain: "wikistars5-2yctr.firebaseapp.com",
  projectId: "wikistars5-2yctr",
  storageBucket: "wikistars5-2yctr.appspot.com",
  messagingSenderId: "939359993461",
  appId: "1:939359993461:web:c8aab67046db949495823c",
  measurementId: "G-XCFCPXNP56"
};

let app: FirebaseApp;
try {
  app = getApp();
} catch (e) {
  app = initializeApp(firebaseConfig);
}

export const storage: FirebaseStorage = getStorage(app);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export { app };

// === REGLAS DE SEGURIDAD DE FIRESTORE (APLICAR EN CONSOLA FIREBASE) ===
// Ve a Firebase Console -> Firestore Database -> Rules.
// REEMPLAZA 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2' CON TU ADMIN_UID REAL SI ES DIFERENTE.
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      // Reemplaza esto con el UID de tu cuenta de administrador si es diferente
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }
    
    match /figures/{figureId} {
      // ANYONE can read single figures (get) and lists of figures (list).
      allow get, list: if true;
      
      // ONLY the admin can create, update, or delete figure documents.
      // The batch update action needs full 'write' permission.
      allow write: if isAdmin();

      // Subcollection for gallery images inside a figure.
      match /galleryImages/{galleryImageId} {
        allow read: if true; // Anyone can see gallery images.
        // Any non-anonymous user can add images.
        allow write: if request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
      }
    }

    match /registered_users/{userId} {
      // An admin can read any user's profile and list all users.
      allow get, list: if isAdmin();
      // A user can read and write to their own profile.
      allow get, write: if request.auth != null && request.auth.uid == userId;
    }

    // Votes and ratings can be done by ANY authenticated user, including anonymous guests.
    match /userPerceptions/{docId} { allow read, write: if request.auth != null; }
    match /userAttitudes/{docId} { allow read, write: if request.auth != null; }
    match /userStarRatings/{docId} { allow read, write: if request.auth != null; }

    match /userComments/{commentId} {
      allow read: if true; // Anyone can read comments.
      // ANY authenticated user (including guests) can create/update comments (for likes/dislikes).
      allow write: if request.auth != null;
    }
  }
}
*/

// === REGLAS DE SEGURIDAD DE FIREBASE STORAGE (APLICAR EN CONSOLA FIREBASE STORAGE > REGLAS) ===
// Ve a Firebase Console -> Storage -> Rules.
// REEMPLAZA 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2' CON TU ADMIN_UID REAL SI ES DIFERENTE.
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      // Reemplaza esto con el UID de tu cuenta de administrador
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 
    }

    match /figures/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /emociones/{allPaths=**} {
      allow read: if true;
    }
    match /audio/{soundFilename} {
      allow read: if true;
    }
    match /logo/{logoFilename} {
      allow read: if true;
    }
  }
}
*/
