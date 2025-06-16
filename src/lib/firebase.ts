
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

    // --- Rules for 'figures' collection ---
    match /figures/{figureId} {
      allow get: if true; // PUBLIC ACCESS: Allow anyone to read (get) individual figure documents.

      // ADMIN-ONLY ACCESS for create and delete
      allow create, delete: if request.auth != null &&
                              !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                              request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // ADMIN UID

      // AUTHENTICATED USER ACCESS for updates
      allow update: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      (
                        // Admin can update any field
                        (request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2')
                        ||
                        // Non-admin, non-anonymous users can update specific descriptive fields
                        (
                          (
                            request.resource.data.description != resource.data.description ||
                            request.resource.data.nationality != resource.data.nationality ||
                            request.resource.data.occupation != resource.data.occupation ||
                            request.resource.data.gender != resource.data.gender ||
                            request.resource.data.photoUrl != resource.data.photoUrl ||
                            request.resource.data.perceptionCounts != resource.data.perceptionCounts ||
                            request.resource.data.attitudeCounts != resource.data.attitudeCounts ||
                            // Allow authenticated users (server actions running under their context)
                            // to update rating fields when submitting a comment.
                            // The transaction ensures this is done correctly.
                            request.resource.data.averageRating != resource.data.averageRating ||
                            request.resource.data.totalRatings != resource.data.totalRatings ||
                            request.resource.data.ratingDistribution != resource.data.ratingDistribution
                          ) &&
                          // Critical fields must not be changed by non-admins
                          request.resource.data.name == resource.data.name &&
                          request.resource.data.nameLower == resource.data.nameLower &&
                          request.resource.data.id == resource.data.id &&
                          request.resource.data.status == resource.data.status
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
                           // For querying by figureId: request.query.figureId == resource.data.figureId

      allow create: if request.auth != null &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       request.auth.uid == request.resource.data.userId && // User can only create comments for themselves
                       request.resource.data.keys().hasAll(['figureId', 'userId', 'username', 'rating', 'text', 'createdAt', 'likes', 'dislikes', 'userPhotoUrl']) &&
                       request.resource.data.rating >= 1 && request.resource.data.rating <= 5 &&
                       request.resource.data.text.size() >= 10 && request.resource.data.text.size() <= 1000 &&
                       request.resource.data.likes == 0 && request.resource.data.dislikes == 0 &&
                       (request.resource.data.userPhotoUrl == null || request.resource.data.userPhotoUrl is string);
                       // Optional: Add request.time == request.resource.data.createdAt for stricter timestamp

      // allow update: // For likes/dislikes on comments - to be implemented
                      // if request.auth != null &&
                      //    !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      //    (
                      //      ( // User updating their own comment text
                      //        request.auth.uid == resource.data.userId &&
                      //        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'updatedAt'])
                      //      ) ||
                      //      ( // Anyone updating like/dislike counts (if done client-side, risky)
                      //        request.resource.data.diff(resource.data).affectedKeys().hasAny(['likes', 'dislikes'])
                      //      )
                      //    );

      allow delete: if request.auth != null &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       (request.auth.uid == resource.data.userId || request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'); // Owner or Admin
    }
    // --- End of rules for 'figure_comments' collection ---

    // --- Rules for 'userPerceptions' collection ---
    match /userPerceptions/{perceptionDocId} {
      function getUserIdFromDocIdPerc() { return perceptionDocId.split('_')[0]; }
      function isOwnerNonAnonymousPerc() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdPerc();
      }
      function isCreatingOwnValidDocNonAnonymousPerc() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdPerc() &&
               request.resource.data.figureId == perceptionDocId.split('_')[1] &&
               request.resource.data.keys().hasAll(['userId', 'figureId', 'emotion', 'timestamp']) &&
               request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      }
      allow read, delete: if isOwnerNonAnonymousPerc();
      allow update: if isOwnerNonAnonymousPerc() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emotion', 'timestamp']) &&
                      request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      allow create: if isCreatingOwnValidDocNonAnonymousPerc();
    }
    // --- End of rules for 'userPerceptions' collection ---

    // --- Rules for 'userAttitudes' collection ---
    match /userAttitudes/{attitudeDocId} {
      function getUserIdFromDocIdAtt() { return attitudeDocId.split('_')[0]; }
      function isOwnerNonAnonymousAtt() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdAtt();
      }
      function isCreatingOwnValidDocNonAnonymousAtt() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdAtt() &&
               request.resource.data.figureId == attitudeDocId.split('_')[1] &&
               request.resource.data.keys().hasAll(['userId', 'figureId', 'attitude', 'timestamp']) &&
               request.resource.data.attitude in ['neutral', 'fan', 'simp', 'hater'];
      }
      allow read, delete: if isOwnerNonAnonymousAtt();
      allow update: if isOwnerNonAnonymousAtt() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['attitude', 'timestamp']) &&
                      request.resource.data.attitude in ['neutral', 'fan', 'simp', 'hater'];
      allow create: if isCreatingOwnValidDocNonAnonymousAtt();
    }
    // --- End of rules for 'userAttitudes' collection ---

    // --- Rules for 'users' collection ---
    match /users/{userId} {
      allow read: if request.auth != null &&
                     !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                     request.auth.uid == userId;
      allow create: if request.auth != null &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       request.auth.uid == userId &&
                       request.resource.data.uid == userId &&
                       request.resource.data.role == 'user' &&
                       request.resource.data.keys().hasAll([
                         'uid', 'email', 'username', 'photoURL',
                         'country', 'countryCode', 'role',
                         'createdAt', 'lastLoginAt'
                       ]);
      allow update: if request.auth != null &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       request.auth.uid == userId &&
                       !(request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'uid', 'email', 'createdAt', 'role'
                       ])) &&
                       (request.resource.data.photoURL == resource.data.photoURL || request.resource.data.photoURL == request.auth.token.picture);
      allow delete: if false; // Users generally shouldn't delete their own user docs directly
    }
    // --- End of rules for 'users' collection ---

    // Potentially, a collection for user reactions to comments (likes/dislikes)
    // match /user_comment_reactions/{reactionId} { // reactionId might be userId_commentId
    //   allow read, write: if request.auth != null &&
    //                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
    //                      request.auth.uid == reactionId.split('_')[0];
    // }
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

