
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImageUp, Loader2 } from 'lucide-react';
import { batchUpdateFigureImageUrls } from '@/app/actions/adminActions';
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

export function BatchUpdateImagesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const result = await batchUpdateFigureImageUrls();
      if (result.success) {
        toast({
          title: "Proceso Exitoso",
          description: result.message,
        });
      } else {
        toast({
          title: "Error en el Proceso",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to run batch update:", error);
      toast({
        title: "Error Inesperado",
        description: "No se pudo completar la operación. Revisa la consola para más detalles.",
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
            <ImageUp className="mr-2 h-4 w-4" />
            Corregir URLs de Imágenes
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
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Procesando...' : 'Sí, Corregir Todas'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
