
import { FigureForm } from "@/components/admin/FigureForm";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFigureById } from "@/lib/placeholder-data"; // Simulated data fetching
import type { Figure } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditFigurePageProps {
  params: { id: string };
}

// Function to get figure data (simulated)
async function getFigure(id: string): Promise<Figure | undefined> {
  // In a real app, fetch from database
  return getFigureById(id);
}

export default async function EditFigurePage({ params }: EditFigurePageProps) {
  const figure = await getFigure(params.id);

  if (!figure) {
    notFound(); // Use Next.js notFound to render the nearest not-found.js or a default 404 page
  }

  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Edit Profile: {figure.name}</CardTitle>
        <CardDescription>Update the details for this public figure. The photo URL is for an image link.</CardDescription>
      </CardHeader>
      <FigureForm initialData={figure} />
    </div>
  );
}
