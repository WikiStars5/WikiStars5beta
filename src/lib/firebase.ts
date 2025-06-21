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
    
    // --- REGLAS DE DESARROLLO (MUY PERMISIVAS) ---
    // ADVERTENCIA: Estas reglas son para probar la lógica de la app.
    // CUALQUIER usuario autenticado (incluidos invitados) puede leer y escribir datos.
    // Esto debería restringirse antes de pasar a producción.

    // Colección de figuras
    match /figures/{figureId} {
      // Cualquiera puede leer.
      allow read: if true;
      // Cualquier usuario autenticado puede actualizar.
      // Solo el administrador puede crear y eliminar para evitar borrados accidentales.
      allow update: if request.auth != null;
      allow create, delete: if isAdmin();

      // Subcolección de galería de imágenes
      match /galleryImages/{galleryImageId} {
        allow read: if true;
        // Solo usuarios no anónimos pueden crear/actualizar/eliminar imágenes.
        allow write: if request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
      }
    }

    // Perfiles de usuario: Solo el propio usuario o el admin pueden escribir.
    match /registered_users/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }

    // Votos y comentarios: Cualquier usuario autenticado (incluido anónimo) puede escribir.
    match /userPerceptions/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /userAttitudes/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /userStarRatings/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /userComments/{commentId} {
      allow read: if true;
      // Cualquier usuario autenticado puede crear.
      allow create: if request.auth != null;
      // Para actualizar/eliminar: debe ser el dueño del comentario o un admin.
      // Esta regla es menos permisiva pero necesaria para evitar que cualquiera borre comentarios.
      allow update, delete: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
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
