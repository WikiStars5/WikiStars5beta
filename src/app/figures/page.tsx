

import { getPublicFiguresList, getFiguresCount, PUBLIC_FIGURES_PER_PAGE } from "@/lib/placeholder-data";
import { FiguresPageClient } from "@/app/figures/FiguresPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar Figuras - WikiStars5",
  description: "Explora todos los perfiles de figuras públicas en WikiStars5, obtenidos de Firestore.",
  alternates: {
    canonical: "/figures",
  },
};

export const revalidate = 60; // Revalidate every 60 seconds

interface BrowseFiguresPageProps {
  searchParams?: {
    startAfter?: string;
    endBefore?: string;
  };
}

export default async function BrowseFiguresPage({ searchParams }: BrowseFiguresPageProps) {
  const { figures, hasPrevPage, hasNextPage, startCursor, endCursor } = await getPublicFiguresList({
    startAfter: searchParams?.startAfter,
    endBefore: searchParams?.endBefore,
  });

  return (
    <FiguresPageClient
      initialFigures={figures}
      hasPrevPage={hasPrevPage}
      hasNextPage={hasNextPage}
      startCursor={startCursor}
      endCursor={endCursor}
    />
  );
}
