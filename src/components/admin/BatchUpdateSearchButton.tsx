
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SearchCheck, Loader2 } from 'lucide-react';
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

export function BatchUpdateSearchButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsProcessing(true);
    try {
      const figuresCollectionRef = collection(db, 'figures');
      const querySnapshot = await getDocs(figuresCollectionRef);
      
      if (querySnapshot.empty) {
        toast({ title: "Proceso Exitoso", description: "No se encontraron figuras para procesar." });
        setIsProcessing(false);
        return;
      }

      const batch = writeBatch(db);
      let updatedCount = 0;

      querySnapshot.forEach(docSnap => {
        const figureData = docSnap.data() as Figure;
        const currentName = figureData.name;
        const currentSearchName = figureData.nameSearch;
        
        if (currentName) {
            const newSearchName = currentName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            if (currentSearchName !== newSearchName) {
                const figureRef = doc(db, 'figures', docSnap.id);
                batch.update(figureRef, { nameSearch: newSearchName });
                updatedCount++;
            }
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({
          title: "Proceso Completado",
          description: `Se sincronizaron los campos de búsqueda para ${updatedCount} perfiles. El buscador ya debería funcionar para todos.`,
        });
      } else {
        toast({
          title: "Proceso Exitoso",
          description: "¡Todos los perfiles ya estaban sincronizados para la búsqueda!",
        });
      }
    } catch (error: any) {
      console.error("Failed to run batch search update from client:", error);
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
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SearchCheck className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Sincronizando...' : 'Sincronizar Búsqueda'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Sincronización de Búsqueda?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todas las figuras en la base de datos y creará o actualizará el campo `nameSearch` para que las búsquedas sin acentos funcionen correctamente.
            <br/><br/>
            Usa esto para reparar el buscador si los personajes existentes no aparecen en los resultados. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isProcessing ? 'Sincronizando...' : 'Sí, Sincronizar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
