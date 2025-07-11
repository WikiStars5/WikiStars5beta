import { getFeaturedFiguresFromFirestore, getPublicFiguresList } from "@/lib/placeholder-data";
import { FigureListItem } from "@/components/figures/FigureListItem";
import type { Figure } from "@/lib/types";
import { Sparkles, Star } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Para Ti - Descubre Figuras en WikiStars5",
  description: "Una selección de perfiles populares y destacados especialmente para ti.",
};

export const revalidate = 300; // Revalidate every 5 minutes

// Helper to shuffle an array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default async function ForYouPage() {
  // Fetch featured figures and a batch of the latest figures
  const featuredFiguresPromise = getFeaturedFiguresFromFirestore(8);
  const latestFiguresPromise = getPublicFiguresList({ limit: 20 });
  
  const [featuredFigures, { figures: latestFigures }] = await Promise.all([
    featuredFiguresPromise,
    latestFiguresPromise
  ]);

  // Combine, shuffle, and ensure no duplicates
  const allFigures = [...featuredFigures, ...latestFigures];
  const uniqueFigures = Array.from(new Map(allFigures.map(item => [item.id, item])).values());
  const recommendedFigures = shuffleArray(uniqueFigures).slice(0, 12); // Show up to 12 recommendations

  return (
    <div className="space-y-12">
      <section className="text-center">
        <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-3 rounded-full mb-4">
            <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-2">Para Ti</h1>
        <p className="text-lg text-muted-foreground">
          Una selección de perfiles populares y destacados para que descubras.
        </p>
      </section>

      {recommendedFigures.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendedFigures.map((figure) => (
            <FigureListItem key={figure.id} figure={figure} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg py-10">
          No hay figuras disponibles en este momento. ¡Vuelve pronto!
        </p>
      )}
    </div>
  );
}
