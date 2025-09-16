
import { getFigureFromFirestore } from "@/lib/placeholder-data";
import { notFound } from "next/navigation";
import { FigureDetailClient } from "./FigureDetailClient";
import type { Metadata, ResolvingMetadata } from 'next';

interface FigurePageProps {
  params: { id: string };
}

// Revalidation has been removed to rely on client-side fetching for real-time updates.
// export const revalidate = 60; 

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params: { id } }: FigurePageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const figure = await getFigureFromFirestore(id);

  if (!figure) {
    return {
      title: "Figura no encontrada",
      description: "La figura que buscas no existe o fue eliminada.",
    };
  }

  // Truncate description for meta tag
  const description = figure.description 
    ? (figure.description.length > 155 ? figure.description.substring(0, 155) + '...' : figure.description)
    : `Explora el perfil, opiniones y calificaciones de ${figure.name} en WikiStars5.`;

  return {
    title: `Perfil de ${figure.name} - WikiStars5`,
    description: description,
    alternates: {
      canonical: `/figures/${id}`,
    },
    openGraph: {
      title: `Perfil de ${figure.name} - WikiStars5`,
      description: description,
      images: [
        {
          url: figure.photoUrl || 'https://placehold.co/600x400.png',
          width: 800,
          height: 600,
          alt: `Imagen de ${figure.name}`,
        },
      ],
    },
  };
}

export default async function FigurePage({ params: { id } }: FigurePageProps) {
  const figure = await getFigureFromFirestore(id);

  if (!figure) {
    notFound();
  }

  // Pass the server-fetched data to the client component for initial render
  return <FigureDetailClient initialFigure={figure} />;
}
