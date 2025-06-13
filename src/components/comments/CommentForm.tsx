"use client";

import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface CommentFormProps {
  figureId: string;
  parentId?: string | null; // For replies
  onCommentSubmitted: (commentText: string, parentId?: string | null) => void;
  placeholder?: string;
  submitButtonText?: string;
}

export function CommentForm({
  figureId,
  parentId = null,
  onCommentSubmitted,
  placeholder = "Write your comment...",
  submitButtonText = "Post Comment"
}: CommentFormProps) {
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast({ title: "Empty Comment", description: "Please write something before submitting.", variant: "destructive"});
      return;
    }
    if (!mockUser) {
      toast({ title: "Login Required", description: "Please log in to comment.", variant: "destructive"});
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    
    onCommentSubmitted(commentText, parentId);
    setCommentText(""); // Clear textarea after submission
    setIsLoading(false);
    toast({ title: "Comment Posted!", description: "Your wisdom has been shared with the world."});
  };

  if (!mockUser) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50 text-center">
        <p className="text-muted-foreground">Please <a href="/login" className="text-primary hover:underline">log in</a> to post a comment.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-3 p-1">
      <Avatar className="mt-1 flex-shrink-0">
        <AvatarImage src={mockUser.avatarUrl || undefined} alt={mockUser.displayName || "User"} />
        <AvatarFallback>{mockUser.displayName ? mockUser.displayName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-grow space-y-2">
        <Textarea
          placeholder={placeholder}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={parentId ? 2 : 3}
          className="w-full text-sm"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !commentText.trim()} size={parentId ? "sm" : "default"}>
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? "Posting..." : submitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
