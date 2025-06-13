"use client";

import type { Comment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/StarRating";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageSquareReply, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { CommentForm } from './CommentForm';
import { mockUser } from '@/lib/types';
import { updateCommentReaction } from '@/lib/actions/commentActions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CommentItemProps {
  comment: CommentType;
  figureName: string; // Needed for CommentForm replies
  onReplySubmittedLocal?: (replyText: string, parentId: string) => void; // For optimistic UI updates if needed
  onDelete?: (commentId: string) => void; // For admin or user's own comment
  level?: number;
}

export function CommentItem({ comment, figureName, onReplySubmittedLocal, onDelete, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // For optimistic updates, consider managing liked/disliked state if not relying solely on router.refresh()
  // For simplicity, we'll use router.refresh() after action.
  // const [localLikes, setLocalLikes] = useState(comment.likesCount);
  // const [localDislikes, setLocalDislikes] = useState(comment.dislikesCount);
  // const [userHasLiked, setUserHasLiked] = useState(false); // This would need to be fetched/stored
  // const [userHasDisliked, setUserHasDisliked] = useState(false); // This would need to be fetched/stored

  const isAdmin = mockUser?.id === 'user123';
  const isOwnComment = mockUser?.id === comment.userId;


  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!mockUser) {
      toast({ title: "Login Required", description: "Please log in to react.", variant: "destructive"});
      return;
    }
    setIsReacting(true);
    // In a real app, you'd track if the user has already liked/disliked this specific comment
    // For this example, we assume it's a new reaction or toggling.
    // The action `updateCommentReaction` ideally handles the logic of incrementing/decrementing
    // and potentially removing an opposite reaction.
    // We pass placeholder booleans for currentLiked/Disliked for now.
    // A full implementation would involve fetching the user's reaction to this comment.
    const result = await updateCommentReaction(comment.id, reactionType, false, false); // Placeholder for actual liked/disliked state
    setIsReacting(false);

    if (result.success) {
      toast({ title: "Reaction updated!" });
      router.refresh(); // Refresh to get updated counts
    } else {
      toast({ title: "Reaction failed", description: result.message, variant: "destructive" });
    }
  };
  
  const timeAgo = comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true }) : 'Just now';

  return (
    <div className={`flex space-x-3 py-4 ${level > 0 ? 'pl-6 border-l ml-4' : ''} border-b last:border-b-0`}>
      <Avatar className="flex-shrink-0">
        <AvatarImage src={comment.userAvatarUrl || undefined} alt={comment.userName} />
        <AvatarFallback>{comment.userName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{comment.userName}</span>
            {comment.userStarRatingForFigure && comment.userStarRatingForFigure > 0 && (
              <StarRating rating={comment.userStarRatingForFigure} readOnly size={14} />
            )}
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          {(isAdmin || isOwnComment) && onDelete && ( // Allow admin or owner to delete
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(comment.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete comment</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.commentText}</p>
        <div className="flex items-center space-x-3 mt-2 text-xs">
          <Button variant="ghost" size="sm" onClick={() => handleReaction('like')} className={`p-1 h-auto text-muted-foreground`} disabled={isReacting}>
            {isReacting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-1" />} {comment.likesCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleReaction('dislike')} className={`p-1 h-auto text-muted-foreground`} disabled={isReacting}>
             {isReacting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ThumbsDown className="h-4 w-4 mr-1" />} {comment.dislikesCount}
          </Button>
          {level < 2 && ( // Limit reply depth
             <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="p-1 h-auto text-muted-foreground">
              <MessageSquareReply className="h-4 w-4 mr-1" /> Reply
            </Button>
          )}
        </div>
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              figureId={comment.figureId}
              figureName={figureName}
              parentId={comment.id}
              onCommentSubmitted={() => {
                // if (onReplySubmittedLocal) onReplySubmittedLocal("", comment.id); // For optimistic UI
                setShowReplyForm(false);
                // router.refresh() will be called by the form itself
              }}
              placeholder={`Replying to ${comment.userName}...`}
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
                figureName={figureName}
                onReplySubmittedLocal={onReplySubmittedLocal}
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
