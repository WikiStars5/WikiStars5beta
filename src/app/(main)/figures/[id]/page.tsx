import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { RatingSystem } from "@/components/figures/RatingSystem"; // Ahora solo para percepción
// REMOVIDO: import { CommentSection } from "@/components/comments/CommentSection"; // Ya no usaremos la sección de comentarios de Firebase
import { getFigureFromFirestore, getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { Figure } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DisqusComments from '@/components/DisqusComments'; // <-- ¡Tu nueva importación para Disqus!

interface FigurePageProps {
  params: { id: string };
}

export const revalidate = 0; 

export default async function FigurePage({ params }: FigurePageProps) {
  const figure = await getFigureFromFirestore(params.id);

  if (!figure) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Figura No Encontrada</h1>
        <p className="text-muted-foreground">El perfil (ID: {params.id}) que buscas no existe en Firestore.</p>
        <Button asChild className="mt-4">
          <Link href="/">Ir a la Página Principal</Link>
        </Button>
      </div>
    );
  }

  const allFigures = await getAllFiguresFromFirestore();
  const relatedFigures = allFigures.filter(f => f.id !== figure.id).slice(0, 2);

  // Define la URL base para el pageUrl de Disqus
  // Usa tu variable de entorno NEXT_PUBLIC_BASE_URL en producción o localhost en desarrollo
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const pageUrl = `${baseUrl}/figures/${figure.id}`;
  const pageTitle = figure.name;

  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* RatingSystem ahora es SOLO para percepción. Se guarda al hacer clic. */}
          <RatingSystem figure={figure} /> 
          
          {/* AHORA INTEGRAMOS DISQUS AQUÍ */}
          {/* Asegúrate de que 'figure' exista antes de pasar sus props a DisqusComments */}
          {figure && (
            <div className="mt-8"> {/* Añadimos un margen superior para separarlo del sistema de percepción */}
              <h3 className="text-xl font-headline mb-4 text-gray-900 dark:text-gray-50">Discusión y Comentarios</h3>
              <DisqusComments
                pageUrl={pageUrl}
                pageIdentifier={figure.id}
                pageTitle={pageTitle}
              />
            </div>
          )}
        </div>
        
        <aside className="lg:col-span-1 space-y-6">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-headline">Cómo Funciona</AlertTitle>
            <AlertDescription className="text-sm">
              1. Comparte tu percepción general de {figure.name} (Fan, Simp, etc.) haciendo clic en uno de los botones de percepción. Tu elección se guarda automáticamente. Vuelve a hacer clic en el mismo botón para eliminar tu percepción.
              2. Los comentarios y calificaciones por estrellas son gestionados por Disqus.
            </AlertDescription>
          </Alert>

          {relatedFigures.length > 0 && (
            <div>
              <h3 className="text-xl font-headline mb-4">También te podría interesar</h3>
              <div className="space-y-4">
                {relatedFigures.map(relatedFigure => (
                  <FigureListItem key={relatedFigure.id} figure={relatedFigure} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

