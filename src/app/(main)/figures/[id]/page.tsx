
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { getFigureFromFirestore, getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import type { Figure } from "@/lib/types"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DisqusComments from '@/components/DisqusComments'; // Componente para comentarios generales
import DisqusEmotions from '@/components/DisqusEmotions'; // Componente para reacciones emocionales
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';

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
  const relatedFigures = allFigures.filter(f => f.id !== figure.id).slice(0, 3);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const pageUrl = `${baseUrl}/figures/${figure.id}`;
  const commentsPageIdentifier = figure.id; // Identificador para el hilo de comentarios generales
  const pageTitle = figure.name;

  // Variables para el hilo de Disqus de emociones
  const emotionalPageIdentifier = `${figure.id}_emociones`; // Identificador ÚNICO para el hilo de emociones
  const emotionalPageUrl = `${pageUrl}/emociones`; // URL ÚNICA para el hilo de emociones

  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="info" className="text-base py-2.5">Información Personal</TabsTrigger>
              <TabsTrigger value="comments" className="text-base py-2.5">Calificaciones y Comentarios</TabsTrigger>
              <TabsTrigger value="emotions" className="text-base py-2.5">Reacciones Emocionales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold font-headline text-primary">Información Detallada</CardTitle>
                </CardHeader>
                <CardContent className="pt-2 text-sm">
                  <p className="text-foreground/80 whitespace-pre-line">
                    {figure.description || "No hay descripción detallada disponible para esta figura."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="comments">
              {figure && (
                <DisqusComments
                  pageUrl={pageUrl}
                  pageIdentifier={commentsPageIdentifier}
                  pageTitle={pageTitle}
                />
              )}
            </TabsContent>

            <TabsContent value="emotions">
              {figure && (
                <DisqusEmotions
                  pageUrl={emotionalPageUrl}
                  pageIdentifier={emotionalPageIdentifier}
                  pageTitle={`${pageTitle} - Reacciones Emocionales`}
                />
              )}
            </TabsContent>

          </Tabs>
        </div>
        
        <aside className="lg:col-span-1 space-y-6">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-headline">Cómo Funciona</AlertTitle>
            <AlertDescription className="text-sm">
              Las discusiones, comentarios, calificaciones y reacciones de {figure.name} son gestionados a través de Disqus. ¡Únete a la conversación!
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
