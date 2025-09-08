
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImageUp, Loader2 } from 'lucide-react';
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
import { correctMalformedUrl } from '@/lib/utils';
import type { Figure } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function BatchUpdateImagesButton() {
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
        const originalUrl = figureData.photoUrl;
        
        if (!originalUrl) {
            return;
        }

        const correctedUrl = correctMalformedUrl(originalUrl);

        if (originalUrl !== correctedUrl) {
          const figureRef = doc(db, 'figures', docSnap.id);
          batch.update(figureRef, { photoUrl: correctedUrl });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({
          title: "Proceso Completado",
          description: `Se actualizaron ${updatedCount} URLs de imágenes.`,
        });
        // Revalidate paths by refreshing the page to show corrected data if any were visible
        router.refresh(); 
      } else {
        toast({
          title: "Proceso Exitoso",
          description: "No se encontraron URLs de imágenes mal formadas. ¡Todo está en orden!",
        });
      }
    } catch (error: any) {
      console.error("Failed to run batch update from client:", error);
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
            <ImageUp className="mr-2 h-4 w-4" />
          )}
          {isProcessing ? 'Procesando...' : 'Corregir URLs de Imágenes'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Actualización Masiva?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todas las figuras en la base de datos y corregirá permanentemente cualquier URL de imagen que esté mal formada (por ejemplo, con `http:/` en lugar de `http://`).
            <br/><br/>
            Esta operación puede tardar unos segundos y no se puede deshacer. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isProcessing ? 'Procesando...' : 'Sí, Corregir Todas'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
