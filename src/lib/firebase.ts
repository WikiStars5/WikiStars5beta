
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

    // --- Helper Functions ---
    function isAdmin() {
      // IMPORTANTE: Reemplaza 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2' con TU Admin UID real.
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }

    function isAuthenticatedNonAnonymous() {
      return request.auth != null &&
             request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    // Ensures core figure data (name, id, creation, status) AND all text description fields are unchanged.
    // Used when only counts should be changing by non-admins.
    function figureProfileAndCoreDataUnchangedForCounts() {
      return request.resource.data.id == resource.data.id &&
             request.resource.data.name == resource.data.name &&
             request.resource.data.nameLower == resource.data.nameLower &&
             request.resource.data.photoUrl == resource.data.photoUrl &&
             request.resource.data.description == resource.data.description &&
             request.resource.data.nationality == resource.data.nationality &&
             request.resource.data.occupation == resource.data.occupation &&
             request.resource.data.gender == resource.data.gender &&
             request.resource.data.alias == resource.data.alias &&
             request.resource.data.species == resource.data.species &&
             request.resource.data.firstAppearance == resource.data.firstAppearance &&
             request.resource.data.birthDateOrAge == resource.data.birthDateOrAge &&
             request.resource.data.birthPlace == resource.data.birthPlace &&
             request.resource.data.statusLiveOrDead == resource.data.statusLiveOrDead &&
             request.resource.data.maritalStatus == resource.data.maritalStatus &&
             request.resource.data.height == resource.data.height &&
             request.resource.data.weight == resource.data.weight &&
             request.resource.data.hairColor == resource.data.hairColor &&
             request.resource.data.eyeColor == resource.data.eyeColor &&
             request.resource.data.distinctiveFeatures == resource.data.distinctiveFeatures &&
             request.resource.data.createdAt == resource.data.createdAt && // Assuming createdAt is set on creation and doesn't change
             request.resource.data.status == resource.data.status; // Assuming status doesn't change by non-admin count updates
    }

    // Ensures counts and other core fields (name, id, creation, status) are unchanged.
    // Used when only text description fields should be changing by non-admins.
    function figureCountsAndCoreDataUnchangedForProfileEdit() {
      return request.resource.data.id == resource.data.id &&
             request.resource.data.name == resource.data.name &&
             request.resource.data.nameLower == resource.data.nameLower &&
             request.resource.data.perceptionCounts == resource.data.perceptionCounts &&
             request.resource.data.attitudeCounts == resource.data.attitudeCounts &&
             request.resource.data.starRatingCounts == resource.data.starRatingCounts &&
             request.resource.data.createdAt == resource.data.createdAt && // Assuming createdAt is set on creation and doesn't change
             request.resource.data.status == resource.data.status; // Assuming status doesn't change by non-admin profile edits
    }

    // --- Rules for 'figures' collection ---
    match /figures/{figureId} {
      allow get: if true; // Public read

      allow create: if isAdmin() &&
                       request.resource.data.nameLower == request.resource.data.name.toLowerCase();

      allow delete: if isAdmin();

      allow update: if isAuthenticatedNonAnonymous() && (
        // Admin can update almost all fields (ensure nameLower is consistent)
        (isAdmin() && request.resource.data.nameLower == request.resource.data.name.toLowerCase()) ||
        // Non-admin, non-anonymous users:
        (
          // Path 1: Updating specific profile text/details fields
          (
            request.resource.data.diff(resource.data).affectedKeys().hasOnly([
              'description', 'nationality', 'occupation', 'gender', 'photoUrl',
              'alias', 'species', 'firstAppearance', 'birthDateOrAge', 'birthPlace',
              'statusLiveOrDead', 'maritalStatus', 'height', 'weight',
              'hairColor', 'eyeColor', 'distinctiveFeatures'
            ]) &&
            figureCountsAndCoreDataUnchangedForProfileEdit() // Ensures counts, name, createdAt, status are NOT changed
          ) ||
          // Path 2: Updating one or more count fields (perception, attitude, stars)
          (
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(
                ['perceptionCounts', 'attitudeCounts', 'starRatingCounts']
            ) &&
            figureProfileAndCoreDataUnchangedForCounts() // Ensures all profile text fields, name, createdAt, status are NOT changed
          )
        )
      );
    }

    match /figures {
      allow list: if true; // Public list
    }
    // --- End of rules for 'figures' collection ---


    // --- Generic rules for user-specific data (perceptions, attitudes, starRatings) ---
    function isOwnerOfUserSpecificDoc(collectionName) {
      // Example path: /databases/(default)/documents/userPerceptions/USERID_FIGUREID
      // request.path.split('/') will give: ["", "databases", "(default)", "documents", "userPerceptions", "USERID_FIGUREID"]
      // So, the docId is at index 5 for these collections.
      // For /users/{userId}, it would be index 4. This function is specific to votes.
      let docId = request.path.split('/')[5];
      let userIdFromDocId = docId.split('_')[0];
      return isAuthenticatedNonAnonymous() &&
             request.auth.uid == resource.data.userId && // Check existing resource data
             request.auth.uid == userIdFromDocId;        // Check against docId pattern
    }

    function isCreatingOwnValidUserSpecificDoc(collectionName, allowedFields, allowedValuesMap) {
      let docId = request.path.split('/')[5];
      let userIdFromDocId = docId.split('_')[0];
      let figureIdFromDocId = docId.split('_')[1];
      return isAuthenticatedNonAnonymous() &&
             request.auth.uid == request.resource.data.userId &&
             request.auth.uid == userIdFromDocId &&
             request.resource.data.figureId == figureIdFromDocId &&
             request.resource.data.keys().hasAll(allowedFields) &&
             request.resource.data.timestamp == request.time &&
             (collectionName == 'userPerceptions' ? request.resource.data.emotion in allowedValuesMap.emotions : true) &&
             (collectionName == 'userAttitudes' ? request.resource.data.attitude in allowedValuesMap.attitudes : true) &&
             (collectionName == 'userStarRatings' ? request.resource.data.starValue in allowedValuesMap.starValues : true);
    }

    function canUpdateUserSpecificDoc(collectionName, allowedUpdateFields, allowedValuesMap) {
      return isOwnerOfUserSpecificDoc(collectionName) &&
             request.resource.data.diff(resource.data).affectedKeys().hasOnly(allowedUpdateFields) &&
             request.resource.data.timestamp == request.time &&
             (collectionName == 'userPerceptions' ? request.resource.data.emotion in allowedValuesMap.emotions : true) &&
             (collectionName == 'userAttitudes' ? request.resource.data.attitude in allowedValuesMap.attitudes : true) &&
             (collectionName == 'userStarRatings' ? request.resource.data.starValue in allowedValuesMap.starValues : true);
    }

    // --- Rules for 'userPerceptions' collection ---
    match /userPerceptions/{perceptionDocId} {
      allow read, delete: if isOwnerOfUserSpecificDoc('userPerceptions');
      allow create: if isCreatingOwnValidUserSpecificDoc(
        'userPerceptions',
        ['userId', 'figureId', 'emotion', 'timestamp'],
        {'emotions': ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia']}
      );
      allow update: if canUpdateUserSpecificDoc(
        'userPerceptions',
        ['emotion', 'timestamp'],
        {'emotions': ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia']}
      );
    }
    // --- End of rules for 'userPerceptions' collection ---

    // --- Rules for 'userAttitudes' collection ---
    match /userAttitudes/{attitudeDocId} {
      allow read, delete: if isOwnerOfUserSpecificDoc('userAttitudes');
      allow create: if isCreatingOwnValidUserSpecificDoc(
        'userAttitudes',
        ['userId', 'figureId', 'attitude', 'timestamp'],
        {'attitudes': ['neutral', 'fan', 'simp', 'hater']}
      );
      allow update: if canUpdateUserSpecificDoc(
        'userAttitudes',
        ['attitude', 'timestamp'],
        {'attitudes': ['neutral', 'fan', 'simp', 'hater']}
      );
    }
    // --- End of rules for 'userAttitudes' collection ---

    // --- Rules for 'userStarRatings' collection ---
    match /userStarRatings/{starRatingDocId} {
      allow read, delete: if isOwnerOfUserSpecificDoc('userStarRatings');
      allow create: if isCreatingOwnValidUserSpecificDoc(
        'userStarRatings',
        ['userId', 'figureId', 'starValue', 'timestamp'],
        {'starValues': [1, 2, 3, 4, 5]}
      );
      allow update: if canUpdateUserSpecificDoc(
        'userStarRatings',
        ['starValue', 'timestamp'],
        {'starValues': [1, 2, 3, 4, 5]}
      );
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
                         'uid', 'email', 'createdAt', 'role' // UID, email, createdAt, role cannot be changed by user
                       ])) &&
                       // photoURL can be updated if it matches auth token or is a string (new upload) or null
                       (request.resource.data.photoURL == resource.data.photoURL || request.resource.data.photoURL == request.auth.token.picture || request.resource.data.photoURL is string || request.resource.data.photoURL == null) &&
                       // lastLoginAt should only be updated to current time, if present in update
                       (request.resource.data.keys().has('lastLoginAt') ? request.resource.data.lastLoginAt == request.time : true);
      allow delete: if false; // Users cannot delete their own profiles
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

