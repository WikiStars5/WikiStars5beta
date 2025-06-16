
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

    match /figures/{figureId} {
      allow get: if true;

      // Admin can create directly (can set any status or no status, which implies approved)
      allow create: if
        request.auth != null &&
        !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
        request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2' && // ADMIN UID
        (request.resource.data.status == 'approved' || request.resource.data.status == null || request.resource.data.status == 'pending_verification') &&
        request.resource.data.keys().hasAll(['id', 'name', 'nameLower', 'photoUrl', 'description', 'nationality', 'occupation', 'gender', 'perceptionCounts', 'attitudeCounts', 'createdAt']);

      allow update: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      (
                        // Admin can update any field, including status
                        (request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2')
                        ||
                        // Non-admin can update specific fields if figure is approved
                        (resource.data.status == 'approved' &&
                          (
                            request.resource.data.description != resource.data.description ||
                            request.resource.data.nationality != resource.data.nationality ||
                            request.resource.data.occupation != resource.data.occupation ||
                            request.resource.data.gender != resource.data.gender ||
                            request.resource.data.photoUrl != resource.data.photoUrl ||
                            request.resource.data.perceptionCounts != resource.data.perceptionCounts ||
                            request.resource.data.attitudeCounts != resource.data.attitudeCounts
                          ) &&
                          // Critical fields must not be changed by non-admins
                          request.resource.data.name == resource.data.name &&
                          request.resource.data.nameLower == resource.data.nameLower &&
                          request.resource.data.id == resource.data.id &&
                          request.resource.data.status == resource.data.status // Status cannot be changed by non-admin
                        )
                      );
      
      allow delete: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // Only admin can delete
    }

    match /figures {
      allow list: if true;
    }

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
      allow delete: if false;
    }
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
    match /figures/{allPaths=**} {
      allow read: if true;
    }

    // Allow authenticated admin to write to the 'figures' folder
    match /figures/{figureId}/{fileName} {
      allow write: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // Admin UID
    }
    // Add other storage rules as needed.
  }
}
*/
