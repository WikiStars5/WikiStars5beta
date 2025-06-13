
"use client";

import { useState, useEffect } from 'react';
import type { Comment as CommentType, Figure } from '@/lib/types';
import { getCommentsForFigure, getUserRatingForFigure } from '@/lib/placeholder-data'; // Using placeholder data
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUser } from '@/lib/types';

interface CommentSectionProps {
  figure: Figure;
}

export function CommentSection({ figure }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setComments(getCommentsForFigure(figure.id));
  }, [figure.id]);

  const handleCommentSubmitted = (commentText: string, parentId?: string | null) => {
    if (!mockUser) return; // Should be handled by CommentForm, but double check

    const newComment: CommentType = {
      id: `comment-${Date.now()}`,
      figureId: figure.id,
      userId: mockUser.id,
      userDisplayName: mockUser.displayName || "Anonymous",
      userAvatarUrl: mockUser.avatarUrl || 'https://placehold.co/40x40.png?text=A',
      userStarRating: getUserRatingForFigure(mockUser.id, figure.id)?.stars || undefined, 
      text: commentText,
      parentId: parentId || null,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      timestamp: new Date().toISOString(),
      replies: [],
    };
    
    // Optimistically update UI, in real app, send to server and update based on response
    // This is a simplified update, real implementation would need to handle replies correctly in the state
    if (parentId) {
        setComments(prevComments => 
            prevComments.map(c => {
                if (c.id === parentId) {
                    return { ...c, replies: [...(c.replies || []), newComment] };
                }
                // Also handle nested replies if supporting deeper levels
                if (c.replies) {
                    const updateNestedReplies = (replies: CommentType[]): CommentType[] => {
                        return replies.map(r => {
                            if (r.id === parentId) {
                                return { ...r, replies: [...(r.replies || []), newComment] };
                            }
                            if (r.replies) {
                                return { ...r, replies: updateNestedReplies(r.replies)};
                            }
                            return r;
                        });
                    };
                    return { ...c, replies: updateNestedReplies(c.replies)};
                }
                return c;
            })
        );
    } else {
        setComments(prevComments => [newComment, ...prevComments]);
    }
    // In a real app, this would be a backend call:
    // COMMENTS_DATA.push(newComment); // This mutates placeholder, not good for real apps
    // setComments(getCommentsForFigure(figure.id)); // Re-fetch or update state more carefully
  };

  const handleLike = (commentId: string) => console.log(`Liked comment ${commentId}`);
  const handleDislike = (commentId: string) => console.log(`Disliked comment ${commentId}`);
  const handleDelete = (commentId: string) => {
    console.log(`Admin deleted comment ${commentId}`);
    setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: c.replies?.filter(r => r.id !== commentId)
    })));
    // Add toast
  };
  
  if (!isClient) return <Card><CardContent className="p-6"><div className="h-64 animate-pulse bg-muted rounded-md"></div></CardContent></Card>;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Discussion</CardTitle>
        <CardDescription>Share your thoughts on {figure.name}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CommentForm figureId={figure.id} onCommentSubmitted={handleCommentSubmitted} />
        
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReplySubmitted={handleCommentSubmitted}
                onLike={handleLike}
                onDislike={handleDislike}
                onDelete={mockUser?.id === 'user123' ? handleDelete : undefined} // Only pass delete if admin
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
