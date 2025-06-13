
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { addComment } from '@/lib/actions/commentActions';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { StarRating } from '@/components/shared/StarRating'; // Importar StarRating

interface CommentFormProps {
  figureId: string;
  figureName: string;
  parentId?: string | null; // Si está presente, es una respuesta
  onCommentSubmitted?: () => void;
  placeholder?: string;
  submitButtonText?: string;
}

export function CommentForm({
  figureId,
  figureName,
  parentId = null, // null por defecto para comentarios de nivel superior
  onCommentSubmitted,
  placeholder = "Write your comment...",
  submitButtonText = "Post Comment"
}: CommentFormProps) {
  const [commentText, setCommentText] = useState("");
  const [selectedStars, setSelectedStars] = useState(0); // Para estrellas opcionales
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const isReply = parentId !== null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast({ title: "Empty Comment", description: "Please write something before submitting.", variant: "destructive"});
      return;
    }
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to comment.", variant: "destructive"});
      return;
    }

    setIsLoading(true);
    // Solo enviar estrellas si no es una respuesta y se han seleccionado estrellas
    const starsToSubmit = !isReply && selectedStars > 0 ? selectedStars : undefined;

    const result = await addComment(
      figureId,
      figureName,
      currentUser.uid,
      currentUser.displayName || "Anonymous User",
      currentUser.photoURL,
      commentText,
      parentId,
      starsToSubmit 
    );
    setIsLoading(false);

    if (result.success) {
      toast({ title: "Comment Submitted!", description: result.message });
      setCommentText("");
      setSelectedStars(0); // Resetear estrellas
      if (onCommentSubmitted) onCommentSubmitted();
      router.refresh(); 
    } else {
      toast({ title: "Comment Failed", description: result.message || "Could not post your comment.", variant: "destructive"});
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50 text-center">
        <p className="text-muted-foreground">Please <Link href={`/login?redirect=/figures/${figureId}`} className="text-primary hover:underline">log in</Link> to post a comment.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-3 p-1">
      <Avatar className="mt-1 flex-shrink-0">
        <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
        <AvatarFallback>{currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-grow space-y-3">
        {/* Calificación por estrellas opcional - SOLO para comentarios nuevos, de nivel superior */}
        {!isReply && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Rate (optional with comment):</span>
            <StarRating rating={selectedStars} onRatingChange={setSelectedStars} size={22} readOnly={isLoading} />
          </div>
        )}
        
        <Textarea
          placeholder={placeholder}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={isReply ? 2 : 3} // Menos filas para respuestas
          className="w-full text-sm"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !commentText.trim()} size={isReply ? "sm" : "default"}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isLoading ? "Posting..." : submitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
