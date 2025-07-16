"use client";

import { useState, useEffect } from "react";
import { ForYouSection } from "@/components/foryou/ForYouSection";
import type { Figure } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, Loader2 } from "lucide-react";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

interface RecommendationSection {
  title: string;
  description: string;
  figures: Figure[];
}

const getRecommendationsCallable = httpsCallable<void, { success: boolean, recommendations: RecommendationSection[], error?: string }>(getFunctions(app), 'getForYouRecommendations');

export default function ForYouPage() {
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRecommendationsCallable();
        const data = result.data;
        
        if (data.success) {
          setRecommendations(data.recommendations);
        } else {
          setError(data.error || "No se pudieron cargar las recomendaciones.");
        }
      } catch (err: any) {
        console.error("Error calling getForYouRecommendations function:", err);
        setError(`Error al llamar a la función de Firebase: ${err.message}`);
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
            A medida que explores y califiques más figuras, podremos ofrecerte mejores sugerencias. ¡Empieza a explorar para personalizar tu experiencia!
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
