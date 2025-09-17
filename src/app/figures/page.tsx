

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
    page?: string;
  };
}

export default async function BrowseFiguresPage({ searchParams }: BrowseFiguresPageProps) {
  const currentPage = Number(searchParams?.page || '1');
  const totalFigures = await getFiguresCount();
  const totalPages = Math.ceil(totalFigures / PUBLIC_FIGURES_PER_PAGE);

  const { figures } = await getPublicFiguresList({
    page: currentPage,
  });

  return (
    <FiguresPageClient
      initialFigures={figures}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
