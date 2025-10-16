

import { getFiguresByHashtag } from "@/lib/placeholder-data";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tag } from "lucide-react";
import type { Metadata } from 'next';

interface HashtagPageProps {
  params: { tag: string };
}

// Helper function to capitalize the first letter
function capitalizeFirstLetter(string: string) {
  if (!string) return string;
  // Handle multi-word tags like "k-pop"
  return string.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
}

export async function generateMetadata({ params }: HashtagPageProps): Promise<Metadata> {
  const decodedTag = decodeURIComponent(params.tag);
  // For display, we can still try to capitalize it nicely.
  const displayTag = capitalizeFirstLetter(decodedTag);
  return {
    title: `Perfiles con el hashtag #${displayTag}`,
    description: `Explora todos los perfiles públicos con el hashtag #${displayTag} en WikiStars5.`,
    alternates: {
      canonical: `/figures/hashtagged/${params.tag}`,
    },
  };
}

export default async function HashtagPage({ params }: HashtagPageProps) {
  const { tag: encodedTag } = params;
  // The tag from the URL is always lowercase.
  const searchTag = decodeURIComponent(encodedTag);
  const displayTag = capitalizeFirstLetter(searchTag);

  // We now pass the lowercase tag to the search function.
  const figures = await getFiguresByHashtag(searchTag);

  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="flex justify-center items-center gap-3">
             <Tag className="h-8 w-8 text-primary" />
             <h1 className="text-4xl font-bold font-headline">#{displayTag}</h1>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          {figures.length} {figures.length === 1 ? 'perfil encontrado' : 'perfiles encontrados'} con este hashtag.
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
            No hay perfiles que coincidan con el hashtag "#{displayTag}".
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
