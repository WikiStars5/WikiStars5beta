
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
    if (confirm(`Are you sure you want to delete ${figure.name}? This cannot be undone.`)) {
      try {
        await deleteFigureFromFirestore(figure.id);
        toast({ title: "Figure Deleted", description: `${figure.name} has been removed from Firestore.`});
        router.refresh(); // Re-fetch server-side data
      } catch (error) {
        console.error("Error deleting figure from Firestore:", error);
        toast({ title: "Error Deleting", description: `Could not delete ${figure.name}.`, variant: "destructive"});
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
      <span className="sr-only">Delete {figure.name}</span>
    </Button>
  );
}
