import { FigureListItem } from "@/components/figures/FigureListItem";
import { FIGURES_DATA } from "@/lib/placeholder-data";
import { SearchBar } from "@/components/shared/SearchBar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Figures - StarSage",
  description: "Explore all public figure profiles on StarSage.",
};

export default function BrowseFiguresPage() {
  // In a real app, this would involve pagination and server-side filtering
  const allFigures = FIGURES_DATA;

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-4">Browse All Figures</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Find your favorite celebrities, politicians, athletes, and more.
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
          No public figures found. Check back soon!
        </p>
      )}
      {/* Add pagination controls here if needed */}
    </div>
  );
}
