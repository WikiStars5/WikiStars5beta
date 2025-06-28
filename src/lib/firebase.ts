
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
    
    // --- Reglas de Figuras (figures) ---
    match /figures/{figureId} {
      // PERMITE a cualquiera leer la lista de figuras (para sitemap) y perfiles individuales.
      allow get, list: if true;
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
      // Un usuario puede crear su propio perfil, y leerlo/actualizarlo.
      allow create, get, update: if isRegisteredUser() && request.auth.uid == userId;
      // Solo el administrador puede listar o eliminar usuarios.
      allow list, delete: if isAdmin();
    }
    
    // --- Reglas de Comentarios (userComments) ---
    match /userComments/{commentId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if (isSignedIn() && resource.data.userId == request.auth.uid) || isAdmin();
    }
    
    // --- Reglas para Votos y Actividad del Usuario (CORREGIDO) ---
    // La clave aquí es que la consulta `where('userId', '==', request.auth.uid)` del cliente
    // restringe los resultados a los documentos que la regla `read` permite.
    
    match /userAttitudes/{docId} {
      allow read, delete: if isSignedIn() && request.auth.uid == resource.data.userId;
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
    }
    
    match /userPerceptions/{docId} {
       allow read, delete: if isSignedIn() && request.auth.uid == resource.data.userId;
       allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
    }
    
    match /userStarRatings/{docId} {
       allow read, delete: if isSignedIn() && request.auth.uid == resource.data.userId;
       allow create: if isSignedIn() && request.auth.uid == request.resource.data.userId;
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
