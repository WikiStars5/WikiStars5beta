
'use server';

import { db } from '@/lib/firebase';
import type { Comment, Figure } from '@/lib/types';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, increment, runTransaction, setDoc } from 'firebase/firestore';

// Añadir un nuevo comentario a Firestore. Ahora el status es 'approved' por defecto.
// StarRating es opcional y solo para comentarios de nivel superior.
export async function addComment(
  figureId: string,
  figureName: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | undefined,
  commentText: string,
  parentCommentId: string | null, // null si es un comentario de nivel superior
  starRatingGivenByAuthor?: number // Opcional (1-5), solo para comentarios de nivel superior
): Promise<{ success: boolean; commentId?: string; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId || !commentText.trim()) {
    return { success: false, message: 'Figure ID and comment text are required.' };
  }
  
  let actualStarRating: number | undefined = undefined;
  if (parentCommentId === null && starRatingGivenByAuthor !== undefined && starRatingGivenByAuthor >= 1 && starRatingGivenByAuthor <= 5) {
    actualStarRating = starRatingGivenByAuthor;
  } else if (parentCommentId !== null && starRatingGivenByAuthor !== undefined) {
    // Las respuestas no deben tener calificación por estrellas
    // Aunque la UI no debería permitirlo, es una salvaguarda.
    console.warn("Attempted to submit star rating with a reply. Stars ignored.");
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
      status: 'approved', // Los comentarios ahora se aprueban directamente
      timestamp: serverTimestamp(),
      starRatingGivenByAuthor: actualStarRating,
    };

    const newCommentRef = doc(collection(db, 'comments'));

    // Si se proporcionan estrellas válidas para un comentario de nivel superior, actualizar los agregados de la figura
    if (parentCommentId === null && actualStarRating !== undefined) {
      const figureRef = doc(db, 'figures', figureId);
      await runTransaction(db, async (transaction) => {
        const figureDoc = await transaction.get(figureRef);
        if (!figureDoc.exists()) {
          throw new Error(`Figure with ID ${figureId} not found. Cannot add comment with rating.`);
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
      // Si no hay estrellas, o es una respuesta, solo añadir el comentario
      await setDoc(newCommentRef, commentData);
    }
    
    return { success: true, commentId: newCommentRef.id, message: 'Comment published successfully.' };

  } catch (error)
 {
    console.error('Error adding comment to Firestore:', error);
    let message = 'Failed to add comment.';
     if ((error as any).code === 'permission-denied' || (error as any).message?.toLowerCase().includes('permission')) {
        message = 'Failed to add comment due to insufficient permissions.';
    } else if ((error as any).message?.toLowerCase().includes('not found')) {
        message = `Failed to add comment: The figure could not be found.`;
    }
    return { success: false, message: message };
  }
}

// Obtener comentarios aprobados para una figura.
export async function getFigureCommentsWithRatings(figureId: string): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      where('figureId', '==', figureId),
      where('status', '==', 'approved'), // Solo obtener comentarios aprobados
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

// Actualizar reacción de like/dislike para un comentario
export async function updateCommentReaction(
  commentId: string,
  reactionType: 'like' | 'dislike',
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is missing.' };
  }
  
  const commentRef = doc(db, 'comments', commentId);

  try {
    const fieldToIncrement = reactionType === 'like' ? 'likesCount' : 'dislikesCount';
    await updateDoc(commentRef, {
      [fieldToIncrement]: increment(1)
    });
    return { success: true, message: 'Reaction updated.' };
  } catch (error) {
    console.error('Error updating comment reaction:', error);
    return { success: false, message: 'Failed to update reaction.' };
  }
}

// Obtener todos los comentarios para moderación (admin). Ahora todos estarán 'approved' por defecto.
export async function getAllCommentsForModeration(): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('timestamp', 'desc') 
    );
    const querySnapshot = await getDocs(commentsQuery);
    const comments: Comment[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      comments.push({ 
        id: docSnap.id,
         ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString(),
      } as Comment);
    });
    return comments;
  } catch (error) {
    console.error('Error fetching all comments for moderation:', error);
    return [];
  }
}

// Moderar un comentario (aprobar o rechazar). Menos relevante si el default es 'approved'.
// Podría usarse si un admin quiere rechazar un comentario después de que se aprobó automáticamente.
export async function moderateComment(
  commentId: string,
  newStatus: 'approved' | 'rejected'
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is missing.' };
  }
  const commentRef = doc(db, 'comments', commentId);
  try {
    // IMPORTANTE: Si se rechaza un comentario que TENÍA estrellas, se necesitaría
    // revertir su impacto en averageRating/totalRatings de la figura.
    // Esto es complejo y no se implementa aquí por brevedad, pero es una consideración.
    await updateDoc(commentRef, { status: newStatus });
    return { success: true, message: `Comment status updated to ${newStatus}.` };
  } catch (error) {
    console.error('Error moderating comment:', error);
    return { success: false, message: 'Failed to moderate comment.' };
  }
}

// Esta función es menos relevante si los comentarios siempre son 'approved'.
// Podría contar comentarios que estén explícitamente marcados como 'pending' por un admin.
export async function getPendingCommentsCount(): Promise<number> {
  try {
    const q = query(collection(db, 'comments'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching pending comments count:', error);
    return 0;
  }
}
