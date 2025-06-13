"use client";

import { useState, useEffect } from 'react';
import type { PerceptionOption, UserRating, Figure, PerceptionKeys } from '@/lib/types';
import { PERCEPTION_OPTIONS, getUserRatingForFigure } from '@/lib/placeholder-data';
import { mockUser } from '@/lib/types'; // Simulate user session
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/shared/StarRating';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp } from 'lucide-react';

interface RatingSystemProps {
  figure: Figure;
}

export function RatingSystem({ figure }: RatingSystemProps) {
  const { toast } = useToast();
  const [selectedPerception, setSelectedPerception] = useState<PerceptionKeys | null>(null);
  const [starRating, setStarRating] = useState<number>(0);
  const [currentUserRating, setCurrentUserRating] = useState<UserRating | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (mockUser) {
      const existingRating = getUserRatingForFigure(mockUser.id, figure.id);
      if (existingRating) {
        setSelectedPerception(existingRating.perception);
        setStarRating(existingRating.stars);
        setCurrentUserRating(existingRating);
      }
    }
  }, [figure.id]);

  const handleSubmitRating = async () => {
    if (!mockUser) {
      toast({ title: "Login Required", description: "Please log in to submit your rating.", variant: "destructive" });
      return;
    }
    if (!selectedPerception) {
      toast({ title: "Perception Missing", description: "Please select your perception.", variant: "destructive" });
      return;
    }
    if (starRating === 0) {
      toast({ title: "Star Rating Missing", description: "Please provide a star rating.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newRating: UserRating = {
      userId: mockUser.id,
      figureId: figure.id,
      perception: selectedPerception,
      stars: starRating,
      timestamp: new Date().toISOString(),
    };
    // In a real app, update this in DB and refresh data
    setCurrentUserRating(newRating); 
    // This is where USER_RATINGS_DATA would be updated if it were stateful or a DB call made.
    console.log("Submitting rating:", newRating);
    setIsLoading(false);
    toast({
      title: "Rating Submitted!",
      description: `You rated ${figure.name} as ${selectedPerception} with ${starRating} stars.`,
      action: <Button variant="outline" size="sm" onClick={() => console.log('Undo action')}><ThumbsUp className="mr-2 h-4 w-4" />Got it!</Button>
    });
  };
  
  if (!isClient) return <Card><CardContent className="p-6"><div className="h-48 animate-pulse bg-muted rounded-md"></div></CardContent></Card>;

  if (!mockUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate {figure.name}</CardTitle>
          <CardDescription>Log in to share your perception and rating.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><a href="/login">Login to Rate</a></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Perception of {figure.name}</CardTitle>
        <CardDescription>What do you consider yourself? Then, give a star rating.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-md font-medium mb-3">1. Choose your perception:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PERCEPTION_OPTIONS.map((option) => (
              <Button
                key={option.key}
                variant={selectedPerception === option.key ? "default" : "outline"}
                onClick={() => setSelectedPerception(option.key)}
                className={cn(
                  "flex flex-col h-auto p-3 items-center justify-center space-y-1 text-center transition-all duration-150 ease-in-out transform hover:scale-105",
                  selectedPerception === option.key && "ring-2 ring-primary shadow-md"
                )}
              >
                <option.icon className={cn("w-7 h-7 mb-1", selectedPerception === option.key ? "text-primary-foreground" : "text-foreground/80")} />
                <span className="text-sm">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium mb-3">2. Give a star rating (1-5):</h4>
          <div className="flex justify-center sm:justify-start">
            <StarRating rating={starRating} onRatingChange={setStarRating} size={32} />
          </div>
        </div>
        
        <Button onClick={handleSubmitRating} disabled={isLoading || !selectedPerception || starRating === 0} className="w-full sm:w-auto text-lg py-3 px-6">
          {isLoading ? "Submitting..." : (currentUserRating ? "Update Your Rating" : "Submit Your Rating")}
        </Button>

        {currentUserRating && (
          <p className="text-sm text-muted-foreground mt-2 text-center sm:text-left">
            You previously rated as <span className="font-semibold text-foreground">{currentUserRating.perception}</span> with <span className="font-semibold text-foreground">{currentUserRating.stars} stars</span>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
