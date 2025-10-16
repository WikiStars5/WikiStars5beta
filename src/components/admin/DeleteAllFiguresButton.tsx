
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, ShieldAlert } from 'lucide-react';
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
import { callFirebaseFunction } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function DeleteAllFiguresButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDeleteAll = async () => {
    setIsLoading(true);
    try {
      const result = await callFirebaseFunction('deleteAllFigures');

      toast({
        title: "¡Eliminación Masiva Completa!",
        description: result.message,
      });

      // Refresh the page to show the empty list
      router.refresh(); 
    } catch (error: any) {
      console.error("Failed to run batch delete from client:", error);
      let errorMessage = "No se pudo completar la operación de borrado.";
      if (error.message.includes('permission-denied')) {
        errorMessage = "Error de permisos. Asegúrate de que eres un administrador autenticado.";
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
        <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Todo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
            <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-destructive" />
                <AlertDialogTitle>¿Confirmar Eliminación Masiva?</AlertDialogTitle>
            </div>
          <AlertDialogDescription>
            Estás a punto de eliminar **TODAS** las figuras de la base de datos. Esta acción es irreversible y no se puede deshacer.
            <br/><br/>
            Se recomienda realizar una copia de seguridad de la colección `figures` antes de continuar. ¿Estás absolutamente seguro de que quieres hacerlo?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteAll} 
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Eliminando...' : 'Sí, Eliminar Todo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
