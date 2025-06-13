import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { RatingSystem } from "@/components/figures/RatingSystem";
import { CommentSection } from "@/components/comments/CommentSection";
import { getFigureById, FIGURES_DATA } from "@/lib/placeholder-data";
import { Figure } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FigurePageProps {
  params: { id: string };
}

// export async function generateStaticParams() {
//   return FIGURES_DATA.map((figure) => ({
//     id: figure.id,
//   }));
// }

export default async function FigurePage({ params }: FigurePageProps) {
  // In a real app, fetch data from a database
  const figure = getFigureById(params.id);

  if (!figure) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Figure Not Found</h1>
        <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  const relatedFigures = FIGURES_DATA.filter(f => f.id !== figure.id).slice(0, 2);


  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          <RatingSystem figure={figure} />
          <CommentSection figure={figure} />
        </div>
        
        <aside className="lg:col-span-1 space-y-6">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-headline">How Ratings Work</AlertTitle>
            <AlertDescription className="text-sm">
              Your perception (Fan, Simp, etc.) and star rating contribute to {figure.name}'s overall public image on StarSage. Ratings can be updated anytime.
            </AlertDescription>
          </Alert>

          {relatedFigures.length > 0 && (
            <div>
              <h3 className="text-xl font-headline mb-4">You Might Also Like</h3>
              <div className="space-y-4">
                {relatedFigures.map(relatedFigure => (
                  <FigureListItem key={relatedFigure.id} figure={relatedFigure} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
