// === src/lib/firebase.ts ===
// Configuración y servicios de Firebase para tu aplicación.
// Incluye Firestore, Authentication y Storage.

// Importa las funciones básicas para inicializar la aplicación de Firebase
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

// Importa los SDK específicos para los servicios que vas a usar:
// getStorage para Firebase Storage (almacenamiento de archivos como imágenes)
import { getStorage, type FirebaseStorage } from "firebase/storage";
// getFirestore para Cloud Firestore (tu base de datos para perfiles de famosos, valoraciones, etc.)
import { getFirestore, type Firestore } from "firebase/firestore";
// getAuth para Firebase Authentication (gestión de usuarios y sus sesiones)
import { getAuth, type Auth } from "firebase/auth";

// Tu configuración de Firebase para la aplicación web.
// ¡MUY IMPORTANTE! Asegúrate de que estos valores coincidan EXACTAMENTE
// con los que obtuviste de la Consola de Firebase para tu proyecto ACTIVO: wikistars5-2yctr
const firebaseConfig = {
  apiKey: "AIzaSyCwH29ruiIl_pohEoUHh7d26m5qCLCmYm0", // Tu clave API única
  authDomain: "wikistars5-2yctr.firebaseapp.com",    // Tu dominio de autenticación
  projectId: "wikistars5-2yctr",                     // Tu ID de proyecto (¡ESTE ES EL CORRECTO!)

  // ¡ATENCIÓN ESPECIAL A ESTA LÍNEA (storageBucket)!
  // Ahora apunta a tu bucket de Storage del proyecto activo: wikistars5-2yctr.firebasestorage.app
  storageBucket: "wikistars5-2yctr.firebasestorage.app", // Asegúrate de que este es el valor CORRECTO de tu bucket
  
  messagingSenderId: "939359993461",
  appId: "1:939359993461:web:c8aab67046db949495823c",
  measurementId: "G-XCFCPXNP56" // Asegúrate de que este ID sea correcto para tu proyecto si usas Analytics
};

// Inicializa Firebase. Este bloque maneja la inicialización para evitar el error "app/duplicate-app".
let app: FirebaseApp;
try {
  // Intenta obtener una instancia de la aplicación Firebase si ya fue inicializada.
  app = getApp(); // Por defecto, busca la app llamada '[DEFAULT]'
} catch (e) {
  // Si no se encuentra ninguna instancia existente, inicializa una nueva.
  app = initializeApp(firebaseConfig);
}

// Exporta las instancias de los servicios de Firebase para que puedas utilizarlas
// en cualquier parte de tu aplicación (ej. para guardar datos, subir imágenes, gestionar usuarios).
export const storage: FirebaseStorage = getStorage(app); // Instancia del servicio de Storage
export const db: Firestore = getFirestore(app);           // Instancia del servicio de Firestore Database
export const auth: Auth = getAuth(app);                 // Instancia del servicio de Authentication

// También puedes exportar la instancia de la app en sí si la necesitas en otros lugares.
export { app };

// === REGLAS DE SEGURIDAD DE FIRESTORE (PARA REFERENCIA - APLICAR EN CONSOLA FIREBASE) ===
/*
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Rules for 'figures' collection ---
    match /figures/{figureId} {
      allow get: if true; // PUBLIC ACCESS: Allow anyone to read (get) individual figure documents.

      allow create, delete: if request.auth != null && // ADMIN-ONLY create/delete
                              !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                              request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

      allow update: if request.auth != null && // Authenticated users for updates
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      (
                        // Admin can update any field
                        request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'
                        ||
                        // Case 1: Non-admin updating descriptive/interactive fields OR photoUrl from the figure page.
                        (
                          ( // At least one of these fields must be changing
                            request.resource.data.description != resource.data.description ||
                            request.resource.data.nationality != resource.data.nationality ||
                            request.resource.data.occupation != resource.data.occupation ||
                            request.resource.data.gender != resource.data.gender ||
                            request.resource.data.photoUrl != resource.data.photoUrl || // photoUrl can change
                            request.resource.data.perceptionCounts != resource.data.perceptionCounts ||
                            request.resource.data.attitudeCounts != resource.data.attitudeCounts
                          ) &&
                          // And these critical fields must match their existing values (i.e., not being changed by this update path)
                          request.resource.data.name == resource.data.name &&
                          request.resource.data.nameLower == resource.data.nameLower
                        )
                      );
    }

    match /figures { // Rule for listing the 'figures' collection
      allow list: if true; // PUBLIC ACCESS: Allow anyone to list all figure documents.
    }
    // --- End of rules for 'figures' collection ---

    // --- Rules for 'userPerceptions' collection (for emotions) ---
    match /userPerceptions/{perceptionDocId} {
      function getUserIdFromDocIdPerc() { return perceptionDocId.split('_')[0]; }
      function isOwnerNonAnonymousPerc() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdPerc();
      }
      function isCreatingOwnValidDocNonAnonymousPerc() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdPerc() &&
               request.resource.data.figureId == perceptionDocId.split('_')[1] && 
               request.resource.data.keys().hasAll(['userId', 'figureId', 'emotion', 'timestamp']) &&
               request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      }
      allow read, delete: if isOwnerNonAnonymousPerc();
      allow update: if isOwnerNonAnonymousPerc() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emotion', 'timestamp']) &&
                      request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      allow create: if isCreatingOwnValidDocNonAnonymousPerc();
    }
    // --- End of rules for 'userPerceptions' collection ---

    // --- Rules for 'userAttitudes' collection (for fan, simp, hater, neutral) ---
    match /userAttitudes/{attitudeDocId} {
      function getUserIdFromDocIdAtt() { return attitudeDocId.split('_')[0]; }
      function isOwnerNonAnonymousAtt() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdAtt();
      }
      function isCreatingOwnValidDocNonAnonymousAtt() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocIdAtt() &&
               request.resource.data.figureId == attitudeDocId.split('_')[1] && 
               request.resource.data.keys().hasAll(['userId', 'figureId', 'attitude', 'timestamp']) &&
               request.resource.data.attitude in ['neutral', 'fan', 'simp', 'hater'];
      }
      allow read, delete: if isOwnerNonAnonymousAtt();
      allow update: if isOwnerNonAnonymousAtt() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['attitude', 'timestamp']) &&
                      request.resource.data.attitude in ['neutral', 'fan', 'simp', 'hater'];
      allow create: if isCreatingOwnValidDocNonAnonymousAtt();
    }
    // --- End of rules for 'userAttitudes' collection ---

    // --- Rules for 'users' collection (user profiles) ---
    match /users/{userId} {
      allow read: if request.auth != null &&
                     !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                     request.auth.uid == userId;
      allow create: if request.auth != null &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       request.auth.uid == userId &&
                       request.resource.data.uid == userId &&
                       request.resource.data.role == 'user' &&
                       request.resource.data.keys().hasAll([
                         'uid', 'email', 'username', 'photoURL',
                         'country', 'countryCode', 'role',
                         'createdAt', 'lastLoginAt'
                       ]);
      allow update: if request.auth != null &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       request.auth.uid == userId &&
                       !(request.resource.data.diff(resource.data).affectedKeys().hasAny([
                         'uid', 'email', 'createdAt', 'role' 
                       ])) &&
                       (request.resource.data.photoURL == resource.data.photoURL || request.resource.data.photoURL == request.auth.token.picture);
      allow delete: if false;
    }
    // --- End of rules for 'users' collection ---
  }
}
*/
