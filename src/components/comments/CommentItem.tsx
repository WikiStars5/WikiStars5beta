
"use client";

import type { FigureComment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from '@/components/shared/StarRating';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale'; // Spanish locale

interface CommentItemProps {
  comment: FigureComment;
}

export function CommentItem({ comment }: CommentItemProps) {
  let displayDate = "Hace un momento";
  if (comment.timestamp) {
    try {
      const date = typeof comment.timestamp === 'string'
        ? new Date(comment.timestamp)
        : new Date(comment.timestamp.seconds * 1000 + comment.timestamp.nanoseconds / 1000000);

      if (!isNaN(date.getTime())) {
         displayDate = formatDistanceToNow(date, { addSuffix: true, locale: es });
      } else {
        console.warn("Invalid date for comment timestamp:", comment.timestamp);
      }
    } catch (error) {
      console.warn("Error parsing comment timestamp:", comment.timestamp, error);
    }
  }


  return (
    <div className="flex space-x-3 py-4 border-b border-border last:border-b-0">
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={comment.userPhotoURL || undefined} alt={comment.username} />
        <AvatarFallback>{comment.username ? comment.username.charAt(0).toUpperCase() : "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-foreground">{comment.username}</p>
            {comment.ratingGiven > 0 && (
              <StarRating rating={comment.ratingGiven} size={16} readOnly />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{displayDate}</p>
        </div>
        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{comment.commentText}</p>
        {/* Placeholder for future actions like reply, like/dislike */}
        {/*
        <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
          <button className="hover:text-primary">Responder</button>
          <button className="hover:text-primary flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> 0</button>
          <button className="hover:text-primary flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> 0</button>
        </div>
        */}
      </div>
    </div>
  );
}
