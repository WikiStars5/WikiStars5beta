"use client"; // Convert to client component

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListOrdered, PlusCircle, AlertTriangle, ImageUp, Loader2 } from "lucide-react";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
// La importación de getAllUsersFromFirestore y UserProfile se ha eliminado para evitar el error de permisos.
import type { Figure } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BatchUpdateImagesButton } from "@/components/admin/BatchUpdateImagesButton";
import { BatchEnrichButton } from "@/components/admin/BatchEnrichButton";

export default function AdminDashboardPage() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        // Ahora solo obtenemos los datos de las figuras, ya que la obtención de usuarios se ha desactivado.
        const figuresData = await getAllFiguresFromFirestore();
        setFigures(figuresData);
      } catch (error: any) {
        console.error("Error fetching admin dashboard data:", error);
        // Este error ahora solo se activará si falla la obtención de figuras.
        setFetchError(error.message || 'Ocurrió un error inesperado al cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalFigures = figures.length;

  return (
    <div className="space-y-8">
      {fetchError && (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error Crítico de Configuración</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Panel de Administración</CardTitle>
          <CardDescription>Resumen del estado de la aplicación WikiStars5. Datos de figuras y usuarios desde Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Cargando datos...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Figuras</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFigures}</div>
                  <p className="text-xs text-muted-foreground">perfiles gestionados en Firestore</p>
                </CardContent>
              </Card>
              {/* La tarjeta "Total de Usuarios" ha sido eliminada para evitar el error de permisos.
                  Para reactivarla, primero debes arreglar las reglas de seguridad de Firestore para permitir
                  al administrador 'listar' la colección 'registered_users'. */}
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
            <Link href="/admin/figures/new">
              <span className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Figura
              </span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/figures">
              <span className="flex items-center">
                <ListOrdered className="mr-2 h-4 w-4" /> Gestionar Figuras
              </span>
            </Link>
          </Button>
           <Button variant="outline" asChild>
            <Link href="/admin/users">Gestionar Usuarios</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Herramientas de Mantenimiento</CardTitle>
          <CardDescription>Ejecuta acciones masivas para corregir datos en la base de datos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
           <BatchUpdateImagesButton />
           <BatchEnrichButton />
        </CardContent>
      </Card>
    </div>
  );
}
