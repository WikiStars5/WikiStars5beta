

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
        const hashtags = figureData.hashtags || [];
        const hashtagsLower = figureData.hashtagsLower || [];

        // Check if a sync is needed
        if (hashtags.length > 0 && hashtags.length !== hashtagsLower.length) {
          const newHashtagsLower = hashtags.map(t => t.toLowerCase());
          const figureRef = doc(db, 'figures', docSnap.id);
          batch.update(figureRef, { hashtagsLower: newHashtagsLower });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({
          title: "Proceso Completado",
          description: `Se sincronizaron los hashtags para ${updatedCount} perfiles.`,
        });
        router.refresh(); 
      } else {
        toast({
          title: "Proceso Exitoso",
          description: "¡Todos los hashtags ya están sincronizados!",
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
              <Tags className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Procesando...' : 'Sincronizar Hashtags'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Sincronización de Hashtags?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todas las figuras en la base de datos y creará el campo `hashtagsLower` necesario para la búsqueda de hashtags.
            <br/><br/>
            Esto solucionará el problema de que las figuras existentes no aparezcan en las páginas de hashtags. ¿Deseas continuar?
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
