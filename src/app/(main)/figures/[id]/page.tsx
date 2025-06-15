
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { getFigureFromFirestore, getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Info, UserCircle, Globe, Briefcase, Users2 } from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DisqusComments from '@/components/DisqusComments'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const commentsPageIdentifier = figure.id; 
  const pageTitle = figure.name;

  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal-info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="personal-info" className="text-base py-2.5">Información Personal</TabsTrigger>
              <TabsTrigger value="comments" className="text-base py-2.5">Calificaciones y Comentarios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal-info">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-headline">
                    <Info className="mr-2 h-6 w-6 text-primary" />
                    Sobre {figure.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {figure.description ? (
                    <p className="text-base leading-relaxed text-foreground/90">{figure.description}</p>
                  ) : (
                    <p className="text-base text-muted-foreground">No hay una descripción adicional disponible para esta figura.</p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <UserCircle className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground/90">Nombre Completo</p>
                        <p className="text-sm text-muted-foreground">{figure.name || "No disponible"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Globe className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground/90">Nacionalidad</p>
                        <p className="text-sm text-muted-foreground">{figure.nationality || "No disponible"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Briefcase className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground/90">Ocupación</p>
                        <p className="text-sm text-muted-foreground">{figure.occupation || "No disponible"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Users2 className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground/90">Género</p>
                        <p className="text-sm text-muted-foreground">{figure.gender || "No disponible"}</p>
                      </div>
                    </div>
                  </div>
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
          </Tabs>
        </div>
        
        <aside className="lg:col-span-1 space-y-6">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-headline">Cómo Funciona</AlertTitle>
            <AlertDescription className="text-sm">
              Las discusiones y comentarios sobre {figure.name} son gestionados a través de Disqus. ¡Únete a la conversación!
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
