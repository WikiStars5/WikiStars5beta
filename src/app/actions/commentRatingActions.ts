
"use server";

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Figure, CommentData } from '@/lib/types';
import * as z from 'zod';

const submitCommentSchema = z.object({
  figureId: z.string().min(1),
  rating: z.number().min(1).max(5),
  text: z.string().min(10).max(1000),
  userId: z.string().min(1),
  username: z.string().min(1),
  userPhotoUrl: z.string().url().nullable(),
});

interface SubmitCommentInput {
  figureId: string;
  rating: number;
  text: string;
  userId: string;
  username: string;
  userPhotoUrl: string | null;
}

interface SubmitCommentResult {
  success: boolean;
  message?: string;
  commentId?: string;
  errors?: z.ZodIssue[];
}

export async function submitCommentAndRatingAction(input: SubmitCommentInput): Promise<SubmitCommentResult> {
  const validationResult = submitCommentSchema.safeParse(input);

  if (!validationResult.success) {
    return { success: false, message: "Datos inválidos.", errors: validationResult.error.errors };
  }

  const { figureId, rating, text, userId, username, userPhotoUrl } = validationResult.data;

  try {
    const figureDocRef = doc(db, 'figures', figureId);
    const commentsCollectionRef = collection(db, 'figure_comments');

    // Firestore transaction to update figure ratings and add comment atomically
    const newCommentId = await runTransaction(db, async (transaction) => {
      const figureDoc = await transaction.get(figureDocRef);
      if (!figureDoc.exists()) {
        throw new Error("La figura no existe.");
      }

      const figureData = figureDoc.data() as Figure;

      // Calculate new rating aggregates
      const currentTotalRatings = figureData.totalRatings || 0;
      const currentRatingDistribution = figureData.ratingDistribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      
      const newTotalRatings = currentTotalRatings + 1;
      const newRatingDistribution = {
        ...currentRatingDistribution,
        [rating.toString()]: (currentRatingDistribution[rating.toString() as keyof typeof currentRatingDistribution] || 0) + 1,
      };

      let sumOfAllRatings = 0;
      for (let i = 1; i <= 5; i++) {
        sumOfAllRatings += i * (newRatingDistribution[i.toString() as keyof typeof newRatingDistribution] || 0);
      }
      const newAverageRating = newTotalRatings > 0 ? sumOfAllRatings / newTotalRatings : 0;

      // Update figure document with new rating aggregates
      transaction.update(figureDocRef, {
        totalRatings: newTotalRatings,
        averageRating: newAverageRating,
        ratingDistribution: newRatingDistribution,
      });

      // Add new comment document
      const newCommentData: Omit<CommentData, 'id'> = {
        figureId,
        userId,
        username,
        userPhotoUrl,
        rating,
        text,
        createdAt: Timestamp.now(), // Use Firestore Timestamp for server-side timestamp
        likes: 0,
        dislikes: 0,
      };
      const newCommentRef = doc(commentsCollectionRef); // Auto-generate ID
      transaction.set(newCommentRef, newCommentData);
      
      return newCommentRef.id;
    });

    revalidatePath(`/figures/${figureId}`);
    return { success: true, message: "Comentario y calificación guardados.", commentId: newCommentId };

  } catch (error: any) {
    console.error("Error submitting comment and rating:", error);
    return { success: false, message: error.message || "No se pudo guardar el comentario." };
  }
}

// Placeholder for future like/dislike actions
// export async function likeCommentAction(commentId: string, userId: string) { ... }
// export async function dislikeCommentAction(commentId: string, userId: string) { ... }

