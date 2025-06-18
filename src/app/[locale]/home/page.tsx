
import { SearchBar } from "@/components/shared/SearchBar";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { getFeaturedFiguresFromFirestore } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lightbulb, Users, MessageSquareText, Share2 } from "lucide-react";
import {useTranslations} from 'next-intl';

export const revalidate = 0; 

export default async function HomePage() {
  const featuredFigures = await getFeaturedFiguresFromFirestore(4); 
  // const t = useTranslations('HomePage'); // Cannot use useTranslations in Server Component, get translations differently or make client

  // For server components, you'd fetch translations like this:
  // import {getTranslator} from 'next-intl/server';
  // const t = await getTranslator(locale, 'HomePage');
  // However, since this is a simple page, we can make it a client component or pass t down
  // For simplicity here, let's make the text parts client-side or assume they are static for now.
  // The best approach is to create a client component that uses useTranslations

  return (
    <HomePageClient featuredFigures={featuredFigures} />
  );
}

function HomePageClient({ featuredFigures }: { featuredFigures: Awaited<ReturnType<typeof getFeaturedFiguresFromFirestore>> }) {
  const t = useTranslations('HomePage');

  return (
    <div className="space-y-16">
      <section className="text-center py-12 md:py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg shadow-sm">
        <div className="container max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-6 text-foreground">
            {t('welcome')}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-8 text-center">
            {t('description')}
          </p>
          <div className="w-full max-w-xl">
            <SearchBar />
          </div>
           <p className="text-sm text-muted-foreground mt-4 text-center">
            {t('searchPlaceholder')}
          </p>
        </div>
      </section>

      <section id="how-it-works" className="py-12">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">{t('howItWorksTitle')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Lightbulb className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">{t('discoverFigures')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('discoverFiguresDesc')}
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">{t('expressPerception')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('expressPerceptionDesc')}
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <MessageSquareText className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">{t('joinDiscussions')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('joinDiscussionsDesc')}
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Share2 className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-headline mb-2">{t('shareProfiles')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('shareProfilesDesc')}
            </p>
          </div>
        </div>
      </section>

      <section id="browse" className="py-12">
        <h2 className="text-3xl font-bold font-headline text-center mb-10">{t('featuredFigures')}</h2>
        {featuredFigures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredFigures.map((figure) => (
              <FigureListItem key={figure.id} figure={figure} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No hay figuras disponibles en Firestore en este momento.</p>
        )}
        <div className="text-center mt-8">
          <Button size="lg" variant="outline" asChild>
            <Link href="/figures">{t('exploreAllFigures')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
