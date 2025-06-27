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
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Funciones de Ayuda ---
    function isAdmin() {
      // UID del administrador. ¡REEMPLAZAR SI ES NECESARIO!
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }
    function isSignedIn() {
      // Verdadero para usuarios registrados y anónimos.
      return request.auth != null;
    }
    function isRegisteredUser() {
      // Un usuario registrado no es anónimo.
      return isSignedIn() && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
    function isOwner(userId) {
      // Comprueba si el UID de la solicitud coincide con el ID de usuario proporcionado.
      return request.auth.uid == userId;
    }
    
    // --- Reglas de Figuras (figures) ---
    match /figures/{figureId} {
      allow read: if true;
      allow create, delete: if isAdmin();
      allow update: if isRegisteredUser() || isAdmin();

      match /galleryImages/{imageId} {
        allow read: if true;
        allow create: if isRegisteredUser() && request.resource.data.userId == request.auth.uid;
        allow update, delete: if (isRegisteredUser() && resource.data.userId == request.auth.uid) || isAdmin();
      }
    }

    // --- Reglas de Usuarios (registered_users) ---
    match /registered_users/{userId} {
      allow get, update: if isRegisteredUser() && isOwner(userId);
      allow list, create, delete: if isAdmin();
    }
    
    // --- Reglas de Comentarios (userComments) ---
    match /userComments/{commentId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if (isSignedIn() && resource.data.userId == request.auth.uid) || isAdmin();
    }
    
    // --- Reglas para Votos (Actitud, Percepción, Calificaciones) ---
    // Este es el patrón correcto para datos propiedad del usuario.
    function isOwnerOfDoc() {
      return request.auth.uid == resource.data.userId;
    }
    
    function isCreatingOwnDoc() {
      return request.auth.uid == request.resource.data.userId;
    }

    match /userAttitudes/{docId} {
      // Un usuario puede LEER (get) o BORRAR su propio voto.
      allow get, delete: if isSignedIn() && isOwnerOfDoc();
      // Un usuario puede CREAR un voto para sí mismo.
      allow create: if isSignedIn() && isCreatingOwnDoc();
      // Un usuario puede LISTAR (query) solo sus propios votos.
      allow list: if isSignedIn() && request.query.userId == request.auth.uid;
    }
    
    match /userPerceptions/{docId} {
       allow get, delete: if isSignedIn() && isOwnerOfDoc();
       allow create: if isSignedIn() && isCreatingOwnDoc();
       allow list: if isSignedIn() && request.query.userId == request.auth.uid;
    }
    
    match /userStarRatings/{docId} {
       allow get, delete: if isSignedIn() && isOwnerOfDoc();
       allow create: if isSignedIn() && isCreatingOwnDoc();
       allow list: if isSignedIn() && request.query.userId == request.auth.uid;
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
