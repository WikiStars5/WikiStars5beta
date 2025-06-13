import { FigureForm } from "@/components/admin/FigureForm";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFigureById } from "@/lib/placeholder-data"; // Simulated data fetching
import { Figure } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EditFigurePageProps {
  params: { id: string };
}

async function getFigure(id: string): Promise<Figure | undefined> {
  return getFigureById(id);
}

export default async function EditFigurePage({ params }: EditFigurePageProps) {
  const figure = await getFigure(params.id);

  if (!figure) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Figure Not Found</h1>
        <p className="text-muted-foreground">The profile you're trying to edit doesn't exist.</p>
         <Button asChild className="mt-4">
          <Link href="/admin/figures">Back to Figures List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Edit Profile: {figure.name}</CardTitle>
        <CardDescription>Update the details for this public figure.</CardDescription>
      </CardHeader>
      <FigureForm initialData={figure} />
    </div>
  );
}
