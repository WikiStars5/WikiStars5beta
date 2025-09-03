

"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessagesSquare, Send, Star, StarOff, Smile } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Figure, Comment as CommentType, UserProfile, RatingValue } from '@/lib/types';
import { addComment, mapDocToComment, updateStreak, submitStarRating } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { CommentItem } from './CommentItem';
import { GuestProfileSetup } from './GuestProfileSetup';
import { cn, correctMalformedUrl } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { countryCodeToNameMap } from '@/config/countries';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface CommentSectionProps {
  figure: Figure;
  onCommentPosted: (streak: number | null) => void;
  highlightedCommentId?: string | null;
}

const MAX_COMMENT_LENGTH = 1000;
const INITIAL_COMMENTS_TO_SHOW = 5;

const RATING_OPTIONS: RatingValue[] = [1, 2, 3, 4, 5];

const EMOJI_LIST = [
  '😂', '❤️', '😍', '🤔', '😊', '👍', '👎', '🔥', '👏', '🙏',
  '😭', '😱', '😡', '🤯', '💯', '✅', '👀', '✨', '🎉', '🌟'
];

const RATING_SOUNDS: Record<RatingValue, string> = {
    0: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar0.mp3?alt=media&token=48731777-62f4-413c-8a21-4f183c577d61',
    1: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar1.mp3?alt=media&token=a11df570-a6ee-4828-b5a9-81ccbb2c0457',
    2: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar2.mp3?alt=media&token=58cbf607-df0b-4bbd-b28e-291cf1951c18',
    3: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar3.mp3?alt=media&token=df67dc5b-28ab-4773-8266-60b9127a325f',
    4: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar4.mp3?alt=media&token=40c72095-e6a0-42d6-a3f6-86a81c356826',
    5: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/audio%2Fstar5.mp3?alt=media&token=8705fce9-1baa-4f49-8783-7bfc9d35a80f',
};


