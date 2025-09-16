
import FigureForm from "@/components/admin/FigureForm"; 
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewManualFigurePage() {
  return (
    <div>
      <CardHeader className="px-0 mb-4">
        <CardTitle className="text-2xl font-headline">Crear Nuevo Perfil Manualmente</CardTitle>
        <CardDescription>
          Completa los detalles para la nueva figura. Este perfil deberá ser validado por la comunidad:
          si la suma total de votos de actitud (Fan, Simp, Hater, Neutral) no alcanza los 1,000 en 5 días, el perfil será eliminado automáticamente.
        </CardDescription>
      </CardHeader>
      <FigureForm mode="manual" />
    </div>
  );
}
