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
// ¡ESTAS SON LAS REGLAS CORRECTAS Y SIMPLIFICADAS!
// Ve a Firebase Console -> Firestore Database -> Rules.
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Funciones de Ayuda ---
    function isAdmin() {
      // UID del administrador. ¡REEMPLAZAR SI ES NECESARIO!
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }
    function isSignedIn() {
      return request.auth != null;
    }
    function isRegisteredUser() {
      return isSignedIn() && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
    }

    // --- Colección de Figuras ---
    match /figures/{figureId} {
      // CUALQUIERA puede LEER una figura individual (get) y LISTAR la colección.
      allow get, list: if true;
      
      // SOLO el Administrador puede ESCRIBIR (crear, editar, borrar).
      allow write: if isAdmin();

      // Subcolección de Galería
      match /galleryImages/{imageId} {
        // Cualquiera puede LEER imágenes de la galería.
        allow get, list: if true;
        
        // Solo usuarios REGISTRADOS (no anónimos) pueden crear imágenes. El Admin también puede.
        allow create: if isRegisteredUser() || isAdmin();
      }
    }

    // --- Colección de Usuarios Registrados ---
    match /registered_users/{userId} {
      // Un usuario puede LEER y ACTUALIZAR su propio perfil.
      allow get, update: if isRegisteredUser() && request.auth.uid == userId;

      // El Administrador puede LISTAR y ESCRIBIR en cualquier perfil.
      allow list, write: if isAdmin();
    }
    
    // --- Colecciones de Votos y Comentarios ---
    match /userComments/{commentId} {
      // Cualquiera puede LEER comentarios.
      allow get, list: if true;
      
      // Usuarios autenticados (incluidos anónimos) pueden CREAR.
      allow create: if isSignedIn();

      // Un usuario puede ACTUALIZAR o BORRAR su propio comentario. El Admin puede BORRAR cualquiera.
      allow update: if isSignedIn() && request.auth.uid == resource.data.userId;
      allow delete: if (isSignedIn() && request.auth.uid == resource.data.userId) || isAdmin();
    }
    
    // Votos de Percepción, Actitud y Estrellas
    match /userPerceptions/{docId} {
      allow read, write: if isSignedIn();
    }
    match /userAttitudes/{docId} {
      allow read, write: if isSignedIn();
    }
    match /userStarRatings/{docId} {
      allow read, write: if isSignedIn();
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
