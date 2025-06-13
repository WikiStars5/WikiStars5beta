
"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Figure } from "@/lib/types";
import { deleteFigureFromFirestore } from "@/lib/placeholder-data"; 
import { useRouter } from "next/navigation"; 
import { useToast } from "@/hooks/use-toast";

interface AdminDeleteFigureButtonProps {
  figure: Pick<Figure, "id" | "name">;
}

export function AdminDeleteFigureButton({ figure }: AdminDeleteFigureButtonProps) {
  const router = useRouter(); 
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${figure.name}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteFigureFromFirestore(figure.id);
        toast({ title: "Figura Eliminada", description: `${figure.name} ha sido eliminado de Firestore.`});
        router.refresh(); // Re-fetch server-side data
      } catch (error) {
        console.error("Error deleting figure from Firestore:", error);
        toast({ title: "Error al Eliminar", description: `No se pudo eliminar a ${figure.name}.`, variant: "destructive"});
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive"
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Eliminar {figure.name}</span>
    </Button>
  );
}
