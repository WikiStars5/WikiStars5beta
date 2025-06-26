'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function updateCommentLikes(
  commentId: string,
  figureId: string,
  userId: string,
  action: 'like' | 'dislike'
): Promise<{ success: boolean; message: string; newLikes?: number; newDislikes?: number; }> {
  if (!commentId || !userId || !action || !figureId) {
    return { success: false, message: 'Información incompleta.' };
  }

  const commentRef = doc(db, 'userComments', commentId);

  try {
    let newLikes: number | undefined;
    let newDislikes: number | undefined;

    await runTransaction(db, async (transaction) => {
      const commentDoc = await transaction.get(commentRef);
      if (!commentDoc.exists()) {
        throw new Error('El comentario no existe.');
      }

      const data = commentDoc.data();
      const likedBy: string[] = data.likedBy || [];
      const dislikedBy: string[] = data.dislikedBy || [];

      const hasLiked = likedBy.includes(userId);
      const hasDisliked = dislikedBy.includes(userId);
      
      let updateData: any = {};

      if (action === 'like') {
        if (hasLiked) {
          // User is un-liking
          updateData.likedBy = arrayRemove(userId);
          updateData.likes = increment(-1);
        } else {
          // User is liking
          updateData.likedBy = arrayUnion(userId);
          updateData.likes = increment(1);
          if (hasDisliked) {
            // also remove from dislikes
            updateData.dislikedBy = arrayRemove(userId);
            updateData.dislikes = increment(-1);
          }
        }
      } else if (action === 'dislike') {
        if (hasDisliked) {
          // User is un-disliking
          updateData.dislikedBy = arrayRemove(userId);
          updateData.dislikes = increment(-1);
        } else {
          // User is disliking
          updateData.dislikedBy = arrayUnion(userId);
          updateData.dislikes = increment(1);
          if (hasLiked) {
            // also remove from likes
            updateData.likedBy = arrayRemove(userId);
            updateData.likes = increment(-1);
          }
        }
      }
      transaction.update(commentRef, updateData);
    });

    const finalCommentDoc = await getDoc(commentRef);
    if(finalCommentDoc.exists()) {
        newLikes = finalCommentDoc.data().likes;
        newDislikes = finalCommentDoc.data().dislikes;
    }
    
    // Path revalidation for a non-i18n setup
    revalidatePath(`/figures/${figureId}`);

    return { success: true, message: 'Voto actualizado.', newLikes, newDislikes };
  } catch (error: any) {
    console.error('Error updating comment likes:', error);
    return { success: false, message: `Error al actualizar: ${error.message}` };
  }
}
