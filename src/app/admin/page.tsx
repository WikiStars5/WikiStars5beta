
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListOrdered, PlusCircle, AlertTriangle, Loader2, Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BatchUpdateImagesButton } from "@/components/admin/BatchUpdateImagesButton";
import { BatchUpdateTagsButton } from "@/components/admin/BatchUpdateTagsButton";
import { CreateProfileFromWikipedia } from "@/components/admin/CreateProfileFromWikipedia";
import { getFiguresCount } from "@/lib/placeholder-data";
import { BatchUpdateSearchButton } from "@/components/admin/BatchUpdateSearchButton";

export default function AdminDashboardPage() {
  const [totalFigures, setTotalFigures] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Optimized count query
      const count = await getFiguresCount();
      setTotalFigures(count);
    } catch (error: any) {
      console.error("Error fetching admin dashboard data:", error);
      setFetchError(error.message || 'Ocurrió un error inesperado al cargar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {fetchError && (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error de Carga</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Panel de Administración</CardTitle>
          <CardDescription>Resumen del estado de la aplicación WikiStars5. Datos de figuras desde Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Cargando datos...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-1 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Perfiles</CardTitle>
                  <ListOrdered className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFigures}</div>
                  <p className="text-xs text-muted-foreground">perfiles gestionados en Firestore</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/admin/figures/new"><span className="flex items-center"><PlusCircle /> Añadir Nuevo Perfil</span></Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/figures"><span className="flex items-center"><ListOrdered /> Gestionar Perfiles</span></Link>
          </Button>
        </CardContent>
      </Card>

      <div>
        <CreateProfileFromWikipedia onProfileCreated={fetchData} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Wrench />
            Herramientas de Mantenimiento
          </CardTitle>
          <CardDescription>Ejecuta acciones masivas para corregir o sincronizar datos en toda la base de datos. Úsalo si encuentras inconsistencias.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
           <BatchUpdateSearchButton />
           <BatchUpdateTagsButton />
           <BatchUpdateImagesButton />
        </CardContent>
      </Card>
    </div>
  );
}
