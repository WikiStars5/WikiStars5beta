
"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import type { Figure } from "@/lib/types";
import { callFirebaseFunction } from "@/lib/firebase"; // Import the helper
import { useRouter } from "next/navigation"; 
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AdminDeleteFigureButtonProps {
  figure: Pick<Figure, "id" | "name">;
}

export function AdminDeleteFigureButton({ figure }: AdminDeleteFigureButtonProps) {
  const router = useRouter(); 
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${figure.name}? Esta acción es permanente y borrará todos los comentarios, votos y rachas asociadas.`)) {
      setIsDeleting(true);
      try {
        // Call the new Cloud Function
        await callFirebaseFunction('deleteFigure', { figureId: figure.id });
        
        toast({ title: "Figura Eliminada", description: `${figure.name} y todos sus datos han sido eliminados.`});
        router.refresh(); // Re-fetch server-side data
      } catch (error: any) {
        console.error("Error calling deleteFigure function:", error);
        toast({ title: "Error al Eliminar", description: error.message || `No se pudo eliminar a ${figure.name}.`, variant: "destructive"});
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="sr-only">Eliminar {figure.name}</span>
    </Button>
  );
}
