
'use server';

import { db } from '@/lib/firebase';
import type { Comment, Figure } from '@/lib/types';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, increment, runTransaction, setDoc } from 'firebase/firestore';

export async function addComment(
  figureId: string,
  figureName: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | undefined,
  commentText: string,
  parentCommentId: string | null, 
  starRatingGivenByAuthor?: number 
): Promise<{ success: boolean; commentId?: string; message: string }> {
  if (!userId) {
    return { success: false, message: 'Usuario no autenticado.' };
  }
  if (!figureId || !commentText.trim()) {
    return { success: false, message: 'Se requiere el ID de la figura y el texto del comentario.' };
  }
  
  let actualStarRating: number | undefined = undefined;
  if (parentCommentId === null && starRatingGivenByAuthor !== undefined && starRatingGivenByAuthor >= 1 && starRatingGivenByAuthor <= 5) {
    actualStarRating = starRatingGivenByAuthor;
  } else if (parentCommentId !== null && starRatingGivenByAuthor !== undefined) {
    console.warn("Se intentó enviar una calificación por estrellas con una respuesta. Estrellas ignoradas.");
  }

  try {
    const commentData: Omit<Comment, 'id' | 'replies' | 'timestamp'> & { timestamp: any } = {
      figureId,
      figureName,
      userId,
      userName,
      userAvatarUrl: userAvatarUrl || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`,
      commentText: commentText.trim(),
      parentCommentId,
      likesCount: 0,
      dislikesCount: 0,
      status: 'approved', 
      timestamp: serverTimestamp(),
      starRatingGivenByAuthor: actualStarRating,
    };

    const newCommentRef = doc(collection(db, 'comments'));

    if (parentCommentId === null && actualStarRating !== undefined) {
      const figureRef = doc(db, 'figures', figureId);
      await runTransaction(db, async (transaction) => {
        const figureDoc = await transaction.get(figureRef);
        if (!figureDoc.exists()) {
          throw new Error(`Figura con ID ${figureId} no encontrada. No se puede añadir comentario con calificación.`);
        }
        const figureData = figureDoc.data() as Figure;

        const currentTotalRatings = figureData.totalRatings || 0;
        const currentAverageRating = figureData.averageRating || 0;
        
        const newTotalRatings = currentTotalRatings + 1;
        const newSumOfStars = (currentAverageRating * currentTotalRatings) + actualStarRating;
        const newAverageRating = newTotalRatings > 0 ? newSumOfStars / newTotalRatings : 0;

        transaction.update(figureRef, {
          averageRating: newAverageRating,
          totalRatings: newTotalRatings,
        });
        
        transaction.set(newCommentRef, commentData);
      });
    } else {
      await setDoc(newCommentRef, commentData);
    }
    
    return { success: true, commentId: newCommentRef.id, message: 'Comentario publicado exitosamente.' };

  } catch (error)
 {
    console.error('Error adding comment to Firestore:', error);
    let message = 'Error al añadir comentario.';
     if ((error as any).code === 'permission-denied' || (error as any).message?.toLowerCase().includes('permission')) {
        message = 'Error al añadir comentario debido a permisos insuficientes.';
    } else if ((error as any).message?.toLowerCase().includes('not found')) {
        message = `Error al añadir comentario: No se pudo encontrar la figura.`;
    }
    return { success: false, message: message };
  }
}

export async function getFigureCommentsWithRatings(figureId: string): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('figureId', '==', figureId),
      where('status', '==', 'approved'), 
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(commentsQuery);
    
    const commentsData: Comment[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      commentsData.push({ 
        id: docSnap.id, 
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString(),
      } as Comment);
    });

    const topLevelComments = commentsData.filter(comment => !comment.parentCommentId);
    const repliesMap = new Map<string, Comment[]>();
    commentsData.filter(comment => comment.parentCommentId).forEach(reply => {
      const parentList = repliesMap.get(reply.parentCommentId!) || [];
      parentList.push(reply);
      repliesMap.set(reply.parentCommentId!, parentList.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    });

    return topLevelComments.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment.id) || [],
    }));

  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function updateCommentReaction(
  commentId: string,
  reactionType: 'like' | 'dislike',
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Falta el ID del comentario.' };
  }
  
  const commentRef = doc(db, 'comments', commentId);

  try {
    const fieldToIncrement = reactionType === 'like' ? 'likesCount' : 'dislikesCount';
    await updateDoc(commentRef, {
      [fieldToIncrement]: increment(1)
    });
    return { success: true, message: 'Reacción actualizada.' };
  } catch (error) {
    console.error('Error updating comment reaction:', error);
    return { success: false, message: 'Error al actualizar la reacción.' };
  }
}
