"use client";

import { useState, useEffect } from "react";
import { ForYouSection } from "@/components/foryou/ForYouSection";
import type { Figure } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Loader2 } from "lucide-react";
import { getFeaturedFiguresFromFirestore, getPublicFiguresList } from "@/lib/placeholder-data";


interface RecommendationSection {
  title: string;
  description: string;
  figures: Figure[];
}

export default function ForYouPage() {
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch featured and recent figures directly instead of using a complex function
        const [featuredFigures, recentFiguresResult] = await Promise.all([
          getFeaturedFiguresFromFirestore(10),
          getPublicFiguresList({ limit: 10 }) // Fetches the most recent by name
        ]);

        const sections: RecommendationSection[] = [];
        const includedIds = new Set<string>();

        if (featuredFigures.length > 0) {
          sections.push({
            title: "Selección Destacada",
            description: "Figuras populares y relevantes seleccionadas por nuestro equipo.",
            figures: featuredFigures,
          });
          featuredFigures.forEach(f => includedIds.add(f.id));
        }

        const recentFigures = recentFiguresResult.figures.filter(f => !includedIds.has(f.id));
        if (recentFigures.length > 0) {
           sections.push({
            title: "Añadidos Recientemente",
            description: "Descubre los perfiles más nuevos en la plataforma.",
            figures: recentFigures,
          });
        }
        
        setRecommendations(sections);

      } catch (err: any) {
        console.error("Error fetching recommendations data:", err);
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-2">Para Ti</h1>
        <p className="text-lg text-muted-foreground">
          Recomendaciones de figuras basadas en tendencias y popularidad.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Buscando recomendaciones...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Error al Cargar Recomendaciones</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : recommendations.length === 0 ? (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>¡Aún no hay recomendaciones para ti!</AlertTitle>
          <AlertDescription>
            Añade figuras o márcalas como destacadas en el panel de administración para que aparezcan aquí.
          </AlertDescription>
        </Alert>
      ) : (
        recommendations.map((section) => (
          <ForYouSection
            key={section.title}
            title={section.title}
            description={section.description}
            figures={section.figures}
          />
        ))
      )}
    </div>
  );
}
