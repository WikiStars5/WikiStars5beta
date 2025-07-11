
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { enrichAndSaveFigureData } from '@/app/actions/enrichFigureAction';

export function BatchEnrichButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdate = async () => {
    setIsLoading(true);
    toast({
      title: "Iniciando Enriquecimiento Masivo",
      description: "Este proceso puede tardar varios minutos. No cierres esta ventana.",
    });

    try {
      const figuresCollectionRef = collection(db, 'figures');
      const querySnapshot = await getDocs(figuresCollectionRef);
      
      if (querySnapshot.empty) {
        toast({ title: "Proceso Exitoso", description: "No se encontraron figuras para procesar." });
        setIsLoading(false);
        return;
      }

      const batch = writeBatch(db);
      let updatedCount = 0;
      const figuresToProcess = querySnapshot.docs.map(d => ({id: d.id, ...d.data()})) as (Figure & {id: string})[];

      for (const figure of figuresToProcess) {
        // Skip if categories already exist to avoid overwriting manual entries
        if (figure.categories && figure.categories.length > 0) {
          continue;
        }

        try {
          const result = await enrichAndSaveFigureData({ name: figure.name, existingDescription: figure.description });
          
          if (result.success && result.data) {
            const figureRef = doc(db, 'figures', figure.id);
            batch.update(figureRef, { 
              description: result.data.description,
              categories: result.data.categories,
              occupation: result.data.occupation,
              gender: result.data.gender,
              nationality: result.data.nationality,
            });
            updatedCount++;
          } else {
             console.warn(`Could not enrich data for ${figure.name} (ID: ${figure.id}). Error: ${result.error}`);
          }
        } catch (e) {
            console.warn(`Could not enrich data for ${figure.name} (ID: ${figure.id}). Skipping. Error:`, e);
            // Continue with the next figure
        }
      }


      if (updatedCount > 0) {
        await batch.commit();
        toast({
          title: "Proceso Completado",
          description: `Se enriquecieron ${updatedCount} perfiles con IA.`,
        });
        router.refresh(); 
      } else {
        toast({
          title: "Proceso Exitoso",
          description: "No se encontraron perfiles que necesitaran enriquecimiento (todos tenían categorías).",
        });
      }
    } catch (error: any) {
      console.error("Failed to run batch enrichment:", error);
      let errorMessage = "No se pudo completar la operación masiva.";
      if (error.code === 'permission-denied') {
        errorMessage = "Error de permisos. Asegúrate de que las reglas de Firestore permiten escribir al administrador.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      toast({
        title: "Error Inesperado",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Enriquecer Perfiles con IA
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Enriquecimiento Masivo?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todos los perfiles en la base de datos y usará la IA para añadir/actualizar la descripción, categorías, ocupación y más.
            <br/><br/>
            El proceso se saltará los perfiles que ya tengan categorías asignadas para evitar sobrescribir datos. Esta operación puede tardar varios minutos y no se puede deshacer. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Procesando...' : 'Sí, Enriquecer Todos'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
