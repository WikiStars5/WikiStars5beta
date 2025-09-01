
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2 as FamilyIcon, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  ImageOff, Star as StarIcon,
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap,
  MessagesSquare, Send, Trash2, Images, PlusCircle, Image as ImageIconLucide, ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight,
  Archive, Bike, UserPlus, Flame, BarChart3
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AttitudeVote } from '@/components/figures/AttitudeVote';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from 'react';
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { PerceptionEmotions } from "@/components/figures/PerceptionEmotions";
import { ImageGalleryViewer } from "@/components/figures/ImageGalleryViewer";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { ShareButton } from "@/components/shared/ShareButton";
import type { Figure, LocalUserStreak, UserProfile } from "@/lib/types";
import { 
  grantFirstGlanceAchievement,
} from '@/app/actions/achievementActions';
import { StreakAnimation } from "@/components/shared/StreakAnimation";
import { FigureInfo } from '@/components/figures/FigureInfo';
import { doc, onSnapshot, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { mapDocToFigure } from "@/lib/placeholder-data";
import { RelatedProfiles } from "@/components/figures/RelatedProfiles";
import { CommentSection } from "@/components/comments/CommentSection";
import { differenceInHours } from 'date-fns';
import { TopStreaks } from "@/components/figures/TopStreaks";
import { useAuth } from "@/hooks/useAuth";
import { countryCodeToNameMap } from "@/config/countries";
import { RatingsTabContent } from "@/components/figures/RatingsTabContent";

interface FigureDetailClientProps {
  initialFigure: Figure;
}

export function FigureDetailClient({ initialFigure }: FigureDetailClientProps) {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const router = useRouter();

  const [figure, setFigure] = React.useState<Figure | null | undefined>(initialFigure); 
  const { toast } = useToast();
  const { user: firestoreUser, firebaseUser, isLoading: isAuthLoading, isAnonymous } = useAuth();
  
  const [viewerImageUrl, setViewerImageUrl] = React.useState<string | null>(null);
  
  const [animationStreak, setAnimationStreak] = React.useState<number | null>(null);
  const [headerStreak, setHeaderStreak] = React.useState<number | null>(null);


  const checkHeaderStreak = React.useCallback(async () => {
    if (typeof window !== 'undefined' && id && firebaseUser) {
        const streaksJSON = localStorage.getItem('wikistars5-userStreaks');
        if (streaksJSON) {
            const localStreaks: LocalUserStreak[] = JSON.parse(streaksJSON);
            const figureStreak = localStreaks.find(s => s.figureId === id);
            
            if (figureStreak) {
                const lastCommentDate = new Date(figureStreak.lastCommentDate);
                const hoursSinceLastComment = differenceInHours(new Date(), lastCommentDate);
                
                if (hoursSinceLastComment < 24) {
                    setHeaderStreak(figureStreak.currentStreak);
                } else {
                    setHeaderStreak(null); // Streak expired
                }
            } else {
                setHeaderStreak(null); // No streak for this figure
            }
        } else {
            setHeaderStreak(null); // No streaks stored at all
        }
    } else {
       setHeaderStreak(null);
    }
  }, [id, firebaseUser]);


  React.useEffect(() => {
    if (firebaseUser && !firebaseUser.isAnonymous) { 
        grantFirstGlanceAchievement(firebaseUser.uid).then(result => {
          if (result.unlocked && result.message) {
            toast({
              title: '¡Logro Desbloqueado!',
              description: result.message,
            });
          }
        });
    }
  }, [firebaseUser, toast]); 

  // Check streak whenever current user changes
  React.useEffect(() => {
    checkHeaderStreak();
  }, [firebaseUser, checkHeaderStreak]);

  // Add a real-time listener to the figure document
  React.useEffect(() => {
    if (!id) return;
    const figureDocRef = doc(db, 'figures', id);

    const unsubscribe = onSnapshot(figureDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setFigure(mapDocToFigure(docSnap));
        } else {
            console.warn(`Figure with id ${id} not found.`);
            setFigure(null);
        }
    }, (error) => {
        console.error("Error listening to figure document:", error);
    });

    return () => unsubscribe();
  }, [id]);


  const handleOpenProfileImage = (imageUrl: string) => {
    if (imageUrl) {
      setViewerImageUrl(imageUrl);
    }
  };

  const handleCommentPosted = (streak: number | null) => {
    setAnimationStreak(streak);
    checkHeaderStreak(); // Re-check header streak after posting
  }


  if (figure === undefined || isAuthLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!figure) return <div>Figura no encontrada.</div>;

  return (
    <div className="space-y-8 lg:space-y-12">
      <StreakAnimation 
        streakCount={animationStreak}
        isOpen={animationStreak !== null}
        onClose={() => setAnimationStreak(null)}
      />
      
      <ProfileHeader 
        figure={figure}
        onImageClick={handleOpenProfileImage}
        streakCount={headerStreak}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-3 space-y-8">
          <Tabs defaultValue="personal-info" className="w-full">
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar mb-6 p-1 h-auto rounded-lg bg-black border border-white/20"> 
              <TabsTrigger value="personal-info" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Info className="h-4 sm:h-5 w-4 sm:w-5" />Información</TabsTrigger>
              <TabsTrigger value="attitude" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><HeartHandshake className="h-4 sm:h-5 w-4 sm:w-5" />Actitud</TabsTrigger>
              <TabsTrigger value="emotion" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><SmilePlus className="h-4 sm:h-5 w-4 sm:w-5" />Emoción</TabsTrigger>
              <TabsTrigger value="top-streaks" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Flame className="h-4 sm:h-5 w-4 sm:w-5" />Top Rachas</TabsTrigger>
              <TabsTrigger value="ratings" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><BarChart3 className="h-4 sm:h-5 w-4 sm:w-5" />Calificaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="personal-info">
                <FigureInfo figure={figure} />
            </TabsContent>
            
            <TabsContent value="attitude">
                <AttitudeVote 
                  figureId={figure.id} 
                  figureName={figure.name} 
                  initialAttitudeCounts={figure.attitudeCounts} 
                />
            </TabsContent>
            
            <TabsContent value="emotion">
                <PerceptionEmotions 
                  figureId={figure.id} 
                  figureName={figure.name} 
                  initialPerceptionCounts={figure.perceptionCounts}
                />
            </TabsContent>

            <TabsContent value="top-streaks">
                <TopStreaks figureId={figure.id} />
            </TabsContent>
            
            <TabsContent value="ratings">
                <Card>
                    <CardHeader>
                        <CardTitle>Calificaciones</CardTitle>
                        <CardDescription>Esta sección está en construcción.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Próximamente podrás ver más estadísticas aquí.</p>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div> 
      </div>

      <CommentSection figure={figure} onCommentPosted={handleCommentPosted} />
      
      <RelatedProfiles figure={figure} />
      
      {viewerImageUrl && (
        <ImageGalleryViewer
            imageUrl={viewerImageUrl}
            isOpen={!!viewerImageUrl}
            onClose={() => setViewerImageUrl(null)}
        />
      )}
    </div>
  );
}
