
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
// REEMPLAZA TUS REGLAS EXISTENTES CON ESTAS.
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ADVERTENCIA: ESTAS REGLAS SON ALTAMENTE PERMISIVAS Y SOLO PARA DESARROLLO.
    // NO USAR EN PRODUCCIÓN.

    // Función para verificar si el usuario es el administrador
    function isAdmin() {
      // REEMPLAZA CON TU ADMIN UID REAL SI ES NECESARIO PARA REGLAS MÁS ESPECÍFICAS
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }

    // Función para verificar si el usuario está autenticado y no es anónimo
    function isAuthenticatedNonAnonymous() {
      return request.auth != null && !request.auth.token.firebase.sign_in_provider.matches('anonymous');
    }

    // --- REGLAS PARA LA COLECCIÓN figures Y SU SUBCOLECCIÓN galleryImages ---
    match /figures/{figureId} {
      // Esta regla general permite leer/escribir en el documento de la figura
      // y, por defecto, también en sus subcolecciones si no hay reglas más específicas.
      // Para desarrollo, esto está bien. En producción, querrías ser más específico.
      allow read, write: if true; // Permisivo para desarrollo

      // REGLAS ESPECÍFICAS PARA LA SUBCOLECCIÓN galleryImages (ANIDADA)
      // Estas reglas se aplican a la ruta: /figures/{figureId}/galleryImages/{galleryImageId}
      match /galleryImages/{galleryImageId} {
        allow read: if true; // Todos pueden leer las imágenes de la galería

        allow create: if request.auth != null &&
                         !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                         request.resource.data.userId == request.auth.uid &&
                         request.resource.data.imageUrl != null;
                         // Correcto: ya no se comprueba request.resource.data.createdAt == request.time para 'create'

        // Opcional: permitir borrar al admin o al usuario que subió la imagen
        // allow delete: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin());
        // Opcional: permitir actualizar (ej. para un sistema de likes en imágenes)
        // allow update: if request.auth != null;
      }
    }
    // --- Fin de reglas para figures y galleryImages ---


    // --- OTRAS COLECCIONES PRINCIPALES ---
    match /userPerceptions/{perceptionDocId} {
      allow read, write: if true;
    }

    match /userAttitudes/{attitudeDocId} {
      allow read, write: if true;
    }

    match /userStarRatings/{starRatingDocId} {
      allow read, write: if true;
    }

    match /users/{userId} {
      allow read, write: if true;
    }

    // --- REGLAS PARA LA COLECCIÓN userComments ---
    match /userComments/{commentId} {
      allow read, write: if true; // Permisivo para desarrollo

      // EJEMPLO DE REGLAS MÁS SEGURAS PARA userComments (PARA PRODUCCIÓN):
      // allow read: if true;
      // allow create: if isAuthenticatedNonAnonymous() &&
      //                 request.resource.data.userId == request.auth.uid &&
      //                 request.resource.data.figureId != null &&
      //                 request.resource.data.text != null && request.resource.data.text.size() > 0 && request.resource.data.text.size() < 1000 &&
      //                 request.resource.data.username != null &&
      //                 // starRatingGiven puede ser null o un número entre 1 y 5
      //                 (request.resource.data.starRatingGiven == null || (request.resource.data.starRatingGiven >= 1 && request.resource.data.starRatingGiven <= 5)) &&
      //                 request.resource.data.likes == 0 &&
      //                 request.resource.data.dislikes == 0 &&
      //                 request.resource.data.likedBy.size() == 0 &&
      //                 request.resource.data.dislikedBy.size() == 0 &&
      //                 request.resource.data.createdAt == request.time; // Para 'create', el timestamp se puede validar así si es enviado por el cliente

      // allow update: if isAuthenticatedNonAnonymous() &&
      //                 (
      //                   // Autor editando su propio comentario (solo texto y updatedAt)
      //                   (resource.data.userId == request.auth.uid &&
      //                    request.resource.data.text != resource.data.text &&
      //                    request.resource.data.text.size() > 0 && request.resource.data.text.size() < 1000 &&
      //                    request.resource.data.updatedAt == request.time &&
      //                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'updatedAt']))
      //                   ||
      //                   // Otro usuario dando like/dislike (no el autor)
      //                   (resource.data.userId != request.auth.uid &&
      //                    (
      //                       request.resource.data.likes != resource.data.likes ||
      //                       request.resource.data.dislikes != resource.data.dislikes ||
      //                       request.resource.data.likedBy != resource.data.likedBy ||
      //                       request.resource.data.dislikedBy != resource.data.dislikedBy
      //                    ) &&
      //                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'dislikes', 'likedBy', 'dislikedBy']) &&
      //                    request.resource.data.figureId == resource.data.figureId &&
      //                    request.resource.data.userId == resource.data.userId &&
      //                    request.resource.data.text == resource.data.text &&
      //                    request.resource.data.createdAt == resource.data.createdAt
      //                   )
      //                 );

      // allow delete: if isAuthenticatedNonAnonymous() && (resource.data.userId == request.auth.uid || isAdmin());
    }
    // --- Fin de reglas para userComments ---

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
