
import { getFiguresByTag } from "@/lib/placeholder-data";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tag } from "lucide-react";
import type { Metadata } from 'next';

interface TagPageProps {
  params: { tag: string };
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string: string) {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const decodedTag = decodeURIComponent(params.tag);
  const displayTag = capitalizeFirstLetter(decodedTag);
  return {
    title: `Figuras etiquetadas como "${displayTag}"`,
    description: `Explora todas las figuras públicas etiquetadas como "${displayTag}" en WikiStars5.`,
    alternates: {
      canonical: `/figures/tagged/${params.tag}`,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag: encodedTag } = params;
  const decodedTag = decodeURIComponent(encodedTag);
  
  // Capitalize the tag to match the casing stored in Firestore
  const searchTag = capitalizeFirstLetter(decodedTag);

  const figures = await getFiguresByTag(searchTag);

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="flex justify-center items-center gap-3">
             <Tag className="h-8 w-8 text-primary" />
             <h1 className="text-4xl font-bold font-headline">Etiqueta: {searchTag}</h1>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          {figures.length} {figures.length === 1 ? 'perfil encontrado' : 'perfiles encontrados'} con esta etiqueta.
        </p>
      </section>

      {figures.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {figures.map((figure) => (
            <FigureListItem key={figure.id} figure={figure} />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertTitle>No se encontraron resultados</AlertTitle>
          <AlertDescription>
            No hay perfiles que coincidan con la etiqueta "{searchTag}".
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
