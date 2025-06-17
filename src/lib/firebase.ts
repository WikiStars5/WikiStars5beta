
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
// REEMPLAZA TUS REGLAS EXISTENTES CON ESTAS (SON MUY PERMISIVAS, SOLO PARA DESARROLLO):
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función para verificar si el usuario es el administrador
    function isAdmin() {
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // REEMPLAZA CON TU ADMIN UID REAL
    }

    // Función para verificar si el usuario está autenticado y no es anónimo
    function isAuthenticatedNonAnonymous() {
      return request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
    }

    // Función para verificar si el usuario es el propietario del documento específico de voto/percepción
    // El docId debe ser 'userId_figureId'
    function isOwnerOfUserSpecificDoc() {
      // request.path structure: /databases/(default)/documents/COLLECTION_NAME/DOC_ID
      // So DOC_ID is at index 5
      return isAuthenticatedNonAnonymous() && request.auth.uid == request.path.split('/')[5].split('_')[0];
    }
    
    // Permite leer y escribir en todas las colecciones sin restricciones (SOLO PARA DESARROLLO)
    match /figures/{figureId} {
      allow read, write: if true; 
    }

    match /userPerceptions/{perceptionDocId} {
      allow read, write: if true;
    }

    match /userAttitudes/{attitudeDocId} {
      allow read, write: if true;
    }

    match /userStarRatings/{starRatingDocId} {
      allow read, write: if true;
    }

    // --- REGLAS PARA LA COLECCIÓN userComments ---
    match /userComments/{commentId} {
      // Cualquiera puede leer comentarios
      allow read: if true; // Permisivo para desarrollo

      // Solo usuarios autenticados y no anónimos pueden crear comentarios
      // Las validaciones de campos específicos se harían en reglas más estrictas
      allow create: if isAuthenticatedNonAnonymous(); // Permisivo para desarrollo, idealmente validar request.resource.data
      
      // El autor del comentario o un administrador pueden actualizar/eliminar
      // (Reglas más permisivas para desarrollo)
      allow update: if isAuthenticatedNonAnonymous(); // Permisivo para desarrollo
      allow delete: if isAuthenticatedNonAnonymous(); // Permisivo para desarrollo

      // EJEMPLO DE REGLAS MÁS SEGURAS PARA userComments (PARA PRODUCCIÓN):
      // allow read: if true;
      // allow create: if isAuthenticatedNonAnonymous() &&
      //                 request.resource.data.userId == request.auth.uid &&
      //                 request.resource.data.figureId != null &&
      //                 request.resource.data.text != null && request.resource.data.text.size() > 0 && request.resource.data.text.size() < 1000 &&
      //                 request.resource.data.username != null &&
      //                 // starRatingGiven puede ser null o un número entre 1 y 5
      //                 (request.resource.data.starRatingGiven == null || (request.resource.data.starRatingGiven >= 1 && request.resource.data.starRatingGiven <= 5)) &&
      //                 request.resource.data.likes == 0 &&
      //                 request.resource.data.dislikes == 0 &&
      //                 request.resource.data.likedBy.size() == 0 &&
      //                 request.resource.data.dislikedBy.size() == 0 &&
      //                 request.resource.data.createdAt == request.time;

      // allow update: if isAuthenticatedNonAnonymous() &&
      //                 (
      //                   // Autor editando su propio comentario (solo texto y updatedAt)
      //                   (resource.data.userId == request.auth.uid &&
      //                    request.resource.data.text != resource.data.text && 
      //                    request.resource.data.text.size() > 0 && request.resource.data.text.size() < 1000 &&
      //                    request.resource.data.updatedAt == request.time && 
      //                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'updatedAt']))
      //                   ||
      //                   // Otro usuario dando like/dislike (no el autor)
      //                   (resource.data.userId != request.auth.uid &&
      //                    (
      //                       request.resource.data.likes != resource.data.likes ||
      //                       request.resource.data.dislikes != resource.data.dislikes ||
      //                       request.resource.data.likedBy != resource.data.likedBy ||
      //                       request.resource.data.dislikedBy != resource.data.dislikedBy
      //                    ) &&
      //                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'dislikes', 'likedBy', 'dislikedBy']) &&
      //                    request.resource.data.figureId == resource.data.figureId &&
      //                    request.resource.data.userId == resource.data.userId &&
      //                    request.resource.data.text == resource.data.text &&
      //                    request.resource.data.createdAt == resource.data.createdAt
      //                   )
      //                 );
      
      // allow delete: if isAuthenticatedNonAnonymous() && (resource.data.userId == request.auth.uid || isAdmin());
    }
    // --- Fin de reglas para userComments ---

    match /users/{userId} {
      allow read, write: if true;
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

