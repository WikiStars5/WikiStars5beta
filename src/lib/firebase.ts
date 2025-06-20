
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
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // REEMPLAZA CON TU ADMIN_UID
    }

    // --- REGLAS PARA LA COLECCIÓN figures Y SU SUBCOLECCIÓN galleryImages ---
    match /figures/{figureId} {
      allow read: if true;
      // Solo el admin puede crear, actualizar o eliminar figuras.
      allow write: if isAdmin();

      match /galleryImages/{galleryImageId} {
        allow read: if true;
        allow create: if request.auth != null &&
                         !request.auth.token.firebase.sign_in_provider.matches('anonymous') && // No anónimos
                         request.resource.data.userId == request.auth.uid &&
                         request.resource.data.imageUrl != null;
        allow delete: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
        // update podría ser más restrictivo si es necesario.
        allow update: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
      }
    }
    // --- Fin de reglas para figures y galleryImages ---


    // --- OTRAS COLECCIONES PRINCIPALES ---
    // Usuarios pueden leer sus propios datos y admin puede leer/escribir todo.
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }

    // Votos de percepción y actitud: autenticados (incluyendo anónimos) pueden crear/actualizar/borrar sus propios votos.
    // Admin puede leer todo.
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

    // Comentarios: Autenticados (no anónimos) pueden crear. Dueños de comentarios y admin pueden borrar/actualizar. Todos pueden leer.
    match /userComments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
      allow update, delete: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
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
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // REEMPLAZA CON TU ADMIN_UID
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
