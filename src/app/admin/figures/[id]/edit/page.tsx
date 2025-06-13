
import { FigureForm } from "@/components/admin/FigureForm";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFigureFromFirestore } from "@/lib/placeholder-data"; 
import type { Figure } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

interface EditFigurePageProps {
  params: { id: string };
}

export const revalidate = 0; // Ensure data is re-fetched on each request

async function getFigure(id: string): Promise<Figure | undefined> {
  return getFigureFromFirestore(id);
}

export default async function EditFigurePage({ params }: EditFigurePageProps) {
  const figure = await getFigure(params.id);

  if (!figure) {
    return (
      <div className="text-center py-10">
        <CardTitle className="text-2xl font-headline">Figure Not Found</CardTitle>
        <CardDescription>The profile you're trying to edit (ID: {params.id}) was not found in Firestore.</CardDescription>
        <Button asChild className="mt-4">
          <Link href="/admin/figures">Back to Manage Figures</Link>
        </Button>
      </div>
    );
    // notFound(); // Use Next.js notFound for a generic 404, or custom component as above.
  }

  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Edit Profile: {figure.name}</CardTitle>
        <CardDescription>Update the details for this public figure. Data will be saved to Firestore.</CardDescription>
      </CardHeader>
      <FigureForm initialData={figure} />
    </div>
  );
}
