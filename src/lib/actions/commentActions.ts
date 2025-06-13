
'use server';

import { db } from '@/lib/firebase';
import type { Comment, Figure, UserRating } from '@/lib/types'; // UserRating might be needed if perception is also updated here
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, increment, runTransaction } from 'firebase/firestore';

// Add a new comment to Firestore
export async function addComment(
  figureId: string,
  figureName: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | undefined,
  commentText: string,
  parentCommentId: string | null,
  starRatingGivenByAuthor?: number // Optional star rating
): Promise<{ success: boolean; commentId?: string; message: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  if (!figureId || !commentText.trim()) {
    return { success: false, message: 'Figure ID and comment text are required.' };
  }
  if (starRatingGivenByAuthor !== undefined && (starRatingGivenByAuthor < 1 || starRatingGivenByAuthor > 5)) {
    return { success: false, message: 'Star rating must be between 1 and 5.'};
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
      status: 'approved', // Comments are now approved by default
      timestamp: serverTimestamp(),
      starRatingGivenByAuthor: starRatingGivenByAuthor,
    };

    const commentsCollectionRef = collection(db, 'comments');
    const newCommentRef = doc(commentsCollectionRef); // Create a new doc ref to get ID before transaction

    // If stars are provided, update figure aggregates
    if (starRatingGivenByAuthor !== undefined && starRatingGivenByAuthor >= 1 && starRatingGivenByAuthor <= 5) {
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
        const newSumOfStars = (currentAverageRating * currentTotalRatings) + starRatingGivenByAuthor;
        const newAverageRating = newTotalRatings > 0 ? newSumOfStars / newTotalRatings : 0;

        transaction.update(figureRef, {
          averageRating: newAverageRating,
          totalRatings: newTotalRatings,
        });
        
        // Set the comment document within the same transaction
        transaction.set(newCommentRef, commentData);
      });
    } else {
      // If no stars, just add the comment
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
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
      } as Comment); // starRatingGivenByAuthor is already part of data if it exists
    });

    // Structure replies
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
  // Simplified: backend just increments/decrements. UI could track user's specific vote.
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is missing.' };
  }
  
  const commentRef = doc(db, 'comments', commentId);

  try {
    // This is a simplified increment. A real system might want to track if a user already voted.
    const fieldToIncrement = reactionType === 'like' ? 'likesCount' : 'dislikesCount';
    await updateDoc(commentRef, {
      [fieldToIncrement]: increment(1)
    });
    // To implement toggle or preventing multiple votes from same user, you'd need more complex logic,
    // possibly involving reading the user's previous reaction state.
    return { success: true, message: 'Reaction updated.' };
  } catch (error) {
    console.error('Error updating comment reaction:', error);
    return { success: false, message: 'Failed to update reaction.' };
  }
}

// Get all comments for moderation (admin)
export async function getAllCommentsForModeration(): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('status', 'asc'), 
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(commentsQuery);
    const comments: Comment[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      comments.push({ 
        id: docSnap.id,
         ...data,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
      } as Comment);
    });
    return comments;
  } catch (error) {
    console.error('Error fetching all comments for moderation:', error);
    return [];
  }
}

// Moderate a comment (approve or reject)
export async function moderateComment(
  commentId: string,
  newStatus: 'approved' | 'rejected'
): Promise<{ success: boolean; message: string }> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is missing.' };
  }
  const commentRef = doc(db, 'comments', commentId);
  try {
    await updateDoc(commentRef, { status: newStatus });
    // If a comment is rejected, we might need to reverse its contribution to figure's star ratings.
    // This part is complex and not implemented here for brevity.
    // It would require storing the original star rating if the comment is rejected and then removed.
    return { success: true, message: `Comment status updated to ${newStatus}.` };
  } catch (error) {
    console.error('Error moderating comment:', error);
    return { success: false, message: 'Failed to moderate comment.' };
  }
}


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
