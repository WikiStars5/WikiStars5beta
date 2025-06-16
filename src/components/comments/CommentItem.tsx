
"use client";

import type { CommentData } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/shared/StarRating'; // Using the generic StarRating for display
import { ThumbsUp, ThumbsDown, User, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { auth } from '@/lib/firebase'; // For checking if current user is owner
// import { useState, useEffect } from 'react';
// import type { User as FirebaseUser } from 'firebase/auth';
// import { onAuthStateChanged } from 'firebase/auth';

interface CommentItemProps {
  comment: CommentData;
  currentUserId?: string | null;
  onLike?: (commentId: string) => void;
  onDislike?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  // userReaction?: 'like' | 'dislike' | null; // Future prop
}

export function CommentItem({
  comment,
  currentUserId,
  onLike,
  onDislike,
  onDelete,
  // userReaction
}: CommentItemProps) {
  // const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     setAuthUser(user);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const timeAgo = comment.createdAt
    ? formatDistanceToNowStrict(comment.createdAt.toDate(), { addSuffix: true, locale: es })
    : 'hace un momento';

  const avatarFallback = comment.username?.[0]?.toUpperCase() || <User className="h-5 w-5" />;
  const isOwner = currentUserId === comment.userId;

  // Placeholder handler for like/dislike/delete until fully implemented
  const handleLike = () => {
    // onLike?.(comment.id); 
    console.warn("Like functionality not fully implemented yet for comment:", comment.id);
  };
  const handleDislike = () => {
    // onDislike?.(comment.id);
    console.warn("Dislike functionality not fully implemented yet for comment:", comment.id);
  };
  const handleDelete = () => {
    // if (isOwner && confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
    //   onDelete?.(comment.id);
    // }
    console.warn("Delete functionality not fully implemented yet for comment:", comment.id);
  };


  return (
    <div className="flex space-x-3 py-4 border-b border-border/80 last:border-b-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={comment.userPhotoUrl || undefined} alt={comment.username} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-foreground">{comment.username}</span>
            <StarRating rating={comment.rating} size={14} readOnly />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Más opciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    Eliminar Comentario (Próximamente)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{comment.text}</p>
        <div className="mt-2 flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleLike} className="text-muted-foreground hover:text-primary p-1 h-auto disabled:opacity-50" disabled>
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span className="text-xs">{comment.likes}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDislike} className="text-muted-foreground hover:text-destructive p-1 h-auto disabled:opacity-50" disabled>
            <ThumbsDown className="h-4 w-4 mr-1" />
            <span className="text-xs">{comment.dislikes}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
