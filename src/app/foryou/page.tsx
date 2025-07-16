
"use client";

import { useState, useEffect } from "react";
import { ForYouSection } from "@/components/foryou/ForYouSection";
import type { Figure } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Loader2 } from "lucide-react";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";

// Fisher-Yates shuffle algorithm
function shuffleArray(array: any[]) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

interface RecommendationSection {
  title: string;
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
        const allFigures = await getAllFiguresFromFirestore();
        
        if (allFigures.length === 0) {
          setRecommendations([]);
          setIsLoading(false);
          return;
        }

        // Shuffle the array to get random figures for our sections
        const shuffledFigures = shuffleArray([...allFigures]);

        const sections: RecommendationSection[] = [];
        
        // Create a "Sugerencias para ti" section with up to 10 figures
        const suggestions = shuffledFigures.slice(0, 10);
        if (suggestions.length > 0) {
          sections.push({
            title: "Sugerencias para ti",
            figures: suggestions
          });
        }

        // Create a "Descubrimientos" section with the next 10 figures
        const discoveries = shuffledFigures.slice(10, 20);
        if (discoveries.length > 0) {
          sections.push({
            title: "Descubrimientos",
            figures: discoveries
          });
        }
        
        setRecommendations(sections);

      } catch (err: any) {
        console.error("Error fetching figures for For You page:", err);
        setError(`Error al cargar datos: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-12">
      <div className="text-left">
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
          <AlertTitle>¡Aún no hay recomendaciones!</AlertTitle>
          <AlertDescription>
            Añade figuras en el panel de administración para que aparezcan aquí.
          </AlertDescription>
        </Alert>
      ) : (
        recommendations.map((section) => (
          <ForYouSection
            key={section.title}
            title={section.title}
            figures={section.figures}
          />
        ))
      )}
    </div>
  );
}
