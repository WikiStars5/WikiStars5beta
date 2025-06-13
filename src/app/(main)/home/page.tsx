import { SearchBar } from "@/components/shared/SearchBar";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { FIGURES_DATA } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lightbulb, Users, MessageSquareText, Share2 } from "lucide-react";

export default function HomePage() {
  const featuredFigures = FIGURES_DATA.slice(0, 3); // Show first 3 as featured

  return (
    <div className="space-y-16">
      <section className="text-center py-12 md:py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg shadow-sm">
        <div className="container max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-6 text-primary">
            Welcome to WikiStars5
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8">
            Discover, rate, and discuss public perception of your favorite (and not-so-favorite) famous figures. 
            Share your take and see what the world thinks!
          </p>
          <SearchBar />
           <p className="text-sm text-muted-foreground mt-4">
            Type a name and hit enter or click search.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="py-12">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">How WikiStars5 Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Lightbulb className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">Discover Figures</h3>
            <p className="text-sm text-muted-foreground">
              Search or browse through profiles of public figures from various fields.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">Rate Perception</h3>
            <p className="text-sm text-muted-foreground">
              Cast your vote: Fan, Simp, Hater, or Neutral. Then give a 1-5 star rating.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <MessageSquareText className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">Join Discussions</h3>
            <p className="text-sm text-muted-foreground">
              Share your opinions in the comment sections and react to others.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Share2 className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">Share Profiles</h3>
            <p className="text-sm text-muted-foreground">
              Easily share profiles with your friends on social media.
            </p>
          </div>
        </div>
      </section>

      <section id="browse" className="py-12">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">Featured Figures</h2>
        {featuredFigures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredFigures.map((figure) => (
              <FigureListItem key={figure.id} figure={figure} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No figures available at the moment.</p>
        )}
        <div className="text-center mt-8">
          <Button size="lg" variant="outline" asChild>
            <Link href="/figures">Browse All Figures</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
