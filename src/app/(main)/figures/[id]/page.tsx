
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { RatingSystem } from "@/components/figures/RatingSystem"; // This now only handles perception
import { CommentSection } from "@/components/comments/CommentSection"; // This now handles comments + optional stars for NEW comments
import { getFigureFromFirestore, getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { Figure } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FigurePageProps {
  params: { id: string };
}

export const revalidate = 0; 

export default async function FigurePage({ params }: FigurePageProps) {
  const figure = await getFigureFromFirestore(params.id);

  if (!figure) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Figure Not Found</h1>
        <p className="text-muted-foreground">The profile (ID: {params.id}) you're looking for doesn't exist in Firestore.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  const allFigures = await getAllFiguresFromFirestore();
  const relatedFigures = allFigures.filter(f => f.id !== figure.id).slice(0, 2);


  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader figure={figure} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* RatingSystem now only for perception */}
          <RatingSystem figure={figure} /> 
          {/* CommentSection handles comments and optional star ratings for NEW comments */}
          <CommentSection figure={figure} />
        </div>
        
        <aside className="lg:col-span-1 space-y-6">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-headline">How It Works</AlertTitle>
            <AlertDescription className="text-sm">
              1. Share your overall perception (Fan, Simp, etc.) for {figure.name}. This is independent.
              2. When writing a NEW comment, you can optionally add a 1-5 star rating. This rating is tied to your comment.
              The figure's average star rating is based on stars given with new comments. Replies to comments do not include star ratings.
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
