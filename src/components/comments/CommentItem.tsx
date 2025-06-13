"use client";

import type { Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/StarRating";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageSquareReply, Trash2, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { CommentForm } from './CommentForm';
import { mockUser } from '@/lib/types'; // Simulate user session

interface CommentItemProps {
  comment: CommentType;
  onReplySubmitted: (replyText: string, parentId: string) => void;
  onLike: (commentId: string) => void;
  onDislike: (commentId: string) => void;
  onDelete?: (commentId: string) => void; // For admin
  level?: number;
}

export function CommentItem({ comment, onReplySubmitted, onLike, onDislike, onDelete, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [localLikes, setLocalLikes] = useState(comment.likes);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes);
  // In a real app, track liked/disliked status per user
  const [liked, setLiked] = useState(false); 
  const [disliked, setDisliked] = useState(false);

  const isAdmin = mockUser?.id === 'user123'; // Simplified admin check

  const handleLike = () => {
    onLike(comment.id);
    setLocalLikes(prev => liked ? prev -1 : prev + 1);
    if (disliked) {
      setLocalDislikes(prev => prev -1);
      setDisliked(false);
    }
    setLiked(!liked);
  };

  const handleDislike = () => {
    onDislike(comment.id);
    setLocalDislikes(prev => disliked ? prev - 1 : prev + 1);
     if (liked) {
      setLocalLikes(prev => prev -1);
      setLiked(false);
    }
    setDisliked(!disliked);
  };
  
  const timeAgo = formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true });

  return (
    <div className={`flex space-x-3 py-4 ${level > 0 ? 'pl-6 border-l ml-4' : ''} border-b last:border-b-0`}>
      <Avatar className="flex-shrink-0">
        <AvatarImage src={comment.userAvatarUrl} alt={comment.userDisplayName} />
        <AvatarFallback>{comment.userDisplayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.userDisplayName}</span>
            {comment.userStarRating && (
              <StarRating rating={comment.userStarRating} readOnly size={14} />
            )}
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {isAdmin && onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(comment.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete comment</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.text}</p>
        <div className="flex items-center space-x-3 mt-2 text-xs">
          <Button variant="ghost" size="sm" onClick={handleLike} className={`p-1 h-auto ${liked ? 'text-primary' : 'text-muted-foreground'}`}>
            <ThumbsUp className="h-4 w-4 mr-1" /> {localLikes}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDislike} className={`p-1 h-auto ${disliked ? 'text-destructive' : 'text-muted-foreground'}`}>
            <ThumbsDown className="h-4 w-4 mr-1" /> {localDislikes}
          </Button>
          {level < 2 && ( // Limit reply depth for simplicity
             <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="p-1 h-auto text-muted-foreground">
              <MessageSquareReply className="h-4 w-4 mr-1" /> Reply
            </Button>
          )}
        </div>
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              figureId={comment.figureId}
              parentId={comment.id}
              onCommentSubmitted={(replyText) => {
                onReplySubmitted(replyText, comment.id);
                setShowReplyForm(false);
              }}
              placeholder={`Replying to ${comment.userDisplayName}...`}
              submitButtonText="Post Reply"
            />
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                onReplySubmitted={onReplySubmitted}
                onLike={onLike}
                onDislike={onDislike}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
