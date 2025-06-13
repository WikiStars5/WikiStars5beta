"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { moderateComment } from "@/lib/actions/commentActions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CommentModerationListProps {
  initialComments: Comment[];
}

export function CommentModerationList({ initialComments }: CommentModerationListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({}); // Track loading state per comment
  const { toast } = useToast();
  const router = useRouter();

  const handleModerate = async (commentId: string, newStatus: 'approved' | 'rejected') => {
    setIsLoading(prev => ({ ...prev, [commentId]: true }));
    const result = await moderateComment(commentId, newStatus);
    setIsLoading(prev => ({ ...prev, [commentId]: false }));

    if (result.success) {
      toast({ title: "Comment Moderated", description: `Comment ${newStatus}.` });
      // Optimistically update UI or rely on router.refresh()
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, status: newStatus } : c));
      // router.refresh(); // Or refresh if optimistic update is not preferred for simplicity
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="p-4 border rounded-lg shadow-sm bg-card">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm text-muted-foreground">
                By: <span className="font-medium text-foreground">{comment.userName || 'Anonymous'}</span> on figure: 
                <Link href={`/figures/${comment.figureId}`} target="_blank" className="text-primary hover:underline ml-1">
                  {comment.figureName || comment.figureId} <ExternalLink className="inline h-3 w-3" />
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                {comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true }) : 'N/A'}
              </p>
            </div>
            <Badge variant={
              comment.status === 'approved' ? 'default' :
              comment.status === 'rejected' ? 'destructive' :
              'secondary'
            } className="capitalize">
              {comment.status}
            </Badge>
          </div>
          <p className="mb-3 text-foreground/90 whitespace-pre-line">{comment.commentText}</p>
          
          {comment.status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={() => handleModerate(comment.id, 'approved')}
                disabled={isLoading[comment.id]}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleModerate(comment.id, 'rejected')}
                disabled={isLoading[comment.id]}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          )}
          {comment.status === 'approved' && (
             <Button 
                size="sm" 
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleModerate(comment.id, 'rejected')}
                disabled={isLoading[comment.id]}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject (Undo Approve)
              </Button>
          )}
          {comment.status === 'rejected' && (
             <Button 
                size="sm" 
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={() => handleModerate(comment.id, 'approved')}
                disabled={isLoading[comment.id]}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve (Undo Reject)
              </Button>
          )}
        </div>
      ))}
    </div>
  );
}
