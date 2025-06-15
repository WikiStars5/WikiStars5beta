
import FigureForm from "@/components/admin/FigureForm"; // Changed to default import
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
        <CardTitle className="text-2xl font-headline">Figura No Encontrada</CardTitle>
        <CardDescription>El perfil que intentas editar (ID: {params.id}) no se encontró en Firestore.</CardDescription>
        <Button asChild className="mt-4">
          <Link href="/admin/figures">Volver a Gestionar Figuras</Link>
        </Button>
      </div>
    );
    // notFound(); // Use Next.js notFound for a generic 404, or custom component as above.
  }

  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Editar Perfil: {figure.name}</CardTitle>
        <CardDescription>Actualiza los detalles de esta figura pública. Los datos se guardarán en Firestore.</CardDescription>
      </CardHeader>
      <FigureForm initialData={figure} />
    </div>
  );
}
