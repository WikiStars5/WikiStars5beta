
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
      // Reemplaza esto con el UID de tu cuenta de administrador
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }
    
    // --- REGLAS PARA LA COLECCIÓN figures Y SU SUBCOLECCIÓN galleryImages ---
    match /figures/{figureId} {
      allow read: if true;
      // Admin puede crear y eliminar figuras.
      allow create, delete: if isAdmin();
      // Cualquier usuario autenticado (incluido anónimo) puede actualizar (para contadores de votos, etc.).
      allow update: if request.auth != null;

      match /galleryImages/{galleryImageId} {
        allow read: if true;
        allow create: if request.auth != null &&
                         !request.auth.token.firebase.sign_in_provider.matches('anonymous') && // No anónimos
                         request.resource.data.userId == request.auth.uid &&
                         request.resource.data.imageUrl != null;
        allow delete: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
        allow update: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
      }
    }

    // --- REGLAS PARA OTRAS COLECCIONES PRINCIPALES ---
    
    // REGLA CLAVE PARA PERFILES DE USUARIO REGISTRADOS
    match /registered_users/{userId} {
      // Un usuario puede leer y escribir en su propio perfil.
      // El administrador también puede leer y escribir en cualquier perfil.
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }
    
    // Votos de percepción, actitud y estrellas: los usuarios autenticados pueden escribir sus propios votos.
    match /userPerceptions/{docId} {
      allow read: if isAdmin() || (request.auth != null && request.auth.uid == docId.split('_')[0]);
      allow write: if request.auth != null && request.auth.uid == docId.split('_')[0];
    }
    match /userAttitudes/{docId} {
      allow read: if isAdmin() || (request.auth != null && request.auth.uid == docId.split('_')[0]);
      allow write: if request.auth != null && request.auth.uid == docId.split('_')[0];
    }
    match /userStarRatings/{docId} {
      allow read: if isAdmin() || (request.auth != null && request.auth.uid == docId.split('_')[0]);
      allow write: if request.auth != null && request.auth.uid == docId.split('_')[0];
    }

    // Comentarios: Los usuarios autenticados (INCLUYENDO ANÓNIMOS) pueden crear.
    // El dueño del comentario o un admin pueden eliminarlo.
    // Cualquier usuario no-anónimo puede actualizarlo para dar like/dislike.
    match /userComments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
      // Permite actualizar si:
      // 1. Eres el autor o un admin (puedes cambiar todo).
      // 2. Eres un usuario logueado (no anónimo) Y NO estás cambiando el texto o la calificación de estrellas.
      allow update: if request.auth != null && (
          (request.auth.uid == resource.data.userId || isAdmin()) ||
          (
            !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
            // CORRECTO: O el campo 'text' no se está actualizando, O si se actualiza, no cambia.
            (!('text' in request.resource.data) || request.resource.data.text == resource.data.text) &&
            // CORRECTO: O el campo 'starRatingGiven' no se está actualizando, O si se actualiza, no cambia.
            (!('starRatingGiven' in request.resource.data) || request.resource.data.starRatingGiven == resource.data.starRatingGiven)
          )
      );
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

    // Permite la lectura de todas las imágenes en la carpeta 'figures' y 'emociones'
    match /figures/{allPaths=**} {
      allow read: if true;
      // Permite la escritura en 'figures' solo al administrador (UID específico)
      allow write: if isAdmin();
    }
    match /emociones/{allPaths=**} {
      allow read: if true; // Permite a todos leer las imágenes de emociones
    }
    match /audio/{soundFilename} { // Rule for allowing public read access to audio files
      allow read: if true;
    }
    // Puedes añadir reglas más específicas para otras carpetas si es necesario.
  }
}
*/