export function CommentSection({ figure, onCommentPosted, highlightedCommentId }: CommentSectionProps) {
  const [commentText, setCommentText] = React.useState('');
  const [selectedRating, setSelectedRating] = React.useState<RatingValue | null>(null);
  const [hoveredRating, setHoveredRating] = React.useState<RatingValue | null>(null);
  const [comments, setComments] = React.useState<CommentType[]>([]);
  const [isPosting, setIsPosting] = React.useState(false);
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  const audioRefs = React.useRef<Record<RatingValue, HTMLAudioElement | null>>({ 0: null, 1: null, 2: null, 3: null, 4: null, 5: null });

  const { user: firestoreUser, firebaseUser, isLoading: isAuthLoading, isAnonymous } = useAuth();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);

  const { toast } = useToast();

  React.useEffect(() => {
    // Preload audio files
    Object.entries(RATING_SOUNDS).forEach(([key, src]) => {
        const rating = parseInt(key) as RatingValue;
        const audio = new Audio(src);
        audio.preload = 'auto';
        audioRefs.current[rating] = audio;
    });
  }, []);

  const playRatingSound = (rating: RatingValue) => {
    const audio = audioRefs.current[rating];
    if (audio) {
      audio.currentTime = 0; // Rewind to the start
      audio.play().catch(e => console.error("Error playing sound:", e));
    }
  };

  const updateUserState = React.useCallback(() => {
    if (isAuthLoading) {
      return;
    }
  
    if (isAnonymous) {
      const guestUsername = localStorage.getItem('wikistars5-guestUsername');
      if (guestUsername) {
        setCurrentUser({
          uid: firebaseUser?.uid || 'guest-uid',
          username: guestUsername,
          gender: localStorage.getItem('wikistars5-guestGender') || '',
          countryCode: localStorage.getItem('wikistars5-guestCountryCode') || '',
          country: countryCodeToNameMap.get(localStorage.getItem('wikistars5-guestCountryCode') || ''),
          email: null,
          role: 'user',
          isAnonymous: true,
          createdAt: new Date().toISOString(),
          photoURL: null,
        });
      } else {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(firestoreUser);
    }
  }, [isAuthLoading, isAnonymous, firebaseUser, firestoreUser]);

  React.useEffect(() => {
    updateUserState();
  
    const handleProfileUpdate = () => {
      updateUserState();
    };
    window.addEventListener('guestProfileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('guestProfileUpdated', handleProfileUpdate);
    };
  }, [updateUserState]);

  React.useEffect(() => {
    setIsLoadingComments(true);
    const commentsPath = `figures/${figure.id}/comments`;
    const commentsRef = collection(db, commentsPath);
    const q = query(
      commentsRef, 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(mapDocToComment);
      setComments(fetchedComments);
      setIsLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      toast({ title: "Error", description: "No se pudieron cargar los comentarios.", variant: "destructive" });
      setIsLoadingComments(false);
    });

    return () => unsubscribe();
  }, [figure.id, toast]);
  

  const handlePostComment = async () => {
    if (!currentUser || !firebaseUser) {
      toast({ title: "Error", description: "Debes tener un perfil para comentar.", variant: "destructive" });
      return;
    }
    if (commentText.trim().length < 3) {
      toast({ title: "Comentario muy corto", description: "Tu comentario debe tener al menos 3 caracteres.", variant: "destructive" });
      return;
    }
    if (commentText.length > MAX_COMMENT_LENGTH) {
      toast({
          title: "Comentario demasiado largo",
          description: `Tu comentario no puede exceder los ${MAX_COMMENT_LENGTH} caracteres.`,
          variant: "destructive"
      });
      return;
    }
    setIsPosting(true);
    try {
      const authorData = {
          id: currentUser.uid,
          name: currentUser.username,
          photoUrl: currentUser.photoURL || null,
          gender: currentUser.gender || '',
          country: currentUser.country || '',
          countryCode: currentUser.countryCode || '',
          isAnonymous: currentUser.isAnonymous || false,
      };

      // Submit rating if one is selected
      if (selectedRating !== null) {
        await submitStarRating(figure.id, firebaseUser.uid, selectedRating);
        playRatingSound(selectedRating);
      }

      await addComment(figure.id, authorData, commentText.trim(), selectedRating);
      
      const newStreak = await updateStreak(figure.id, authorData);
      onCommentPosted(newStreak);

      setCommentText('');
      setSelectedRating(null); // Reset rating after posting
      toast({ title: "¡Opinión Publicada!", description: "Gracias por tu contribución." });

    } catch (error: any) {
      console.error("Error posting comment: ", error);
      toast({ title: "Error", description: error.message || "No se pudo publicar tu opinión.", variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleRatingClick = (rating: RatingValue) => {
    if (isPosting) return;
    const newRating = selectedRating === rating ? null : rating;
    setSelectedRating(newRating);
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + emoji + text.substring(end);

    setCommentText(newText);

    // Focus the textarea and set the cursor position after the inserted emoji
    textarea.focus();
    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };


  const renderCommentInput = () => {
    if (!currentUser) {
      return (
          <div className="text-center p-4 border-2 border-dashed rounded-lg">
              <p className="mb-4 text-muted-foreground">Para comentar, primero debes crear un perfil de invitado.</p>
              <GuestProfileSetup onProfileSave={updateUserState} />
          </div>
      );
    }

    return (
      <div className="flex gap-4">
          <Avatar className="h-10 w-10 mt-1">
              <AvatarImage src={correctMalformedUrl(currentUser.photoURL)} alt={currentUser.username} />
              <AvatarFallback>{currentUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-2">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Button
                    variant={selectedRating === 0 ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleRatingClick(0)}
                    className="flex items-center gap-1"
                  >
                      <StarOff className="h-4 w-4"/>
                      0 Estrellas
                  </Button>
                  <div className="flex items-center gap-1">
                    {RATING_OPTIONS.map((rating) => (
                        <Star
                            key={rating}
                            className={cn(
                                "h-7 w-7 cursor-pointer transition-colors",
                                (hoveredRating ?? selectedRating ?? -1) >= rating
                                    ? "text-primary fill-primary"
                                    : "text-muted-foreground/50 hover:text-primary"
                            )}
                            onMouseEnter={() => setHoveredRating(rating)}
                            onMouseLeave={() => setHoveredRating(null)}
                            onClick={() => handleRatingClick(rating)}
                        />
                    ))}
                  </div>
              </div>
              <div className="relative">
                <Textarea
                    ref={textareaRef}
                    placeholder="Escribe tu opinión aquí..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    className="bg-muted border-border/50 focus:bg-background pr-10"
                    maxLength={MAX_COMMENT_LENGTH}
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 h-7 w-7 text-muted-foreground">
                            <Smile className="h-5 w-5" />
                            <span className="sr-only">Añadir emoji</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-5 gap-1">
                            {EMOJI_LIST.map(emoji => (
                                <Button 
                                    key={emoji}
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-xl"
                                    onClick={() => handleEmojiSelect(emoji)}
                                >
                                    {emoji}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-between items-center">
                  <p className={cn("text-xs text-muted-foreground", commentText.length > MAX_COMMENT_LENGTH && "text-destructive")}>
                      {commentText.length} / {MAX_COMMENT_LENGTH}
                  </p>
                  <Button onClick={handlePostComment} disabled={isPosting}>
                      {isPosting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                      Publicar
                  </Button>
              </div>
          </div>
      </div>
    );
  };

  const commentsToShow = showAllComments ? comments : comments.slice(0, INITIAL_COMMENTS_TO_SHOW);

  if (isAuthLoading) {
    return (
      <Card className="border border-white/20 bg-black">
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-white/20 bg-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare /> Opiniones y Discusión
          </CardTitle>
          <CardDescription>
            Comparte tu opinión sobre {figure.name}. Sé respetuoso y mantén la conversación constructiva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {renderCommentInput()}

          <Separator />

          <div className="space-y-6">
            {isLoadingComments ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Cargando comentarios...</p>
              </div>
            ) : comments.length > 0 ? (
              <>
                {commentsToShow.map((comment) => (
                  <CommentItem 
                    key={comment.id}
                    figure={figure}
                    comment={comment}
                    parentPath={`figures/${figure.id}/comments`}
                    onReplyPosted={onCommentPosted}
                    highlightedCommentId={highlightedCommentId}
                  />
                ))}
                {comments.length > INITIAL_COMMENTS_TO_SHOW && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => setShowAllComments(!showAllComments)}>
                          {showAllComments ? 'Mostrar menos comentarios' : `Ver los ${comments.length - INITIAL_COMMENTS_TO_SHOW} comentarios restantes`}
                      </Button>
                    </div>
                  )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">
                Aún no hay opiniones. ¡Sé el primero en compartir la tuya!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
