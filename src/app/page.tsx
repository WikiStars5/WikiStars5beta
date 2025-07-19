
import { SearchBar } from "@/components/shared/SearchBar";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { getFeaturedFiguresFromFirestore } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lightbulb, Users, MessageSquareText, Share2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const featuredFigures = await getFeaturedFiguresFromFirestore(4); 

  return (
    <div className="space-y-16">
      <section className="text-center py-12 md:py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg shadow-sm">
        <div className="container max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-6 text-foreground">
            Bienvenido a <span className="text-primary">WikiStars5</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 text-center">
            La plataforma interactiva para explorar, calificar y debatir sobre la percepción pública de tus figuras favoritas. Descubre perfiles detallados, vota sobre tu actitud y emociones, y únete a la conversación global.
          </p>
          <div className="w-full max-w-xl">
            <SearchBar />
          </div>
           <p className="text-sm text-muted-foreground mt-4 text-center">
            Escribe un nombre y presiona enter o haz clic en buscar.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="py-12">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">Cómo Funciona WikiStars5</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Lightbulb className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-headline mb-2">Descubre Figuras</h3>
            <p className="text-sm text-muted-foreground">
              Busca o navega a través de perfiles de figuras públicas de diversos campos.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-headline mb-2">Expresa tu Percepción</h3>
            <p className="text-sm text-muted-foreground">
              Vota por la emoción que te provoca una figura y mira los resultados globales.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <MessageSquareText className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-headline mb-2">Únete a las Discusiones</h3>
            <p className="text-sm text-muted-foreground">
              Comparte tus opiniones en las secciones de comentarios y reacciona a los demás.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Share2 className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-headline mb-2">Comparte Perfiles</h3>
            <p className="text-sm text-muted-foreground">
              Comparte fácilmente perfiles con tus amigos en redes sociales.
            </p>
          </div>
        </div>
      </section>

      <section id="browse" className="py-12">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">Figuras Destacadas</h2>
        {featuredFigures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredFigures.map((figure) => (
              <FigureListItem key={figure.id} figure={figure} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No hay figuras disponibles en Firestore en este momento.</p>
        )}
        <div className="text-center mt-8">
          <Button size="lg" variant="outline" asChild>
            <Link href="/figures">Explorar Todas las Figuras</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
