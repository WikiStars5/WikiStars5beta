
"use client";

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCommentThread } from '@/hooks/use-comment-thread';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFigureFromFirestore, mapDocToComment } from '@/lib/placeholder-data';
import type { Comment, Figure } from '@/lib/types';
import { CommentItem } from './CommentItem';
import { Loader2, MessageSquare } from 'lucide-react';

export function CommentThreadDialog() {
  const { commentThreadState, closeCommentThread } = useCommentThread();
  const { isOpen, commentPath, highlightedReplyId } = commentThreadState;

  const [parentComment, setParentComment] = useState<Comment | null>(null);
  const [figure, setFigure] = useState<Figure | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !commentPath) {
      setParentComment(null);
      setFigure(null);
      return;
    }

    setIsLoading(true);
    let figureId: string | null = null;
    try {
        const pathSegments = commentPath.split('/');
        if (pathSegments.length >= 2) {
            figureId = pathSegments[1];
        }

        if (figureId) {
            getFigureFromFirestore(figureId).then(fig => {
                if (fig) setFigure(fig);
            });
        }
    } catch(e) {
        console.error("Error parsing figureId from path:", e);
    }


    const unsubscribe = onSnapshot(doc(db, commentPath), (docSnap) => {
      if (docSnap.exists()) {
        setParentComment(mapDocToComment(docSnap));
      } else {
        setParentComment(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching comment thread:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, commentPath]);

  const latestCommentId = parentComment ? parentComment.id : null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeCommentThread(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5"/>
            Hilo de Conversación
          </DialogTitle>
           {figure && (
            <DialogDescription>
                Respuesta a un comentario en el perfil de {figure.name}.
            </DialogDescription>
           )}
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4">
            {isLoading && (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {!isLoading && parentComment && figure && commentPath && (
                <CommentItem 
                    key={parentComment.id}
                    figure={figure}
                    comment={parentComment}
                    parentPath={commentPath.substring(0, commentPath.lastIndexOf('/'))}
                    highlightedCommentId={highlightedReplyId}
                    isLastCommentFromAuthor={latestCommentId === parentComment.id}
                    startWithRepliesOpen={true}
                />
            )}
             {!isLoading && !parentComment && (
                <p className="text-center text-muted-foreground py-8">No se pudo cargar el comentario.</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
