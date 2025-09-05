
"use client";

import { useState } from "react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { SearchBar } from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import type { Figure } from "@/lib/types";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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

  const [figures] = useState<Figure[]>(initialFigures);


  const renderContent = () => {
    if (figures.length > 0) {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {figures.map((figure) => (
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
      );
    }

    return (
        <Alert>
          <AlertTitle>No se encontraron figuras</AlertTitle>
          <AlertDescription>
            Actualmente no hay perfiles de figuras públicas en la base de datos.
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-4">Explorar Todas las Figuras</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Encuentra a tus celebridades, políticos, atletas favoritos y más. Datos cargados desde Firestore.
        </p>
        <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
          <SearchBar />
        </div>
      </section>

      {renderContent()}
    </div>
  );
}
