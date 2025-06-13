
"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Figure } from "@/lib/types";
// import { deleteFigure as deleteFigureData } from "@/lib/placeholder-data"; // For actual deletion
// import { useRouter } from "next/navigation"; // For refreshing page

interface AdminDeleteFigureButtonProps {
  figure: Pick<Figure, "id" | "name">;
}

export function AdminDeleteFigureButton({ figure }: AdminDeleteFigureButtonProps) {
  // const router = useRouter(); // Uncomment for actual deletion and refresh

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${figure.name}? This cannot be undone.`)) {
      // Simulate delete action for now
      alert(`Simulating delete for ${figure.name}. In a real app, this would call an API and refresh the list.`);
      
      // Actual deletion logic (example, would need API call and proper state management/revalidation)
      // try {
      //   // await callToDeleteApi(figure.id);
      //   deleteFigureData(figure.id); // Simulating local data change
      //   toast({ title: "Figure Deleted", description: `${figure.name} has been removed.`});
      //   router.refresh(); // Re-fetch server-side data
      // } catch (error) {
      //   toast({ title: "Error Deleting", description: `Could not delete ${figure.name}.`, variant: "destructive"});
      // }
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
