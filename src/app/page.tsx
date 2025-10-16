"use client";

import { ForYouSection } from "@/components/foryou/ForYouSection";
import { Button } from "@/components/ui/button";
import type { Figure } from "@/lib/types";
import { MoveRight, Home, Search as SearchIcon, Lightbulb, Users2, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { getFeaturedFiguresFromFirestore } from '@/lib/placeholder-data';
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { SearchBar } from "@/components/shared/SearchBar";
import { CreateWebsiteProfile } from "@/components/admin/CreateWebsiteProfile";

function HeroSection() {
  return (
    <section className="text-center py-12 md:py-16">
      <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
        Bienvenido a <span className="text-primary">WikiStars5</span>
      </h1>
      <div className="max-w-md mx-auto mt-8">
        <SearchBar />
        <p className="text-sm text-muted-foreground mt-2">
            Escribe un nombre y presiona enter o haz clic en buscar.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
    const steps = [
        { title: 'Descubre Figuras', description: 'Busca o navega a través de perfiles de figuras públicas de diversos campos.', icon: Lightbulb },
        { title: 'Expresa tu Percepción', description: 'Vota por la emoción que te provoca una figura y mira los resultados globales.', icon: Users2 },
        { title: 'Únete a las Discusiones', description: 'Comparte tus opiniones en las secciones de comentarios y reacciona a los demás.', icon: MessageSquare },
        { title: 'Comparte Perfiles', description: 'Comparte fácilmente perfiles con tus amigos en redes sociales.', icon: Share2 }
    ];

    return (
        <section className="py-16">
            <h2 className="text-3xl font-bold text-center mb-10">Cómo Funciona WikiStars5</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step, index) => (
                    <div key={index} className="text-center p-6 bg-card rounded-lg border">
                        <div className="mb-4 text-primary">
                          <step.icon className="h-10 w-10 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}


export default function HomePage() {
   const [featuredFigures, setFeaturedFigures] = useState<Figure[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFigures = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Optimized query: fetch only featured figures
                const featured = await getFeaturedFiguresFromFirestore(10);
                setFeaturedFigures(featured);
            } catch (err: any) {
                setError("Error al cargar las figuras destacadas. Revisa las reglas de Firestore o la conexión.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFigures();
    }, []);

  return (
    <div className="space-y-12">
      <HeroSection />
      
      <HowItWorks />

      {error && (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error de Carga</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && featuredFigures.length > 0 && (
         <ForYouSection title="Figuras Destacadas" figures={featuredFigures} />
      )}
      
       {!isLoading && !error && featuredFigures.length === 0 && (
         <div className="text-center py-10">
            <p className="text-muted-foreground">No hay figuras destacadas disponibles en este momento.</p>
        </div>
      )}

    </div>
  );
}
