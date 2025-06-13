
import { FigureListItem } from "@/components/figures/FigureListItem";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { SearchBar } from "@/components/shared/SearchBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Figures - WikiStars5",
  description: "Explore all public figure profiles on WikiStars5, sourced from Firestore.",
};

export const revalidate = 0; // Or a reasonable time like 3600 for an hour

export default async function BrowseFiguresPage() {
  const allFigures = await getAllFiguresFromFirestore();

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-4">Browse All Figures</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Find your favorite celebrities, politicians, athletes, and more. Data loaded from Firestore.
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
          No public figures found in Firestore. Check back soon or add some in the admin panel!
        </p>
      )}
    </div>
  );
}
