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

// =======================================================================================
// ===       ¡¡¡ATENCIÓN: SOLUCIÓN DEFINITIVA AL ERROR 403 Forbidden!!!                  ===
// =======================================================================================
/*
El error "Request is missing required authentication credential" o "403 Forbidden"
al intentar obtener el token de notificación (FCM) se debe a que la clave de API
(apiKey de arriba) tiene restricciones de "referentes HTTP". Esto significa que la
clave solo puede ser usada desde dominios autorizados. La captura que enviaste
era de la configuración de OAuth (para login), ¡pero el error está en la
configuración de la Clave de API!

**SIGUE ESTOS PASOS PARA SOLUCIONARLO DEFINITIVAMENTE:**

1.  **ABRE ESTE ENLACE EN UNA NUEVA PESTAÑA (lleva a la sección correcta de "Credenciales"):**
    https://console.cloud.google.com/apis/credentials?project=wikistars5-2yctr

2.  **ENCUENTRA Y EDITA LA CLAVE DE API CORRECTA:**
    - Busca la clave llamada "**Browser key (auto created by Firebase)**" en la lista.
    - Haz clic en el icono del lápiz (Editar) a la derecha de esa clave.

3.  **AÑADE LOS DOMINIOS DE DESARROLLO Y PRODUCCIÓN:**
    - Dentro de la sección "**Restricciones de sitios web**", haz clic en "**AÑADIR UN ELEMENTO**".
    - Añade los siguientes referentes UNO POR UNO (después de añadir uno, haz clic en "AÑADIR UN ELEMENTO" de nuevo para el siguiente):
      - `*.cloudworkstations.dev`  (Para que funcione en el editor)
      - `localhost`                 (Para pruebas locales)
      - `wikistars5-2yctr.web.app`  (Tu dominio de producción de Firebase)
      - `wikistars5.com`            (Tu dominio personalizado, si lo usas)

    - Tu lista final debería tener al menos esos 4 elementos (más `*.google.com` si ya estaba).

4.  **GUARDA LOS CAMBIOS:**
    Haz clic en el botón azul "Guardar". Los cambios pueden tardar hasta 5 minutos en aplicarse.

5.  **PRUEBA DE NUEVO:**
    Vuelve a tu aplicación (tanto en el editor como en la página de producción), recarga la página completamente y trata de activar las notificaciones. El error 403 debería haber desaparecido.
*/


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

    // =====================================================================
    // Helper Functions
    // =====================================================================
    function isAdmin() {
      // ¡Asegúrate de que este UID coincida con tu cuenta de administrador!
      return request.auth != null && request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // =====================================================================
    // Collection Rules
    // =====================================================================

    match /figures/{figureId} {
      allow get, list: if true;
      allow update: if isAuthenticated();
      allow create, delete: if isAdmin();
    }

    match /registered_users/{userId} {
      allow get, list: if isAdmin();
      allow create, update: if isOwner(userId);
      allow delete: if isAdmin();
    }

    match /userPerceptions/{docId} { allow read, write: if isAuthenticated(); }
    match /userAttitudes/{docId} { allow read, write: if isAuthenticated(); }
    match /userStarRatings/{docId} { allow read, write: if isAuthenticated(); }

    match /userComments/{commentId} {
      allow read: if true;
      allow create: if isAuthenticated();
      // Cualquier usuario autenticado puede actualizar (para likes/dislikes).
      // Solo el dueño del comentario o un admin pueden borrarlo.
      allow update: if isAuthenticated();
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
    
    match /notifications/{notificationId} {
      allow create: if isAuthenticated();
      // 'list' es para poder buscar las notificaciones de un usuario.
      // 'read'/'update' para verlas y marcarlas como leídas.
      // Solo el dueño (userId) o un admin puede hacerlo.
      allow list, read, update: if isOwner(resource.data.userId) || isAdmin();
      // Solo el dueño o un admin pueden borrarlas.
      allow delete: if isOwner(resource.data.userId) || isAdmin();
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
