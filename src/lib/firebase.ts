
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
// REEMPLAZA TUS REGLAS EXISTENTES CON ESTAS PARA DEPURACIÓN.
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- REGLAS PARA LA COLECCIÓN figures Y SU SUBCOLECCIÓN galleryImages ---
    match /figures/{figureId} {
      // Regla permisiva para el documento de la figura.
      // Para desarrollo, puedes usar `allow read, write: if true;`
      // Para un poco más de seguridad mínima:
      allow read: if true;
      allow write: if request.auth != null; // Permite escritura si el usuario está autenticado (anónimo o no)

      // REGLAS ESPECÍFICAS PARA LA SUBCOLECCIÓN galleryImages (ANIDADA)
      // Esta es la parte CRÍTICA para la funcionalidad de la galería.
      match /galleryImages/{galleryImageId} {
        allow read: if true; // Todos pueden leer las imágenes de la galería

        // REGLA DE CREACIÓN SIMPLIFICADA PARA DEPURACIÓN:
        // Solo permite crear si el usuario está autenticado y NO es anónimo.
        // Esto coincide con la lógica de tu aplicación que verifica `!currentUser.isAnonymous`.
        allow create: if request.auth != null && 
                         !request.auth.token.firebase.sign_in_provider.matches('anonymous');

        // Si la regla de arriba AÚN FALLA, como ÚLTIMO RECURSO para depurar,
        // puedes probar temporalmente (¡Y RECUERDA CAMBIARLO DESPUÉS!):
        // allow create: if true; 

        // Para update y delete, puedes añadir reglas más específicas después:
        // allow update: if request.auth != null && request.auth.uid == resource.data.userId;
        // allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      }
    }
    // --- Fin de reglas para figures y galleryImages ---


    // --- OTRAS COLECCIONES PRINCIPALES (Mantenlas permisivas por ahora para depuración) ---
    match /userPerceptions/{docId} { allow read, write: if true; }
    match /userAttitudes/{docId} { allow read, write: if true; }
    match /userStarRatings/{docId} { allow read, write: if true; }
    match /users/{userId} { allow read, write: if true; }
    match /userComments/{commentId} { allow read, write: if true; }
  }
}
*/

// === REGLAS DE SEGURIDAD DE FIREBASE STORAGE (APLICAR EN CONSOLA FIREBASE STORAGE > REGLAS) ===
// Ve a Firebase Console -> Storage -> Rules.
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permite la lectura de todas las imágenes en la carpeta 'figures' y 'emociones'
    match /figures/{allPaths=**} {
      allow read: if true;
      // Permite la escritura en 'figures' solo al administrador (UID específico)
      allow write: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // ADMIN UID
    }
    match /emociones/{allPaths=**} {
      allow read: if true; // Permite a todos leer las imágenes de emociones
    }
    match /audio/{soundFilename} { // Rule for allowing public read access to audio files
      allow read: if true;
    }
    // Puedes añadir reglas más específicas para otras carpetas si es necesario.
    // Por ejemplo, para fotos de perfil de usuario:
    // match /userProfilePictures/{userId}/{allPaths=**} {
    //   allow read: if true;
    //   allow write: if request.auth != null && request.auth.uid == userId;
    // }
  }
}
*/

