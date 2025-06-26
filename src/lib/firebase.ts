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
// ¡ESTAS SON LAS REGLAS CORRECTAS Y SIMPLIFICADAS!
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      // UID del administrador. ¡REEMPLAZAR SI ES NECESARIO!
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }

    // Regla 1: El administrador tiene acceso TOTAL de lectura y escritura a TODA la base de datos.
    // Esto asegura que todas las operaciones del panel de admin funcionen sin problemas.
    match /{path=**} {
      allow read, write: if isAdmin();
    }
    
    // Regla 2: Reglas PÚBLICAS para usuarios no administradores.
    // Firestore combinará estas reglas con la del admin. Si un usuario es admin, la Regla 1 le da acceso.
    // Si no es admin, entonces se verifican estas reglas de aquí abajo.

    // CUALQUIERA puede leer (get) una figura específica.
    match /figures/{figureId} {
      allow get: if true;
    }

    // CUALQUIERA puede leer los comentarios.
    match /userComments/{commentId} {
      allow read: if true;
    }
    
    // Usuarios autenticados (INCLUYENDO ANÓNIMOS) pueden votar y comentar.
    match /userPerceptions/{docId} { allow write: if request.auth != null; }
    match /userAttitudes/{docId} { allow write: if request.auth != null; }
    match /userStarRatings/{docId} { allow write: if request.auth != null; }
    match /userComments/{commentId} { allow write: if request.auth != null; }
    
    // Usuarios con CUENTA (no anónimos) pueden añadir a la galería.
    match /figures/{figureId}/galleryImages/{galleryImageId} {
      allow get: if true; // Permitir lectura de imágenes de galería a todos
      allow write: if request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
    }
    
    // Un usuario solo puede leer y actualizar su PROPIO perfil.
    match /registered_users/{userId} {
      allow get, update: if request.auth != null && request.auth.uid == userId;
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
