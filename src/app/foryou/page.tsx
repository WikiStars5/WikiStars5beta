
import { ForYouSection } from "@/components/foryou/ForYouSection";
import { getForYouRecommendations }d from "@/app/actions/recommendationsActions";
import { auth } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function ForYouPage() {
  const recommendations = await getForYouRecommendations();

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-2">Para Ti</h1>
        <p className="text-lg text-muted-foreground">
          Recomendaciones de figuras basadas en tendencias y popularidad.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>¡Aún no hay recomendaciones para ti!</AlertTitle>
          <AlertDescription>
            A medida que explores y califiques más figuras, podremos ofrecerte mejores sugerencias. ¡Empieza a explorar para personalizar tu experiencia!
          </AlertDescription>
        </Alert>
      ) : (
        recommendations.map((section) => (
          <ForYouSection
            key={section.title}
            title={section.title}
            description={section.description}
            figures={section.figures}
          />
        ))
      )}
    </div>
  );
}
