
"use client";

import { FigureListItem } from "@/components/figures/FigureListItem";
import { SearchBar } from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import type { Figure } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FiguresPageClientProps {
  initialFigures: Figure[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export function FiguresPageClient({
  initialFigures,
  hasPrevPage,
  hasNextPage,
  startCursor,
  endCursor,
}: FiguresPageClientProps) {
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

      {initialFigures.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {initialFigures.map((figure) => (
              <FigureListItem key={figure.id} figure={figure} />
            ))}
          </div>
          <div className="flex justify-center pt-6 border-t">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" disabled={!hasPrevPage}>
                <Link href={`/figures?endBefore=${startCursor}`}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Link>
              </Button>
              <Button asChild variant="outline" disabled={!hasNextPage}>
                <Link href={`/figures?startAfter=${endCursor}`}>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-muted-foreground text-lg py-10">
          No se encontraron figuras públicas en Firestore. ¡Vuelve pronto o añade algunas en el panel de administración!
        </p>
      )}
    </div>
  );
}
