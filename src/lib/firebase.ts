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
// === ¡¡¡ATENCIÓN: SOLUCIÓN AL ERROR DE NOTIFICACIONES "403 Forbidden"!!! ===
// =======================================================================================
/*
El error "Request is missing required authentication credential" o "403 Forbidden"
al intentar obtener el token de notificación (FCM) se debe a que la clave de API
(apiKey de arriba) tiene restricciones de "referentes HTTP". Esto significa que la
clave solo puede ser usada desde dominios autorizados. El dominio de desarrollo
actual no está en la lista.

SIGUE ESTOS PASOS PARA SOLUCIONARLO:

1.  **ABRE ESTE ENLACE EN UNA NUEVA PESTAÑA:**
    https://console.cloud.google.com/apis/credentials?project=wikistars5-2yctr

2.  **ENCUENTRA LA CLAVE DE API:**
    Busca en la lista una clave llamada "Browser key (auto created by Firebase)" o similar.
    La clave correcta terminará en `...m5qCLCmYm0` (la misma que `apiKey` en este archivo).

3.  **EDITA LA CLAVE:**
    Haz clic en el nombre de la clave o en el icono del lápiz (Editar) a la derecha.

4.  **AÑADE LOS DOMINIOS PERMITIDOS:**
    - Dentro de la sección "Restricciones de la aplicación", asegúrate de que "Referentes HTTP (sitios web)" esté seleccionado.
    - En la sección "Restricciones de sitios web", haz clic en "**AÑADIR UN ELEMENTO**".
    - Añade los siguientes cuatro (4) referentes, uno por uno:

      - **Referente 1:** `localhost`
      - **Referente 2:** `*.google.com`
      - **Referente 3 (CRÍTICO):** `*.cloudworkstations.dev`
      - **Referente 4:** `wikistars5-2yctr.web.app` (Tu dominio de producción)

    *Nota: El asterisco (*) es un comodín. `*.cloudworkstations.dev` permitirá que cualquier subdominio de desarrollo funcione.*

5.  **GUARDA LOS CAMBIOS:**
    Haz clic en el botón azul "Guardar" en la parte inferior. Los cambios pueden tardar hasta 5 minutos en propagarse.

6.  **PRUEBA DE NUEVO:**
    Vuelve a tu aplicación, recarga la página completamente y trata de activar las notificaciones. El error 403 debería haber desaparecido.
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
