
'use server';

import { db } from '@/lib/firebase';
import type { Comment, Figure } from '@/lib/types';
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, increment, runTransaction, setDoc } from 'firebase/firestore';

// Add a new comment to Firestore
export async function addComment(
  figureId: string,
  figureName: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | undefined,
  commentText: string,
  parentCommentId: string | null,
  starRatingGivenByAuthor?: number // Optional star rating (1-5), only for new top-level comments
): Promise<{ success: boolean; commentId?: string; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId || !commentText.trim()) {
    return { success: false, message: 'Figure ID and comment text are required.' };
  }
  
  // Validate star rating only if provided and it's a top-level comment
  if (parentCommentId === null && starRatingGivenByAuthor !== undefined) {
    if (starRatingGivenByAuthor < 1 || starRatingGivenByAuthor > 5) {
      return { success: false, message: 'Star rating must be between 1 and 5.'};
    }
  }
  // If it's a reply, starRatingGivenByAuthor should be ignored/nulled even if sent by client
  const actualStarRating = parentCommentId === null ? starRatingGivenByAuthor : undefined;

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
      status: 'approved', // Comments are approved by default
      timestamp: serverTimestamp(),
      starRatingGivenByAuthor: actualStarRating, // Save the validated or nulled star rating
    };

    const newCommentRef = doc(collection(db, 'comments')); // Create a new doc ref to get ID

    // If stars are provided for a new, top-level comment, update figure aggregates
    if (parentCommentId === null && actualStarRating !== undefined && actualStarRating >= 1 && actualStarRating <= 5) {
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
      // If no stars, or it's a reply, just add the comment
      await setDoc(newCommentRef, commentData);
    }
    
    return { success: true, commentId: newCommentRef.id, message: 'Comment published successfully.' };

  } catch (error) {
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

// Get approved comments for a figure. Star rating is now directly on the comment.
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

// Update like/dislike count for a comment
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

// Get all comments for moderation (admin) - will show all, including approved/rejected
export async function getAllCommentsForModeration(): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('timestamp', 'desc') // Order by newest first, status can be filtered/sorted client-side if needed
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

// Moderate a comment (approve or reject) - less relevant if default is 'approved'
export async function moderateComment(
  commentId: string,
  newStatus: 'approved' | 'rejected' // Could be expanded to 'pending' if admin wants to hide one
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is missing.' };
  }
  const commentRef = doc(db, 'comments', commentId);
  try {
    // IMPORTANT: If rejecting a comment that HAD stars, you'd need to
    // reverse its impact on the figure's averageRating/totalRatings.
    // This is complex and not implemented here for brevity.
    // For now, this action mainly serves to hide/unhide if 'pending' was used.
    await updateDoc(commentRef, { status: newStatus });
    return { success: true, message: `Comment status updated to ${newStatus}.` };
  } catch (error) {
    console.error('Error moderating comment:', error);
    return { success: false, message: 'Failed to moderate comment.' };
  }
}

// This function might become less relevant if comments are always 'approved'.
// However, it can still count comments that are NOT 'rejected' if that's a status you use.
export async function getPendingCommentsCount(): Promise<number> {
  try {
    // If 'pending' is no longer a primary status, this query needs adjustment
    // For now, assuming it might still be used by an admin to manually mark a comment.
    const q = query(collection(db, 'comments'), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching pending comments count:', error);
    return 0;
  }
}
