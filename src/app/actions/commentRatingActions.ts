
'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, arrayUnion, arrayRemove, increment, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function updateCommentLikes(
  commentId: string,
  figureId: string,
  figureName: string, // <-- Added for notification context
  userId: string, // This is the actor's ID
  actorName: string, // <-- Added for notification context
  actorPhotoUrl: string | null, // <-- Added for notification context
  action: 'like' | 'dislike'
): Promise<{ success: boolean; message: string; newLikes?: number; newDislikes?: number; }> {
  if (!commentId || !userId || !action || !figureId || !figureName) {
    return { success: false, message: 'Información incompleta para actualizar el voto.' };
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
      const commentAuthorId = data.userId;
      const isCommentAuthorGuest = !!data.guestUsername;
      
      const likedBy: string[] = data.likedBy || [];
      const dislikedBy: string[] = data.dislikedBy || [];

      const hasLiked = likedBy.includes(userId);
      const hasDisliked = dislikedBy.includes(userId);
      
      let updateData: any = {};

      if (action === 'like') {
        if (hasLiked) {
          // User is un-liking, no notification needed.
          updateData.likedBy = arrayRemove(userId);
          updateData.likes = increment(-1);
        } else {
          // User is liking
          updateData.likedBy = arrayUnion(userId);
          updateData.likes = increment(1);
          if (hasDisliked) {
            updateData.dislikedBy = arrayRemove(userId);
            updateData.dislikes = increment(-1);
          }
          
          // Create a notification if the user is not liking their own comment and the author is not a guest
          if (userId !== commentAuthorId && !isCommentAuthorGuest) {
            const notificationRef = doc(collection(db, 'notifications'));
            transaction.set(notificationRef, {
              userId: commentAuthorId, // The user to notify
              actorId: userId,
              actorName: actorName,
              actorPhotoUrl: actorPhotoUrl,
              type: 'like',
              isRead: false,
              figureId: figureId,
              figureName: figureName,
              commentId: commentId,
              createdAt: serverTimestamp()
            });
          }
        }
      } else if (action === 'dislike') {
        // No notifications for dislikes to maintain a positive environment
        if (hasDisliked) {
          updateData.dislikedBy = arrayRemove(userId);
          updateData.dislikes = increment(-1);
        } else {
          updateData.dislikedBy = arrayUnion(userId);
          updateData.dislikes = increment(1);
          if (hasLiked) {
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
    
    revalidatePath(`/figures/${figureId}`);

    return { success: true, message: 'Voto actualizado.', newLikes, newDislikes };
  } catch (error: any) {
    console.error('Error updating comment likes:', error);
    return { success: false, message: `Error al actualizar: ${error.message}` };
  }
}
