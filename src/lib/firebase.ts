
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
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // ADMIN UID
    }

    // --- Authenticated Non-Anonymous User ---
    function isAuthenticatedNonAnonymous() {
      return request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
    }

    // --- Rules for 'figures' collection ---
    match /figures/{figureId} {
      allow get: if true; // PUBLIC ACCESS: Allow anyone to read (get) individual figure documents.

      // ADMIN-ONLY ACCESS for create and delete
      allow create, delete: if isAdmin();

      // UPDATES to 'figures'
      allow update: if isAuthenticatedNonAnonymous() &&
                      (
                        // ADMIN can update any field (except ID potentially, handled by no 'id' in resource.data)
                        isAdmin()
                        ||
                        // NON-ADMIN, NON-ANONYMOUS users
                        (
                          // Ensure core protected fields are not changed by user if they are present in the request
                          (request.resource.data.keys().has('name') ? request.resource.data.name == resource.data.name : true) &&
                          (request.resource.data.keys().has('nameLower') ? request.resource.data.nameLower == resource.data.nameLower : true) &&
                          (request.resource.data.keys().has('status') ? request.resource.data.status == resource.data.status : true) &&
                          (request.resource.data.keys().has('createdAt') ? request.resource.data.createdAt == resource.data.createdAt : true) &&
                          (request.resource.data.keys().has('proposedWikiLink') ? request.resource.data.proposedWikiLink == resource.data.proposedWikiLink : true) &&
                          (request.resource.data.keys().has('proposedBy') ? request.resource.data.proposedBy == resource.data.proposedBy : true) &&

                          // And the changes are limited to the allowed set of fields for user interaction/updates.
                          // This means any updated field MUST be in this list.
                          request.resource.data.diff(resource.data).affectedKeys().hasOnly([
                            'description', 'nationality', 'occupation', 'gender', 'photoUrl', // User profile edits
                            'perceptionCounts', 'attitudeCounts', // Direct votes on figure page
                            'averageRating', 'totalRatings', 'ratingDistribution' // Aggregates updated by comment/rating submission
                          ])
                        )
                      );
    }

    match /figures {
      allow list: if true; // PUBLIC ACCESS: Allow anyone to list all documents.
    }
    // --- End of rules for 'figures' collection ---


    // --- Rules for 'figure_comments' collection ---
    match /figure_comments/{commentId} {
      allow get: if true; // Anyone can read comments

      allow list: if query.limit <= 100; // Anyone can list comments, e.g., for a specific figure, with a limit.

      allow create: if isAuthenticatedNonAnonymous() &&
                       request.auth.uid == request.resource.data.userId && // User can only create comments for themselves
                       request.resource.data.keys().hasAll(['figureId', 'userId', 'username', 'rating', 'text', 'createdAt', 'likes', 'dislikes', 'userPhotoUrl']) &&
                       request.resource.data.figureId is string && request.resource.data.figureId != '' &&
                       request.resource.data.userId is string && request.resource.data.userId != '' &&
                       request.resource.data.username is string && request.resource.data.username != '' &&
                       request.resource.data.rating is number && request.resource.data.rating >= 1 && request.resource.data.rating <= 5 &&
                       request.resource.data.text is string && request.resource.data.text.size() >= 10 && request.resource.data.text.size() <= 1000 &&
                       request.resource.data.createdAt == request.time && // Ensure server timestamp is used
                       request.resource.data.likes == 0 &&
                       request.resource.data.dislikes == 0 &&
                       (request.resource.data.userPhotoUrl == null || (request.resource.data.userPhotoUrl is string && request.resource.data.userPhotoUrl.matches('https?://.+')));


      allow update: if isAuthenticatedNonAnonymous() &&
                       request.auth.uid == resource.data.userId && // Owner can update their own comment
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'rating', 'updatedAt']) && // Example: allow editing text and rating
                       (request.resource.data.keys().has('updatedAt') ? request.resource.data.updatedAt == request.time : true) &&
                       // Keep core fields immutable by user update
                       request.resource.data.figureId == resource.data.figureId &&
                       request.resource.data.userId == resource.data.userId &&
                       request.resource.data.username == resource.data.username &&
                       request.resource.data.createdAt == resource.data.createdAt;
                       // Like/dislike updates would need a different logic or a separate collection/subcollection

      allow delete: if isAuthenticatedNonAnonymous() &&
                       (request.auth.uid == resource.data.userId || isAdmin()); // Owner or Admin
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
                       // User cannot change their own role, uid, email, createdAt
                       !(request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'uid', 'email', 'createdAt', 'role'
                       ])) &&
                       // Allow photoURL to be updated if it matches auth token picture or is explicitly set by user
                       (request.resource.data.photoURL == resource.data.photoURL || request.resource.data.photoURL == request.auth.token.picture || request.resource.data.photoURL is string || request.resource.data.photoURL == null) &&
                       // lastLoginAt must be server timestamp
                       request.resource.data.lastLoginAt == request.time;
      allow delete: if false; // Users generally shouldn't delete their own user docs directly
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
    // Allow public read access to files in the 'figures' folder (where admin uploads images)
    // and 'emociones' for emotion images
    match /figures/{allPaths=**} {
      allow read: if true;
    }
    match /emociones/{allPaths=**} { // For emotion images
      allow read: if true;
    }

    // Allow authenticated admin to write to the 'figures' folder
    match /figures/{figureId}/{fileName} {
      allow write: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // Admin UID
    }
    
    // Potentially allow users to upload their own profile pictures to a specific path
    // match /user_avatars/{userId}/{fileName} {
    //  allow read: if true;
    //  allow write: if request.auth != null && request.auth.uid == userId;
    // }
  }
}
*/
