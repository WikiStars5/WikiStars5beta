
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tags, Loader2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function BatchUpdateTagsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdate = async () => {
    setIsLoading(true);
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

      querySnapshot.forEach(docSnap => {
        const figureData = docSnap.data() as Figure;
        const tags = figureData.tags || [];
        const tagsLower = figureData.tagsLower || [];

        // Check if a sync is needed
        if (tags.length > 0 && tags.length !== tagsLower.length) {
          const newTagsLower = tags.map(t => t.toLowerCase());
          const figureRef = doc(db, 'figures', docSnap.id);
          batch.update(figureRef, { tagsLower: newTagsLower });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({
          title: "Proceso Completado",
          description: `Se sincronizaron las etiquetas para ${updatedCount} perfiles.`,
        });
        router.refresh(); 
      } else {
        toast({
          title: "Proceso Exitoso",
          description: "¡Todas las etiquetas ya están sincronizadas!",
        });
      }
    } catch (error: any) {
      console.error("Failed to run batch tag update from client:", error);
      let errorMessage = "No se pudo completar la operación.";
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
            <Tags className="mr-2 h-4 w-4" />
            Sincronizar Etiquetas
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Sincronización de Etiquetas?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todas las figuras en la base de datos y creará el campo `tagsLower` necesario para la búsqueda de etiquetas.
            <br/><br/>
            Esto solucionará el problema de que las figuras existentes no aparezcan en las páginas de etiquetas. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Sincronizando...' : 'Sí, Sincronizar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
