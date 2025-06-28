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

    function isAdmin() {
      // Reemplaza esto con el UID de tu cuenta de administrador
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }

    // --- REGLAS DE DESARROLLO (MUY PERMISIVAS) ---
    // ADVERTENCIA: Estas reglas son para probar la lógica de la app.
    
    match /figures/{figureId} {
      // Cualquiera puede leer figuras individuales (get) y la lista completa (list) para el sitemap
      allow get, list: if true;
      
      // Los usuarios autenticados (incluidos anónimos) pueden actualizar los contadores
      allow update: if request.auth != null; 
      
      // Solo el admin puede crear o eliminar figuras
      allow create, delete: if isAdmin();

      match /galleryImages/{galleryImageId} {
        allow read: if true;
        allow write: if request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
      }
    }

    match /registered_users/{userId} {
      allow read, write: if request.auth != null && (request.auth.uid == userId || isAdmin());
    }

    match /userPerceptions/{docId} { allow read, write: if request.auth != null; }
    match /userAttitudes/{docId} { allow read, write: if request.auth != null; }
    match /userStarRatings/{docId} { allow read, write: if request.auth != null; }

    // Colección de comentarios de usuario
    match /userComments/{commentId} {
      allow read: if true;
      // Permitir escritura a CUALQUIERA para depurar y para que los anónimos puedan comentar.
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
