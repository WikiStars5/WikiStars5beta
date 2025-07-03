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

// ======================================================================
// ===          ¡IMPORTANTE! REGLAS DE SEGURIDAD DE FIRESTORE         ===
// === COPIA Y PEGA ESTO EN TU CONSOLA DE FIREBASE -> Firestore Rules ===
// ======================================================================
/*
// === REGLAS DE SEGURIDAD DE FIRESTORE (APLICAR EN CONSOLA FIREBASE) ===
// Ve a Firebase Console -> Firestore Database -> Rules.
// REEMPLAZA 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2' CON TU ADMIN_UID REAL SI ES DIFERENTE.

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Función auxiliar para verificar si el usuario es el administrador.
    // ¡ASEGÚRATE DE QUE EL UID COINCIDA CON TU CUENTA DE ADMINISTRADOR!
    function isAdmin() {
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }

    // Reglas para la colección 'figures'
    match /figures/{figureId} {
      // Cualquiera puede leer la lista de figuras o una figura individual.
      allow get, list: if true;
      // Cualquier usuario autenticado (incluidos anónimos) puede actualizar una figura.
      // Esto permite la edición pública y el voto en encuestas.
      allow update: if request.auth != null; 
      // Solo los administradores pueden crear o eliminar figuras.
      allow create, delete: if isAdmin();

      // Reglas para la subcolección de galería de imágenes
      match /galleryImages/{galleryImageId} {
        // Cualquiera puede leer las imágenes de la galería.
        allow read: if true;
        // Solo los usuarios autenticados (no anónimos) pueden añadir/eliminar imágenes.
        allow write: if request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
      }
    }

    // Reglas para la colección de usuarios registrados
    match /registered_users/{userId} {
      // Un administrador puede leer el perfil de cualquier usuario.
      // Un usuario puede leer su propio perfil.
      allow get: if request.auth != null && (request.auth.uid == userId || isAdmin());
      // IMPORTANTE: Solo un administrador puede listar todos los documentos de esta colección.
      // Esto es necesario para el panel de administración.
      allow list: if isAdmin();
      
      // Un usuario puede crear su propio documento de perfil.
      allow create: if request.auth != null && request.auth.uid == userId;
      // Un administrador puede actualizar cualquier perfil. Un usuario puede actualizar el suyo.
      allow update: if request.auth != null && (request.auth.uid == userId || isAdmin());
      // Solo los administradores pueden eliminar perfiles de usuario.
      allow delete: if isAdmin();
    }

    // Reglas para las colecciones de votos y encuestas.
    // Cualquier usuario autenticado (incluidos anónimos) puede escribir su voto.
    match /userPerceptions/{docId} { allow read, write: if request.auth != null; }
    match /userAttitudes/{docId} { allow read, write: if request.auth != null; }
    match /userStarRatings/{docId} { allow read, write: if request.auth != null; }
    
    // Reglas para la colección de comentarios.
    match /userComments/{commentId} {
      // Cualquiera puede leer los comentarios.
      allow read: if true;
      // Cualquier usuario autenticado (incluidos anónimos) puede escribir/actualizar.
      // Esto permite comentar y dar me gusta/no me gusta.
      allow write: if true; 
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

    // Cualquiera puede leer las imágenes de las figuras, emociones, audios y logos.
    match /figures/{allPaths=**} {
      allow read: if true;
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

    // Solo un admin puede escribir (subir/borrar) imágenes en la carpeta de figuras.
    match /figures/{allPaths=**} {
       allow write: if isAdmin();
    }
  }
}
*/
