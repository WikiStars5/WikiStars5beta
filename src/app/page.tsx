
"use client";

import React, { useState, useEffect } from 'react';
import { getFeaturedFiguresFromFirestore } from '@/lib/placeholder-data';
import type { Figure } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { ForYouSection } from '@/components/foryou/ForYouSection';
import { SearchBar } from '@/components/shared/SearchBar';

export default function HomePage() {
  const [featuredFigures, setFeaturedFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFigures = async () => {
      try {
        const figures = await getFeaturedFiguresFromFirestore(10); 
        setFeaturedFigures(figures);
      } catch (err: any) {
        console.error("Error fetching featured figures:", err);
        setError("No se pudieron cargar las figuras destacadas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFigures();
  }, []);

  return (
    <div className="space-y-12">
      <section className="text-center py-10">
        <h1 className="text-5xl font-bold font-headline mb-4 tracking-tight">
          La Percepción del Mundo, en tus Manos
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Explora, califica y debate sobre las figuras públicas que moldean nuestra realidad. Tu opinión cuenta.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBar />
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-10">{error}</div>
      ) : (
        <ForYouSection title="Figuras Destacadas" figures={featuredFigures} />
      )}
    </div>
  );
}
