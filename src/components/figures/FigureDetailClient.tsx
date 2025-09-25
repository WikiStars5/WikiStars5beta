

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2 as FamilyIcon, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  ImageOff, Star as StarIcon,
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap,
  MessagesSquare, Send, Trash2, Images, PlusCircle, Image as ImageIconLucide, ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight,
  Archive, Bike, UserPlus, Flame, BarChart3, CheckSquare, Youtube, Camera
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
import type { Figure, Streak, AttitudeKey } from "@/lib/types";
import { EditableFigureInfo } from '@/components/figures/FigureInfo';
import { doc, onSnapshot, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { mapDocToFigure } from "@/lib/placeholder-data";
import { RelatedProfiles } from "@/components/figures/RelatedProfiles";
import { CommentSection } from "@/components/comments/CommentSection";
import { TopStreaks } from "@/components/figures/TopStreaks";
import { StarRatingVote } from "@/components/figures/StarRatingVote";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isSameDay, isYesterday } from "date-fns";
import { FigureShorts } from "@/components/figures/FigureShorts";
import { FigureTiktoks } from "@/components/figures/FigureTiktoks";
import { FigureInstagramPosts } from '@/components/figures/FigureInstagramPosts';

interface FigureDetailClientProps {
  initialFigure: Figure;
}

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2859 3333" {...props} shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd">
        <path d="M2081 0c55 473 319 755 778 785v532c-266 26-499-61-770-225v995c0 1264-1378 1659-1932 753-356-583-138-1606 1004-1647v561c-87 14-180 36-265 65-254 86-458 249-458 522 0 314 252 566 566 566 314 0 566-252 566-566v-1040h550v-550h-550z" fill="currentColor"/>
    </svg>
);


export function FigureDetailClient({ initialFigure }: FigureDetailClientProps) {
  const routeParams = useParams<{ id:string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = routeParams?.id;
  const { firebaseUser } = useAuth();

  const [figure, setFigure] = React.useState<Figure | null | undefined>(initialFigure); 
  const [viewerImageUrl, setViewerImageUrl] = React.useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = React.useState<string | null>(null);
  const [currentUserStreak, setCurrentUserStreak] = React.useState<number | null>(null);
  const [commentSortPreference, setCommentSortPreference] = React.useState<AttitudeKey | null>(null);


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

  // Add a real-time listener for the user's streak on this figure
  React.useEffect(() => {
      if (!id || !firebaseUser) {
          setCurrentUserStreak(null);
          return;
      }

      const streakDocRef = doc(db, `figures/${id}/streaks`, firebaseUser.uid);
      const unsubscribeStreak = onSnapshot(streakDocRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data() as Streak;
              const lastDate = (data.lastCommentDate as Timestamp).toDate();
              const today = new Date();
              if (isSameDay(today, lastDate) || isYesterday(today, lastDate)) {
                  setCurrentUserStreak(data.currentStreak);
              } else {
                  setCurrentUserStreak(null); // Streak is not active
              }
          } else {
              setCurrentUserStreak(null); // No streak exists
          }
      }, (error) => {
          console.error("Error listening to user streak:", error);
          setCurrentUserStreak(null);
      });

      return () => unsubscribeStreak();

  }, [id, firebaseUser]);

  // Scroll to hash element if present in URL
  React.useEffect(() => {
    // We wrap this in a setTimeout to ensure the DOM has had time to render all comments.
    const timer = setTimeout(() => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#comment-')) {
        const elementId = hash.substring(1);
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the element (the CommentItem component handles this)
          setHighlightedCommentId(elementId.replace('comment-', ''));
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
    <>
      <div className="space-y-8 lg:space-y-12">
        <ProfileHeader 
          figure={figure}
          onImageClick={handleOpenProfileImage}
          currentStreak={currentUserStreak}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-3 space-y-8">
             <Tabs defaultValue="attitude" className="w-full">
              <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar mb-6 p-1 h-auto rounded-lg bg-black border border-white/20"> 
                <TabsTrigger value="personal-info" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Info className="h-4 sm:h-5 w-4 sm:w-5" />Información</TabsTrigger>
                <TabsTrigger value="attitude" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><CheckSquare className="h-4 sm:h-5 w-4 sm:w-5" />Actitud</TabsTrigger>
                <TabsTrigger value="emotion" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><SmilePlus className="h-4 sm:h-5 w-4 sm:w-5" />Emoción</TabsTrigger>
                <TabsTrigger value="top-streaks" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Flame className="h-4 sm:h-5 w-4 sm:w-5" />Top Rachas</TabsTrigger>
                {/*
                <TabsTrigger value="shorts" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Youtube className="h-4 sm:h-5 w-4 sm:w-5" />Shorts</TabsTrigger>
                <TabsTrigger value="tiktoks" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><TikTokIcon className="h-4 sm:h-5 w-4 sm:w-5" />TikToks</TabsTrigger>
                <TabsTrigger value="instagram" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Camera className="h-4 sm:h-5 w-4 sm:w-5" />Fotos</TabsTrigger>
                */}
              </TabsList>

              <TabsContent value="personal-info">
                  <EditableFigureInfo figure={figure} />
              </TabsContent>
              
              <TabsContent value="attitude">
                  <AttitudeVote 
                    figureId={figure.id} 
                    figureName={figure.name}
                    profileType={figure.profileType} 
                    attitudeCounts={figure.attitudeCounts}
                    onVote={setCommentSortPreference}
                  />
              </TabsContent>
              
              <TabsContent value="emotion">
                  <PerceptionEmotions 
                    figureId={figure.id} 
                    figureName={figure.name} 
                    perceptionCounts={figure.perceptionCounts}
                  />
              </TabsContent>

              <TabsContent value="top-streaks">
                  <TopStreaks figureId={figure.id} />
              </TabsContent>

              <TabsContent value="shorts">
                  <FigureShorts figure={figure} />
              </TabsContent>
              
              <TabsContent value="tiktoks">
                  <FigureTiktoks figure={figure} />
              </TabsContent>

              <TabsContent value="instagram">
                  <FigureInstagramPosts figure={figure} />
              </TabsContent>

            </Tabs>
          </div> 
        </div>
        
        <StarRatingVote figure={figure} />
        
        <CommentSection 
          figure={figure} 
          highlightedCommentId={highlightedCommentId} 
          sortPreference={commentSortPreference}
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
    </>
  );
}
