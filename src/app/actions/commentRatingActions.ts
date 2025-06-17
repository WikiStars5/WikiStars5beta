
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
  console.log("[submitCommentAndRatingAction] Received input:", input);
  const validationResult = submitCommentSchema.safeParse(input);

  if (!validationResult.success) {
    console.error("[submitCommentAndRatingAction] Validation failed:", validationResult.error.errors);
    return { success: false, message: "Datos inválidos.", errors: validationResult.error.errors };
  }

  const { figureId, rating, text, userId, username, userPhotoUrl } = validationResult.data;
  console.log("[submitCommentAndRatingAction] Validated data:", { figureId, rating, text, userId, username, userPhotoUrl });

  try {
    const figureDocRef = doc(db, 'figures', figureId);
    const commentsCollectionRef = collection(db, 'figure_comments');
    console.log("[submitCommentAndRatingAction] References created. FigureDocRef:", figureDocRef.path, "CommentsCollectionRef:", commentsCollectionRef.path);

    // Firestore transaction to update figure ratings and add comment atomically
    const newCommentId = await runTransaction(db, async (transaction) => {
      console.log("[submitCommentAndRatingAction] Starting transaction...");
      const figureDoc = await transaction.get(figureDocRef);
      if (!figureDoc.exists()) {
        console.error("[submitCommentAndRatingAction] Figure document not found:", figureId);
        throw new Error("La figura no existe.");
      }
      console.log("[submitCommentAndRatingAction] Figure document fetched within transaction. Exists:", figureDoc.exists());

      const figureData = figureDoc.data() as Figure;
      console.log("[submitCommentAndRatingAction] Current figure data:", figureData);

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
      
      const figureUpdatePayload = {
        totalRatings: newTotalRatings,
        averageRating: newAverageRating,
        ratingDistribution: newRatingDistribution,
      };
      console.log("[submitCommentAndRatingAction] Figure update payload for transaction:", figureUpdatePayload);
      transaction.update(figureDocRef, figureUpdatePayload);
      console.log("[submitCommentAndRatingAction] Figure document update added to transaction.");

      // Add new comment document
      const newCommentData: Omit<CommentData, 'id'> = {
        figureId,
        userId,
        username,
        userPhotoUrl,
        rating,
        text,
        createdAt: Timestamp.now(), 
        likes: 0,
        dislikes: 0,
      };
      const newCommentRef = doc(commentsCollectionRef); 
      console.log("[submitCommentAndRatingAction] New comment data for transaction:", newCommentData, "at path:", newCommentRef.path);
      transaction.set(newCommentRef, newCommentData);
      console.log("[submitCommentAndRatingAction] New comment set added to transaction.");
      
      return newCommentRef.id;
    });
    
    console.log("[submitCommentAndRatingAction] Transaction successful. New comment ID:", newCommentId);
    revalidatePath(`/figures/${figureId}`);
    return { success: true, message: "Comentario y calificación guardados.", commentId: newCommentId };

  } catch (error: any) {
    console.error("================================================================");
    console.error("[submitCommentAndRatingAction] ERROR during action execution:", error.message);
    if (error.code) {
      console.error("[submitCommentAndRatingAction] Firebase Error Code:", error.code);
    }
    if (error.details) {
        console.error("[submitCommentAndRatingAction] Firebase Error Details:", error.details);
    }
    console.error("[submitCommentAndRatingAction] Full Firebase Error Object:", JSON.stringify(error, null, 2));
    console.error("================================================================");
    
    let userMessage = "No se pudo guardar el comentario y la calificación.";
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
        userMessage = "Error de permisos de Firestore. Por favor, verifica las reglas de seguridad.";
    } else if (error.message) {
        userMessage = `Error: ${error.message}`;
    }
    
    return { success: false, message: userMessage };
  }
}
