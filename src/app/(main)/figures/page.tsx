
import { FigureListItem } from "@/components/figures/FigureListItem";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { SearchBar } from "@/components/shared/SearchBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar Figuras - WikiStars5",
  description: "Explora todos los perfiles de figuras públicas en WikiStars5, obtenidos de Firestore.",
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
