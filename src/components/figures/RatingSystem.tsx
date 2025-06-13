
"use client";

import { useState, useEffect } from 'react';
import type { PerceptionKeys, UserRating, Figure } from '@/lib/types';
import { PERCEPTION_OPTIONS } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
// StarRating is removed from here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, Loader2, Send } from 'lucide-react'; // Added Send icon
import { submitUserPerception, getUserPerception } from '@/lib/actions/ratingActions'; // submitUserRating renamed to submitUserPerception
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

interface RatingSystemProps {
  figure: Figure;
}

export function RatingSystem({ figure }: RatingSystemProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPerception, setSelectedPerception] = useState<PerceptionKeys | null>(null);
  // starRating state is removed
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
        getUserPerception(user.uid, figure.id).then(existingPerception => {
          if (existingPerception) {
            setSelectedPerception(existingPerception.perception);
            setCurrentUserDbPerception(existingPerception);
          }
          setIsFetchingInitial(false);
        });
      } else {
        setIsFetchingInitial(false);
      }
    });
    return () => unsubscribe();
  }, [figure.id]);

  const handleSubmitPerception = async () => {
    if (!currentUserFb) {
      toast({ title: "Login Required", description: "Please log in to submit your perception.", variant: "destructive" });
      return;
    }
    if (!selectedPerception) {
      toast({ title: "Perception Missing", description: "Please select your perception.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    // Call the action that only submits perception
    const result = await submitUserPerception(currentUserFb.uid, figure.id, selectedPerception);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Perception Submitted!",
        description: `Your perception of ${figure.name} as ${selectedPerception} has been recorded.`,
        action: <Button variant="outline" size="sm"><ThumbsUp className="mr-2 h-4 w-4" />Got it!</Button>
      });
      setCurrentUserDbPerception({ // Update local state
        userId: currentUserFb.uid,
        figureId: figure.id,
        perception: selectedPerception,
        timestamp: new Date().toISOString()
      });
      router.refresh();
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
          <div className="h-32 animate-pulse bg-muted rounded-md flex items-center justify-center">
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
          <CardTitle>Your Perception of {figure.name}</CardTitle>
          <CardDescription>Log in to share your perception.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link href="/login">Login to Share Perception</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Perception of {figure.name}</CardTitle>
        <CardDescription>What do you consider yourself?</CardDescription>
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
                <span className="text-sm">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Star rating section removed from here */}
        
        <Button onClick={handleSubmitPerception} disabled={isLoading || !selectedPerception} className="w-full sm:w-auto text-lg py-3 px-6">
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
