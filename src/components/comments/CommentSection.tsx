"use client";

import { useState, useEffect } from 'react';
import type { Comment as CommentType, Figure } from '@/lib/types';
import { getFigureCommentsWithRatings } from '@/lib/actions/commentActions'; // Updated action
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface CommentSectionProps {
  figure: Figure;
}

export function CommentSection({ figure }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  useEffect(() => {
    async function fetchComments() {
      setIsLoadingComments(true);
      const fetchedComments = await getFigureCommentsWithRatings(figure.id);
      setComments(fetchedComments);
      setIsLoadingComments(false);
    }
    fetchComments();
  }, [figure.id]); // Re-fetch if figure.id changes (e.g. navigation) or after router.refresh()

  // Handler for deleting comments (passed down to CommentItem)
  // This would typically call a server action. For now, it's a placeholder.
  const handleDeleteComment = async (commentId: string) => {
    // const result = await deleteCommentAction(commentId);
    // if (result.success) {
    //   setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
    //     ...c,
    //     replies: c.replies?.filter(r => r.id !== commentId)
    //   })));
    //   toast({ title: "Comment Deleted" });
    // } else {
    //   toast({ title: "Error", description: "Could not delete comment.", variant: "destructive"});
    // }
    console.log(`Placeholder: Delete comment ${commentId}`);
    // Potentially call router.refresh() here after actual deletion
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Discussion</CardTitle>
        <CardDescription>Share your thoughts on {figure.name}. Comments are moderated.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CommentForm 
          figureId={figure.id} 
          figureName={figure.name} 
        />
        
        <div className="space-y-4">
          {isLoadingComments ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-2 text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment}
                figureName={figure.name}
                // onDelete={handleDeleteComment} // Enable if delete action is implemented
                level={0}
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
