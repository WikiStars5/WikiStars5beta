
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

      allow create: if isAdmin(); // ADMIN-ONLY can create figures directly.
      allow delete: if isAdmin(); // ADMIN-ONLY can delete.

      // UPDATES to 'figures'
      allow update: if isAuthenticatedNonAnonymous() &&
                      (
                        // ADMIN can update most fields (nameLower should be consistent with name)
                        (isAdmin() && 
                          (request.resource.data.nameLower == request.resource.data.name.toLowerCase())
                        )
                        ||
                        // NON-ADMIN, NON-ANONYMOUS users can ONLY update rating fields OR their own profile edits
                        (
                          // Case 1: Updating rating aggregates (via submitCommentAndRatingAction)
                          (
                            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['totalRatings', 'averageRating', 'ratingDistribution']) &&
                            request.resource.data.totalRatings == resource.data.totalRatings + 1 && // Verify integrity of count
                            // Ensure other core fields are not changed during this specific update type
                            request.resource.data.name == resource.data.name &&
                            request.resource.data.description == resource.data.description &&
                            request.resource.data.photoUrl == resource.data.photoUrl &&
                            request.resource.data.nationality == resource.data.nationality &&
                            request.resource.data.occupation == resource.data.occupation &&
                            request.resource.data.gender == resource.data.gender &&
                            request.resource.data.perceptionCounts == resource.data.perceptionCounts &&
                            request.resource.data.attitudeCounts == resource.data.attitudeCounts
                          )
                          ||
                          // Case 2: User editing allowed profile fields (description, nationality, etc.)
                          (
                            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['description', 'nationality', 'occupation', 'gender', 'photoUrl']) &&
                             // Ensure other core fields are not changed during this specific update type
                            request.resource.data.name == resource.data.name &&
                            request.resource.data.totalRatings == resource.data.totalRatings &&
                            request.resource.data.averageRating == resource.data.averageRating &&
                            request.resource.data.ratingDistribution == resource.data.ratingDistribution &&
                            request.resource.data.perceptionCounts == resource.data.perceptionCounts &&
                            request.resource.data.attitudeCounts == resource.data.attitudeCounts
                          )
                        )
                      );
    }

    match /figures {
      allow list: if true; // PUBLIC ACCESS: Allow anyone to list all documents.
    }
    // --- End of rules for 'figures' collection ---


    // --- Rules for 'figure_comments' collection ---
    match /figure_comments/{commentId} {
      allow get: if true; 
      allow list: if query.limit <= 100;

      allow create: if isAuthenticatedNonAnonymous() &&
                       request.auth.uid == request.resource.data.userId && 
                       request.resource.data.keys().hasAll(['figureId', 'userId', 'username', 'rating', 'text', 'createdAt', 'likes', 'dislikes', 'userPhotoUrl']) &&
                       request.resource.data.figureId is string && request.resource.data.figureId != '' &&
                       request.resource.data.userId is string && request.resource.data.userId == request.auth.uid &&
                       request.resource.data.username is string && request.resource.data.username.size() > 0 &&
                       request.resource.data.rating is number && request.resource.data.rating >= 1 && request.resource.data.rating <= 5 &&
                       request.resource.data.text is string && request.resource.data.text.size() >= 10 && request.resource.data.text.size() <= 1000 &&
                       request.resource.data.createdAt == request.time && 
                       request.resource.data.likes == 0 &&
                       request.resource.data.dislikes == 0 &&
                       (request.resource.data.userPhotoUrl == null || (request.resource.data.userPhotoUrl is string && request.resource.data.userPhotoUrl.matches('https?://.+')));

      // For LIKES/DISLIKES on comments (implement later)
      // allow update: if isAuthenticatedNonAnonymous() &&
      //                  (
      //                    ( // Owner can edit text/rating
      //                      request.auth.uid == resource.data.userId &&
      //                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'rating', 'updatedAt']) &&
      //                      (request.resource.data.keys().has('updatedAt') ? request.resource.data.updatedAt == request.time : true)
      //                    ) 
      //                    // Add rules for updating likes/dislikes by any authenticated user later
      //                  );

      allow delete: if isAuthenticatedNonAnonymous() && (request.auth.uid == resource.data.userId || isAdmin());
    }
    // --- End of rules for 'figure_comments' collection ---

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
                       (request.resource.data.keys().has('lastLoginAt') ? request.resource.data.lastLoginAt == request.time : true); // lastLoginAt is optional on some updates from user profile form
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
      // Admin can write to figures folder
      allow write: if request.auth != null && 
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // ADMIN UID
    }
    match /emociones/{allPaths=**} { 
      allow read: if true;
    }
    // match /user_avatars/{userId}/{fileName} {
    //  allow read: if true;
    //  allow write: if request.auth != null && request.auth.uid == userId;
    // }
  }
}
*/

