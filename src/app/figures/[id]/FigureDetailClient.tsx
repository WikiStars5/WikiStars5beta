
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Terminal, Info, UserCircle, Globe, Briefcase, Users2 as FamilyIcon, Edit, Save, X, Loader2, LogIn, MessageSquare, SmilePlus, 
  ImageOff, Star as StarIcon,
  BookOpen, Cake, MapPin, Activity, HeartHandshake, StretchVertical, Scale, Palette, Eye, Scan, NotepadText, Zap,
  MessagesSquare, Send, Trash2, Images, PlusCircle, Image as ImageIconLucide, ThumbsUp, ThumbsDown, MessageSquareReply, CornerDownRight,
  Archive, Bike, UserPlus, Flame
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
import { auth as firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ShareButton } from "@/components/shared/ShareButton";
import type { Figure, FanFigure } from "@/lib/types";
import { 
  grantFirstGlanceAchievement,
} from '@/app/actions/achievementActions';
import { StreakAnimation } from "@/components/shared/StreakAnimation";
import { FigureInfo } from '@/components/figures/FigureInfo';

interface FigureDetailClientProps {
  initialFigure: Figure;
}

export default function FigureDetailClient({ initialFigure }: FigureDetailClientProps) {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const router = useRouter();

  const [figure, setFigure] = React.useState<Figure | null | undefined>(initialFigure); 
  
  React.useEffect(() => {
      setFigure(initialFigure);
  }, [initialFigure]);

  const { toast } = useToast();

  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = React.useState<any>(null); // To store Firestore profile
  
  const [viewerImageUrl, setViewerImageUrl] = React.useState<string | null>(null);
  
  const [animationStreak, setAnimationStreak] = React.useState<number | null>(null);
  const [isFan, setIsFan] = React.useState(false);

  const checkIsFan = React.useCallback(() => {
    if (!figure) return;
    try {
      const fanListJSON = localStorage.getItem('wikistars5-fan-list');
      if (fanListJSON) {
        const fanList: FanFigure[] = JSON.parse(fanListJSON);
        const isFigureFan = fanList.some(f => f.id === figure.id);
        setIsFan(isFigureFan);
      } else {
        setIsFan(false);
      }
    } catch (error) {
      console.error("Error checking fan list:", error);
      setIsFan(false);
    }
  }, [figure]);

  React.useEffect(() => {
    checkIsFan();
  }, [checkIsFan]);

  const handleFanToggle = () => {
    if (!figure) return;
    try {
      const fanListJSON = localStorage.getItem('wikistars5-fan-list');
      let fanList: FanFigure[] = fanListJSON ? JSON.parse(fanListJSON) : [];
      
      const isAlreadyFan = fanList.some(f => f.id === figure.id);
      
      if (isAlreadyFan) {
        fanList = fanList.filter(f => f.id !== figure.id);
        toast({ title: "Eliminado de Fans", description: `${figure.name} ya no está en tu lista de fans.` });
      } else {
        const newFan: FanFigure = {
          id: figure.id,
          name: figure.name,
          photoUrl: figure.photoUrl,
          addedAt: new Date().toISOString(),
        };
        fanList.push(newFan);
        toast({ title: "¡Añadido a Fans!", description: `Has marcado a ${figure.name} como tu fan.` });
      }
      
      localStorage.setItem('wikistars5-fan-list', JSON.stringify(fanList));
      checkIsFan(); 
      
    } catch (error) {
      console.error("Error toggling fan status:", error);
      toast({ title: "Error", description: "No se pudo actualizar tu lista de fans.", variant: "destructive" });
    }
  };

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setCurrentUser(user);

      if (user && !user.isAnonymous) { 
        const result = await grantFirstGlanceAchievement(user.uid);
        if (result.unlocked && result.message) {
          toast({
            title: '¡Logro Desbloqueado!',
            description: result.message,
          });
        }
      }
    });
    return () => unsubscribe();
  }, [toast]); 


  const handleOpenProfileImage = (imageUrl: string) => {
    if (imageUrl) {
      setViewerImageUrl(imageUrl);
    }
  };

  if (figure === undefined) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 lg:space-y-12">
      <StreakAnimation 
        streakCount={animationStreak}
        isOpen={animationStreak !== null}
        onClose={() => setAnimationStreak(null)}
      />
      
      <ProfileHeader 
        figure={figure!} 
        currentUser={currentUser}
        currentUserStreak={null}
        isFan={isFan}
        onFanToggle={handleFanToggle}
        onImageClick={handleOpenProfileImage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-3 space-y-8">
          <Tabs defaultValue="attitude-poll" className="w-full">
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar mb-6 p-1 h-auto rounded-lg bg-black border border-white/20"> 
              <TabsTrigger value="personal-info" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><Info className="h-4 sm:h-5 w-4 sm:w-5" />Información</TabsTrigger>
              <TabsTrigger value="attitude-poll" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><MessageSquare className="h-4 sm:h-5 w-4 sm:w-5" />Actitud</TabsTrigger>
              <TabsTrigger value="perception-emotions" className="text-sm sm:text-base py-2 px-3 sm:px-4 flex-shrink-0 flex items-center gap-2 whitespace-nowrap"><SmilePlus className="h-4 sm:h-5 w-4 sm:w-5" />Emoción</TabsTrigger>
            </TabsList>

            <TabsContent value="personal-info">
                <FigureInfo figure={figure!} currentUser={currentUser} />
            </TabsContent>

            <TabsContent value="attitude-poll">{figure && currentUser !== undefined && (<AttitudeVote figureId={figure.id} figureName={figure.name} initialAttitudeCounts={figure.attitudeCounts} currentUser={currentUser} />)}{(!figure || currentUser === undefined) && (<div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}</TabsContent>
            <TabsContent value="perception-emotions">{figure && currentUser !== undefined && (<PerceptionEmotions figureId={figure.id} figureName={figure.name} initialPerceptionCounts={figure.perceptionCounts} currentUser={currentUser} />)}{(!figure || currentUser === undefined) && (<div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>)}</TabsContent>
          </Tabs>
        </div> 
      </div>

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
