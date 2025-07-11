
import { Sparkles, UserCircle } from "lucide-react";
import type { Metadata } from 'next';
import Link from 'next/link';
import { getForYouFigures } from '@/lib/recommendations';
import { FigureListItem } from "@/components/figures/FigureListItem";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Para Ti - Descubre Figuras en WikiStars5",
  description: "Una selección de perfiles populares y destacados especialmente para ti, basada en tus gustos.",
};

export const revalidate = 0; // Disable caching for this personalized page

export default async function ForYouPage() {
  const { figures: recommendedFigures, reason } = await getForYouFigures();

  const renderContent = () => {
    if (reason === 'no-user') {
      return (
        <div className="text-center py-10 px-4 bg-card rounded-lg shadow-md">
          <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">Inicia Sesión para Descubrir</h2>
          <p className="mt-2 text-muted-foreground">
            Crea una cuenta o inicia sesión para obtener recomendaciones personalizadas basadas en tus gustos y calificaciones.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/signup">Crear Cuenta</Link>
            </Button>
          </div>
        </div>
      );
    }

    if (reason === 'no-activity') {
      return (
        <div className="text-center py-10 px-4 bg-card rounded-lg shadow-md">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">¡Empieza a Explorar!</h2>
          <p className="mt-2 text-muted-foreground">
            Aún no tenemos suficiente información sobre tus gustos. Califica algunas figuras para obtener recomendaciones personalizadas.
          </p>
           <div className="mt-6">
             <Button asChild>
                <Link href="/figures">Explorar Figuras</Link>
             </Button>
           </div>
        </div>
      );
    }
    
    if (recommendedFigures.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendedFigures.map((figure) => (
            <FigureListItem key={figure.id} figure={figure} />
          ))}
        </div>
      );
    }

    return (
       <div className="text-center py-10 px-4 bg-card rounded-lg shadow-md">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-semibold">Explora el Universo de Figuras</h2>
          <p className="mt-2 text-muted-foreground">
           Basado en tus gustos, hemos buscado por todas partes. ¡Explora otras figuras para ampliar tus horizontes!
          </p>
           <div className="mt-6">
             <Button asChild>
                <Link href="/figures">Explorar Más Figuras</Link>
             </Button>
           </div>
        </div>
    );
  };

  return (
    <div className="space-y-12">
      <section className="text-center">
        <div className="inline-flex items-center justify-center bg-primary/10 text-primary p-3 rounded-full mb-4">
            <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-2">Para Ti</h1>
        <p className="text-lg text-muted-foreground">
          Una selección de perfiles basada en tus gustos y actividad.
        </p>
      </section>

      {renderContent()}
    </div>
  );
}
