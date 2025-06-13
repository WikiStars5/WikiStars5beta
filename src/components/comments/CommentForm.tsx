
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
import { StarRating } from '@/components/shared/StarRating'; 

interface CommentFormProps {
  figureId: string;
  figureName: string;
  parentId?: string | null; 
  onCommentSubmitted?: () => void;
  placeholder?: string;
  submitButtonText?: string;
}

export function CommentForm({
  figureId,
  figureName,
  parentId = null, 
  onCommentSubmitted,
  placeholder, 
  submitButtonText 
}: CommentFormProps) {
  const [commentText, setCommentText] = useState("");
  const [selectedStars, setSelectedStars] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const isReply = parentId !== null;
  const actualPlaceholder = placeholder || (isReply ? `Respondiendo a...` : "Escribe tu comentario...");
  const actualSubmitButtonText = submitButtonText || (isReply ? "Publicar Respuesta" : "Publicar Comentario");


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
      toast({ title: "Comentario Vacío", description: "Por favor, escribe algo antes de enviar.", variant: "destructive"});
      return;
    }
    if (!currentUser) {
      toast({ title: "Inicio de Sesión Requerido", description: "Por favor, inicia sesión para comentar.", variant: "destructive"});
      return;
    }

    setIsLoading(true);
    const starsToSubmit = !isReply && selectedStars > 0 ? selectedStars : undefined;

    const result = await addComment(
      figureId,
      figureName,
      currentUser.uid,
      currentUser.displayName || "Usuario Anónimo",
      currentUser.photoURL,
      commentText,
      parentId,
      starsToSubmit 
    );
    setIsLoading(false);

    if (result.success) {
      toast({ title: "¡Comentario Enviado!", description: result.message });
      setCommentText("");
      setSelectedStars(0); 
      if (onCommentSubmitted) onCommentSubmitted();
      router.refresh(); 
    } else {
      toast({ title: "Error al Comentar", description: result.message || "No se pudo publicar tu comentario.", variant: "destructive"});
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
        <p className="text-muted-foreground">Por favor <Link href={`/login?redirect=/figures/${figureId}`} className="text-primary hover:underline">inicia sesión</Link> para publicar un comentario.</p>
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
        {!isReply && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Califica (opcional con comentario):</span>
            <StarRating rating={selectedStars} onRatingChange={setSelectedStars} size={22} readOnly={isLoading} />
          </div>
        )}
        
        <Textarea
          placeholder={actualPlaceholder}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={isReply ? 2 : 3} 
          className="w-full text-sm"
          disabled={isLoading}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !commentText.trim()} size={isReply ? "sm" : "default"}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isLoading ? "Publicando..." : actualSubmitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
