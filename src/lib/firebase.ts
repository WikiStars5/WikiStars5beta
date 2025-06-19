
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
// ASEGÚRATE DE QUE LA ANIDACIÓN DE 'galleryImages' SEA CORRECTA.
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- REGLAS PARA LA COLECCIÓN figures Y SU SUBCOLECCIÓN galleryImages ---
    match /figures/{figureId} {
      // Regla permisiva para el documento principal de la figura
      allow read: if true; // O para más granularidad: allow get: if true; allow list: if true;
      allow write: if request.auth != null; // Permite escritura al documento principal si el usuario está autenticado
                                         // O 'if true;' para MÁXIMA permisividad en desarrollo

      // REGLAS ESPECÍFICAS PARA LA SUBCOLECCIÓN galleryImages (ANIDADA DENTRO DE figures/{figureId})
      // Estas reglas se aplican a la ruta: /figures/{ALGUN_FIGURE_ID}/galleryImages/{ALGUN_GALLERYIMAGE_ID}
      match /galleryImages/{galleryImageId} { // Cambié {imageId} a {galleryImageId} para evitar confusión
        
        // !! REGLA EXTREMADAMENTE PERMISIVA PARA DEPURACIÓN URGENTE !!
        // SI ESTO NO FUNCIONA, EL PROBLEMA NO ES LA CONDICIÓN DE LA REGLA SINO LA RUTA/ESTRUCTURA O ALGO MÁS FUNDAMENTAL.
        // ¡RECUERDA CAMBIAR ESTO A UNA REGLA SEGURA DESPUÉS DE DEPURAR!
        allow read, write: if true; 

        // REGLA SEGURA RECOMENDADA (una vez que funcione lo anterior):
        // allow read: if true;
        // allow create: if request.auth != null &&
        //                  !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
        //                  request.resource.data.userId == request.auth.uid &&
        //                  request.resource.data.imageUrl != null;
        // allow delete: if request.auth != null && (request.auth.uid == resource.data.userId || isAdmin()); // Define isAdmin()
        // allow update: if request.auth != null && request.auth.uid == resource.data.userId; // Ejemplo
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
  }
}
*/
