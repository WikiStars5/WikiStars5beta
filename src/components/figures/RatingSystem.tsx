
"use client";

import { useState, useEffect } from 'react';
import type { PerceptionKeys, UserRating, Figure } from '@/lib/types';
import { PERCEPTION_OPTIONS } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, Loader2, Send } from 'lucide-react';
import { submitUserPerception, getUserPerception } from '@/lib/actions/ratingActions';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

interface RatingSystemProps {
  figure: Figure; // Now receives the full figure object to access perceptionCounts
}

export function RatingSystem({ figure }: RatingSystemProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPerception, setSelectedPerception] = useState<PerceptionKeys | null>(null);
  const [currentUserFb, setCurrentUserFb] = useState<FirebaseUser | null>(null);
  const [currentUserDbPerception, setCurrentUserDbPerception] = useState<UserRating | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserFb(user);
      setAuthLoading(false);
      if (user) {
        setIsFetchingInitial(true);
        getUserPerception(user.uid, figure.id).then(existingPerceptionData => {
          if (existingPerceptionData) {
            setSelectedPerception(existingPerceptionData.perception);
            setCurrentUserDbPerception(existingPerceptionData);
          }
          setIsFetchingInitial(false);
        });
      } else {
        setIsFetchingInitial(false);
        setSelectedPerception(null);
        setCurrentUserDbPerception(null);
      }
    });
    return () => unsubscribe();
  }, [figure.id]);

  const handleSubmit = async () => {
    if (!currentUserFb) {
      toast({ title: "Login Required", description: "Please log in to submit your perception.", variant: "destructive" });
      return;
    }
    if (!selectedPerception) {
      toast({ title: "Perception Missing", description: "Please select your perception.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const result = await submitUserPerception(currentUserFb.uid, figure.id, selectedPerception);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Perception Submitted!",
        description: `Your perception of ${figure.name} as ${selectedPerception} has been recorded.`,
        action: <Button variant="outline" size="sm"><ThumbsUp className="mr-2 h-4 w-4" />Got it!</Button>
      });
      // Update local state to reflect the submission without re-fetching immediately
      setCurrentUserDbPerception({ 
        userId: currentUserFb.uid,
        figureId: figure.id,
        perception: selectedPerception,
        timestamp: new Date().toISOString() 
      });
      router.refresh(); // This will re-fetch figure data including updated perceptionCounts
    } else {
      toast({
        title: "Perception Submission Failed",
        description: result.message || "Could not submit your perception.",
        variant: "destructive",
      });
    }
  };
  
  if (authLoading || isFetchingInitial) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-40 animate-pulse bg-muted rounded-md flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUserFb) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-2xl'>Share Your Perception</CardTitle>
          <CardDescription>Log in to let us know if you're a fan, hater, or something else regarding {figure.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link href={`/login?redirect=/figures/${figure.id}`}>Login to Share Perception</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const perceptionCounts = figure.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Perception of {figure.name}</CardTitle>
        <CardDescription>What do you consider yourself regarding this figure?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-md font-medium mb-3">Choose your perception:</h4>
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
                disabled={isLoading}
              >
                <option.icon className={cn("w-7 h-7 mb-1", selectedPerception === option.key ? "text-primary-foreground" : "text-foreground/80")} />
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">({perceptionCounts[option.key] || 0})</span>
              </Button>
            ))}
          </div>
        </div>
                
        <Button onClick={handleSubmit} disabled={isLoading || !selectedPerception} className="w-full sm:w-auto text-lg py-3 px-6">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {isLoading ? "Submitting..." : (currentUserDbPerception?.perception && currentUserDbPerception.perception === selectedPerception ? "Update Perception" : "Submit Perception")}
        </Button>

        {currentUserDbPerception && (
          <p className="text-sm text-muted-foreground mt-2 text-center sm:text-left">
            You previously set your perception as <span className="font-semibold text-foreground">{currentUserDbPerception.perception}</span>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
