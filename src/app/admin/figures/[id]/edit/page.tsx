
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Importar useParams
import FigureForm from "@/components/admin/FigureForm"; 
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFigureFromFirestore } from "@/lib/placeholder-data"; 
import type { Figure } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function EditFigurePage() {
  const params = useParams(); // Usar el hook
  const id = params.id as string; // Obtener el ID desde el hook

  const [figure, setFigure] = useState<Figure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchFigure = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const figureData = await getFigureFromFirestore(id);
        if (figureData) {
          setFigure(figureData);
        } else {
          setError(`No se encontró ninguna figura con el ID: ${id}.`);
        }
      } catch (err: any) {
        console.error("Failed to fetch figure for editing:", err);
        let errorMessage = "No se pudo cargar la figura.";
        if (err.message && String(err.message).toLowerCase().includes("permission")) {
            errorMessage = `Error de permisos de Firestore. Revisa las reglas de seguridad para la colección 'figures'. Aunque la lectura es pública, asegúrate de que no haya otras reglas conflictivas.`;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFigure();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando datos de la figura...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de Carga</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/admin/figures">Volver a Gestionar Figuras</Link>
        </Button>
      </div>
    );
  }

  if (!figure) {
     return (
      <div className="text-center py-10">
        <CardTitle className="text-2xl font-headline">Figura No Encontrada</CardTitle>
        <CardDescription>El perfil que intentas editar (ID: {id}) no se encontró en Firestore.</CardDescription>
        <Button asChild className="mt-4">
          <Link href="/admin/figures">Volver a Gestionar Figuras</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Editar Perfil: {figure.name}</CardTitle>
        <CardDescription>Actualiza los detalles de esta figura pública. Los datos se guardarán en Firestore.</CardDescription>
      </CardHeader>
      <FigureForm initialData={figure} />
    </div>
  );
}
