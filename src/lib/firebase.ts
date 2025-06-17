
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
// REEMPLAZA TUS REGLAS EXISTENTES CON ESTAS:
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Admin UID ---
    function isAdmin() {
      // IMPORTANTE: Reemplaza 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2' con TU Admin UID real.
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }

    // --- Authenticated Non-Anonymous User ---
    function isAuthenticatedNonAnonymous() {
      return request.auth != null &&
             request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    // --- Rules for 'figures' collection ---
    match /figures/{figureId} {
      allow get: if true; // PUBLIC ACCESS: Allow anyone to read (get) individual figure documents.

      allow create: if isAdmin() &&
                       request.resource.data.nameLower == request.resource.data.name.toLowerCase();

      allow delete: if isAdmin();

      allow update: if isAuthenticatedNonAnonymous() &&
                      (
                        (isAdmin() && (request.resource.data.nameLower == request.resource.data.name.toLowerCase())) ||
                        ( // Non-admin, non-anonymous users can:
                          // Case 1: Edit allowed profile fields
                          (
                            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['description', 'nationality', 'occupation', 'gender', 'photoUrl']) &&
                            request.resource.data.name == resource.data.name && // Ensure other core fields are not changed
                            request.resource.data.perceptionCounts == resource.data.perceptionCounts &&
                            request.resource.data.attitudeCounts == resource.data.attitudeCounts &&
                            request.resource.data.starRatingCounts == resource.data.starRatingCounts
                          )
                          ||
                          // Case 2: Update perception, attitude, or star rating counts
                          (
                            (
                              request.resource.data.diff(resource.data).hasAny(['perceptionCounts', 'attitudeCounts', 'starRatingCounts']) &&
                              request.resource.data.diff(resource.data).affectedKeys().hasOnly(['perceptionCounts', 'attitudeCounts', 'starRatingCounts'])
                            ) &&
                            request.resource.data.name == resource.data.name && // Ensure other fields are not changed by this specific update path
                            request.resource.data.description == resource.data.description &&
                            request.resource.data.nationality == resource.data.nationality &&
                            request.resource.data.occupation == resource.data.occupation &&
                            request.resource.data.gender == resource.data.gender &&
                            request.resource.data.photoUrl == resource.data.photoUrl
                          )
                        )
                      );
    }

    match /figures {
      allow list: if true;
    }
    // --- End of rules for 'figures' collection ---

    // --- Rules for 'userPerceptions' collection ---
    match /userPerceptions/{perceptionDocId} {
      function getUserIdFromDocIdPerc() { return perceptionDocId.split('_')[0]; }
      function isOwnerNonAnonymousPerc() {
        return isAuthenticatedNonAnonymous() &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdPerc();
      }
      function isCreatingOwnValidDocNonAnonymousPerc() {
        return isAuthenticatedNonAnonymous() &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdPerc() &&
               request.resource.data.figureId == perceptionDocId.split('_')[1] &&
               request.resource.data.keys().hasAll(['userId', 'figureId', 'emotion', 'timestamp']) &&
               request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'] &&
               request.resource.data.timestamp == request.time;
      }
      allow read, delete: if isOwnerNonAnonymousPerc();
      allow update: if isOwnerNonAnonymousPerc() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emotion', 'timestamp']) &&
                      request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'] &&
                      request.resource.data.timestamp == request.time;
      allow create: if isCreatingOwnValidDocNonAnonymousPerc();
    }
    // --- End of rules for 'userPerceptions' collection ---

    // --- Rules for 'userAttitudes' collection ---
    match /userAttitudes/{attitudeDocId} {
      function getUserIdFromDocIdAtt() { return attitudeDocId.split('_')[0]; }
      function isOwnerNonAnonymousAtt() {
        return isAuthenticatedNonAnonymous() &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdAtt();
      }
      function isCreatingOwnValidDocNonAnonymousAtt() {
        return isAuthenticatedNonAnonymous() &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdAtt() &&
               request.resource.data.figureId == attitudeDocId.split('_')[1] &&
               request.resource.data.keys().hasAll(['userId', 'figureId', 'attitude', 'timestamp']) &&
               request.resource.data.attitude in ['neutral', 'fan', 'simp', 'hater'] &&
               request.resource.data.timestamp == request.time;
      }
      allow read, delete: if isOwnerNonAnonymousAtt();
      allow update: if isOwnerNonAnonymousAtt() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['attitude', 'timestamp']) &&
                      request.resource.data.attitude in ['neutral', 'fan', 'simp', 'hater'] &&
                      request.resource.data.timestamp == request.time;
      allow create: if isCreatingOwnValidDocNonAnonymousAtt();
    }
    // --- End of rules for 'userAttitudes' collection ---

    // --- Rules for 'userStarRatings' collection ---
    match /userStarRatings/{starRatingDocId} {
      function getUserIdFromDocIdStar() { return starRatingDocId.split('_')[0]; }
      function isOwnerNonAnonymousStar() {
        return isAuthenticatedNonAnonymous() &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdStar();
      }
      function isCreatingOwnValidDocNonAnonymousStar() {
        return isAuthenticatedNonAnonymous() &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdStar() &&
               request.resource.data.figureId == starRatingDocId.split('_')[1] &&
               request.resource.data.keys().hasAll(['userId', 'figureId', 'starValue', 'timestamp']) &&
               request.resource.data.starValue in [1, 2, 3, 4, 5] && 
               request.resource.data.timestamp == request.time;
      }
      allow read, delete: if isOwnerNonAnonymousStar();
      allow update: if isOwnerNonAnonymousStar() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['starValue', 'timestamp']) &&
                      request.resource.data.starValue in [1, 2, 3, 4, 5] &&
                      request.resource.data.timestamp == request.time;
      allow create: if isCreatingOwnValidDocNonAnonymousStar();
    }
    // --- End of rules for 'userStarRatings' collection ---


    // --- Rules for 'users' collection ---
    match /users/{userId} {
      allow read: if isAuthenticatedNonAnonymous() && request.auth.uid == userId;
      allow create: if isAuthenticatedNonAnonymous() &&
                       request.auth.uid == userId &&
                       request.resource.data.uid == userId &&
                       request.resource.data.role == 'user' &&
                       request.resource.data.keys().hasAll([
                         'uid', 'email', 'username', 'photoURL',
                         'country', 'countryCode', 'role',
                         'createdAt', 'lastLoginAt'
                       ]) &&
                       request.resource.data.createdAt == request.time &&
                       request.resource.data.lastLoginAt == request.time;
      allow update: if isAuthenticatedNonAnonymous() &&
                       request.auth.uid == userId &&
                       !(request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'uid', 'email', 'createdAt', 'role'
                       ])) &&
                       (request.resource.data.photoURL == resource.data.photoURL || request.resource.data.photoURL == request.auth.token.picture || request.resource.data.photoURL is string || request.resource.data.photoURL == null) &&
                       (request.resource.data.keys().has('lastLoginAt') ? request.resource.data.lastLoginAt == request.time : true);
      allow delete: if false;
    }
    // --- End of rules for 'users' collection ---
  }
}
*/

// === REGLAS DE SEGURIDAD DE FIREBASE STORAGE (APLICAR EN CONSOLA FIREBASE STORAGE > REGLAS) ===
// Ve a Firebase Console -> Storage -> Rules.
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /figures/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // ADMIN UID
    }
    match /emociones/{allPaths=**} {
      allow read: if true;
    }
    match /audio/{soundFilename} { // Rule for allowing public read access to audio files
      allow read: if true;
    }
  }
}
*/

