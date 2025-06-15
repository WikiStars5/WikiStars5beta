
import { FigureListItem } from "@/components/figures/FigureListItem";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { SearchBar } from "@/components/shared/SearchBar";
import { Metadata } from "next";

/*
RECOMMENDED FIRESTORE RULES TO DEBUG PERMISSION ISSUES:
(Apply these in your Firebase Console -> Firestore Database -> Rules)

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- Rules for 'figures' collection ---
    match /figures/{figureId} {
      allow get: if true; // PUBLIC ACCESS: Allow anyone to read (get) individual figure documents.

      // ADMIN-ONLY ACCESS: Allow ONLY the admin (UID: JZP4A5GvZUbWuT0Y1DIiawWcSUp2)
      // to create and delete figure documents if they are NOT anonymous.
      allow create, delete: if request.auth != null &&
                              !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                              request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

      // AUTHENTICATED NON-ANONYMOUS USER ACCESS for updates:
      allow update: if request.auth != null &&
                      !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                      (
                        // Admin can update any field
                        request.auth.uid == 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'
                        ||
                        // Non-admin, non-anonymous users can update specific fields
                        (
                          (
                            request.resource.data.description != resource.data.description ||
                            request.resource.data.nationality != resource.data.nationality ||
                            request.resource.data.occupation != resource.data.occupation ||
                            request.resource.data.gender != resource.data.gender ||
                            request.resource.data.perceptionCounts != resource.data.perceptionCounts
                          ) &&
                          request.resource.data.name == resource.data.name &&
                          request.resource.data.id == resource.data.id // Prevent ID change
                        )
                      );
    }

    match /figures {
      allow list: if true; // PUBLIC ACCESS: Allow anyone to list all documents.
    }
    // --- End of rules for 'figures' collection ---

    // --- Rules for 'userPerceptions' collection ---
    match /userPerceptions/{perceptionDocId} {
      function getUserIdFromDocId() { return perceptionDocId.split('_')[0]; }
      function getFigureIdFromDocId() { return perceptionDocId.split('_')[1]; }
      function isOwnerNonAnonymous() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == resource.data.userId &&
               request.auth.uid == getUserIdFromDocId();
      }
      function isCreatingOwnValidDocNonAnonymous() {
        return request.auth != null &&
               !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
               request.auth.uid == request.resource.data.userId &&
               request.auth.uid == getUserIdFromDocId() &&
               request.resource.data.figureId == getFigureIdFromDocId() &&
               request.resource.data.keys().hasAll(['userId', 'figureId', 'emotion', 'timestamp']) &&
               request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      }
      allow read, delete: if isOwnerNonAnonymous();
      allow update: if isOwnerNonAnonymous() &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['emotion', 'timestamp']) &&
                      request.resource.data.emotion in ['alegria', 'envidia', 'tristeza', 'miedo', 'desagrado', 'furia'];
      allow create: if isCreatingOwnValidDocNonAnonymous();
    }
    // --- End of rules for 'userPerceptions' collection ---

    // --- Rules for 'users' collection ---
    match /users/{userId} {
      allow read: if request.auth != null &&
                     request.auth.uid == userId &&
                     !request.auth.token.firebase.sign_in_provider.matches('anonymous');
      allow create: if request.auth != null &&
                       request.auth.uid == userId &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
                       request.resource.data.uid == userId &&
                       request.resource.data.role == 'user' &&
                       request.resource.data.keys().hasAll([
                         'uid', 'email', 'username', 'photoURL',
                         'country', 'countryCode', 'role',
                         'createdAt', 'lastLoginAt'
                       ]);
      allow update: if request.auth != null &&
                       request.auth.uid == userId &&
                       !request.auth.token.firebase.sign_in_provider.matches('anonymous') &&
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

export const metadata: Metadata = {
  title: "Explorar Figuras - StarSage",
  description: "Explora todos los perfiles de figuras públicas en StarSage, obtenidos de Firestore.",
};

export const revalidate = 0; // Or a reasonable time like 3600 for an hour

export default async function BrowseFiguresPage() {
  const allFigures = await getAllFiguresFromFirestore();

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-4">Explorar Todas las Figuras</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Encuentra a tus celebridades, políticos, atletas favoritos y más. Datos cargados desde Firestore.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBar />
        </div>
      </section>

      {allFigures.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allFigures.map((figure) => (
            <FigureListItem key={figure.id} figure={figure} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg py-10">
          No se encontraron figuras públicas en Firestore. ¡Vuelve pronto o añade algunas en el panel de administración!
        </p>
      )}
    </div>
  );
}
