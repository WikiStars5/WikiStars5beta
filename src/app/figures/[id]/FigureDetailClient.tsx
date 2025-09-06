
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2 as FamilyIcon, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  ImageOff, Star as StarIcon,
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap,
  MessagesSquare, Send, Trash2, Images, PlusCircle, Image as ImageIconLucide, ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight,
  Archive, Bike, UserPlus, Flame, BarChart3, CheckSquare
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import { Button } from "@/components/ui/button";
import { AttitudeVote } from '@/components/figures/AttitudeVote';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from 'react';
import { ProfileHeader } from "@/components/figures/ProfileHeader";
import { PerceptionEmotions } from "@/components/figures/PerceptionEmotions";
import { ImageGalleryViewer } from "@/components/figures/ImageGalleryViewer";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Figure, LocalUserStreak, UserProfile, Comment as CommentType } from "@/lib/types";
import { StreakAnimation } from "@/components/shared/StreakAnimation";
import { FigureInfo } from '@/components/figures/FigureInfo';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { mapDocToFigure } from "@/lib/placeholder-data";
import { RelatedProfiles } from "@/components/figures/RelatedProfiles";
import { CommentSection } from "@/components/comments/CommentSection";
import { TopStreaks } from "@/components/figures/TopStreaks";
import { StarRatingVote } from "@/components/figures/StarRatingVote";

interface FigureDetailClientProps {
  initialFigure: Figure;
}

export function FigureDetailClient({ initialFigure }: FigureDetailClientProps) {
  const routeParams = useParams<{ id:string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = routeParams?.id;

  const [figure, setFigure] = React.useState<Figure | null | undefined>(initialFigure); 
  const [viewerImageUrl, setViewerImageUrl] = React.useState<string | null>(null);
  
  // State to hold the comment ID from the URL
  const [highlightedCommentId, setHighlightedCommentId] = React.useState<string | null>(null);


  // This effect will run once when the component mounts to check the URL.
  React.useEffect(() => {
    const commentIdFromUrl = searchParams.get('comment');
    if (commentIdFromUrl) {
        setHighlightedCommentId(commentIdFromUrl);
        
        // Clean up the URL after grabbing the comment ID.
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('comment');
        router.replace(newUrl.toString(), { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

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

  // Scroll to hash element if present in URL
  React.useEffect(() => {
    // We wrap this in a setTimeout to ensure the DOM has had time to render the comments.
    const timer = setTimeout(() => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1); // remove #
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 500); // 500ms delay to be safe

    return () => clearTimeout(timer);
  }, []);

  const handleOpenProfileImage = (imageUrl: string) => {
    if (imageUrl) {
      setViewerImageUrl(imageUrl);
    }
  };

  if (figure === undefined) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!figure) return <div>Figura no encontrada.</div>;

  return (
    <div className="space-y-8 lg:space-y-12">
      <ProfileHeader 
        figure={figure}
        onImageClick={handleOpenProfileImage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-3 space-y-8">
           <Tabs defaultValue="attitude" className="w-full">
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar mb-6 p-1 h-auto rounded-lg bg-black border border-white/20"> 
              <TabsTrigger value="personal-info" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Info className="h-4 sm:h-5 w-4 sm:w-5" />Información</TabsTrigger>
              <TabsTrigger value="attitude" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><CheckSquare className="h-4 sm:h-5 w-4 sm:w-5" />Actitud</TabsTrigger>
              <TabsTrigger value="emotion" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><SmilePlus className="h-4 sm:h-5 w-4 sm:w-5" />Emoción</TabsTrigger>
              <TabsTrigger value="top-streaks" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Flame className="h-4 sm:h-5 w-4 sm:w-5" />Top Rachas</TabsTrigger>
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
            
          </Tabs>
        </div> 
      </div>
      
      <StarRatingVote figure={figure} />
      
      <CommentSection 
        figure={figure} 
        highlightedCommentId={highlightedCommentId} 
      />
      
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
