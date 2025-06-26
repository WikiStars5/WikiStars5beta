import FigureForm from "@/components/admin/FigureForm"; 
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewFigurePage() {
  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Crear Nuevo Perfil de Personaje</CardTitle>
        <CardDescription>Completa los detalles para la nueva figura pública. Sube una imagen para su perfil.</CardDescription>
      </CardHeader>
      <FigureForm />
    </div>
  );
}
